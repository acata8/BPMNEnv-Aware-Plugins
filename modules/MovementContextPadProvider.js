// modules/MovementContextPadProvider.js
// Context pad: "Set Type…" apre un menu (chiude il djs-context-pad).
// Clic su "Movement" -> input in-place (placeholder ${destination}).
// Salvataggio: space:type=movement, space:destination aggiornato,
// label (TextAnnotation) sotto al task creata/aggiornata, collegata con Association.

import movementIcon from '../icons/movement.svg';
import bindIcon from '../icons/binding.svg';
import unbindIcon from '../icons/unbinding.svg';

function MovementContextPadProvider(
  contextPad,
  modeling,
  bpmnFactory,
  elementFactory,
  overlays,
  eventBus,
  translate
) {
  this._contextPad = contextPad;
  this._modeling = modeling;
  this._bpmnFactory = bpmnFactory;
  this._elementFactory = elementFactory;
  this._overlays = overlays;
  this._eventBus = eventBus;
  this._translate = translate;

  this._openMenus = new Map(); // element.id -> overlayId

  contextPad.registerProvider(this);

  eventBus.on('shape.remove', ({ element }) => this._closeMenu(element));
}

MovementContextPadProvider.$inject = [
  'contextPad',
  'modeling',
  'bpmnFactory',
  'elementFactory',
  'overlays',
  'eventBus',
  'translate'
];

/* ---------------- helpers ---------------- */

function extValues(bo) {
  return (bo.extensionElements && bo.extensionElements.values) || [];
}

function getTypeEl(bo) {
  return extValues(bo).find(v => v.$type === 'space:Type');
}

function getDestEl(bo) {
  return extValues(bo).find(v => v.$type === 'space:Destination');
}

function isTask(el) {
  return el && el.type === 'bpmn:Task';
}

MovementContextPadProvider.prototype._ensureExt = function(element, bo) {
  if (!bo.extensionElements) {
    const ext = this._bpmnFactory.create('bpmn:ExtensionElements', { values: [] });
    this._modeling.updateModdleProperties(element, bo, { extensionElements: ext });
  }
};

MovementContextPadProvider.prototype._setType = function(element, value) {
  const bo = element.businessObject;
  this._ensureExt(element, bo);

  let typeEl = getTypeEl(bo);
  if (!typeEl) {
    typeEl = this._bpmnFactory.create('space:Type', { value });
    const values = [ ...(bo.extensionElements.values || []), typeEl ];
    this._modeling.updateModdleProperties(element, bo.extensionElements, { values });
  } else {
    this._modeling.updateModdleProperties(element, typeEl, { value });
  }
};

/**
 * Trova una TextAnnotation già associata al task.
 * Preferisce quella il cui testo coincide con quello che vogliamo mostrare,
 * altrimenti restituisce la prima annotazione associata (se ce n'è una sola).
 */
MovementContextPadProvider.prototype._findDestAnnotation = function(element, desiredText) {
  const outgoing = element.outgoing || [];
  const candidates = [];

  for (const conn of outgoing) {
    if (conn.type !== 'bpmn:Association' || !conn.target || conn.target.type !== 'bpmn:TextAnnotation') {
      continue;
    }
    const taShape = conn.target;
    const text = (taShape.businessObject.text || '').trim();
    candidates.push({ shape: taShape, text });
    if (desiredText && text === desiredText) {
      return taShape;
    }
  }

  // se ce n'è una sola, usiamo quella
  if (candidates.length === 1) return candidates[0].shape;

  // altrimenti nessuna corrispondenza certa
  return null;
};

/**
 * Crea o aggiorna la TextAnnotation (label) sotto al task.
 * Testo: solo il valore; se vuoto -> "${destination}".
 */
MovementContextPadProvider.prototype._createOrUpdateDestLabel = function(element, value) {
  const displayText = (value && value.trim()) ? value.trim() : '${destination}';
  const existing = this._findDestAnnotation(element, displayText);

  if (existing) {
    // Aggiorna testo annotazione esistente
    this._modeling.updateModdleProperties(existing, existing.businessObject, { text: displayText });
    return;
  }

  // Crea nuova TextAnnotation
  const annotationShape = this._elementFactory.createShape({ type: 'bpmn:TextAnnotation' });
  annotationShape.businessObject.text = displayText;

  // Posiziona SOTTO il task
  const dy = Math.max(60, element.height * 0.8);
  const pos = {
    x: element.x,                                // allineata in X all'elemento (puoi centrarla se vuoi)
    y: element.y + element.height / 2 + dy       // sotto il task
  };

  // Aggiungi al diagramma
  const parent = element.parent;
  const created = this._modeling.createShape(annotationShape, pos, parent);

  // Collega con Association (task -> annotazione)
  this._modeling.connect(element, created, { type: 'bpmn:Association' });
};

/* ---------------- menu overlay ---------------- */

MovementContextPadProvider.prototype._openMenu = function(element) {
  // Chiudi subito il context pad
  this._contextPad.close();

  this._closeMenu(element);

  const t = this._translate;
  const wrap = document.createElement('div');
  wrap.className = 'movement-type-menu';
  wrap.innerHTML = this._menuMarkup(t);

  const overlayId = this._overlays.add(element, 'movement-type-menu', {
    position: { top: 8, left: 8 },
    html: wrap,
    scale: true
  });
  this._openMenus.set(element.id, overlayId);

  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-type]');
    if (!btn) return;

    const chosen = btn.getAttribute('data-type');

    if (chosen === 'movement') {
      // swap sul form nella STESSA overlay
      this._renderMovementForm(wrap, element);
    } else {
      // placeholder per bind/unbind
      this._closeMenu(element);
    }
  });
};

MovementContextPadProvider.prototype._menuMarkup = function(t) {
  return `
    <div class="title">${t('Set Task Type')}</div>
    <div class="buttons">
      <button type="button" data-type="movement" class="btn primary">
        <img src="${movementIcon}" />
        <span>${t('Movement')}</span>
      </button>
      <button type="button" data-type="bind" class="btn">
        <img src="${bindIcon}" />
        <span>${t('Binding')}</span>
      </button>
      <button type="button" data-type="unbind" class="btn">
        <img src="${unbindIcon}" />
        <span>${t('Unbinding')}</span>
      </button>
    </div>
  `;
};

MovementContextPadProvider.prototype._renderMovementForm = function(container, element) {
  const t = this._translate;
  const bo = element.businessObject;
  const current = (getDestEl(bo)?.value || '').toString();

  container.innerHTML = `
    <div class="title">${t('Set destination')}</div>
    <div class="row">
      <input type="text" class="movement-dest-input" placeholder="\${destination}" />
    </div>
    <div class="actions">
      <button type="button" class="btn-save">${t('Save')}</button>
      <button type="button" class="btn-cancel">${t('Cancel')}</button>
    </div>
  `;

  const input = container.querySelector('.movement-dest-input');
  input.value = current;

  const onSave = () => {
    const next = input.value;

    // 1) type = movement
    this._setType(element, 'movement');

    // 2) ensure extension + destination value
    this._ensureExt(element, bo);
    let dest = getDestEl(bo);
    if (!dest) {
      dest = this._bpmnFactory.create('space:Destination', { value: next });
      const values = [ ...(bo.extensionElements.values || []), dest ];
      this._modeling.updateModdleProperties(element, bo.extensionElements, { values });
    } else {
      this._modeling.updateModdleProperties(element, dest, { value: next });
    }

    // 3) crea/aggiorna label (sotto il task)
    this._createOrUpdateDestLabel(element, next);

    // chiudi overlay
    this._closeMenu(element);
    // opzionale: riapri il context pad
    // this._contextPad.open(element);
  };

  const onCancel = () => this._closeMenu(element);

  container.querySelector('.btn-save').addEventListener('click', onSave);
  container.querySelector('.btn-cancel').addEventListener('click', onCancel);

  const keyHandler = (e) => {
    if (e.key === 'Enter') onSave();
    if (e.key === 'Escape') onCancel();
  };
  container.addEventListener('keydown', keyHandler);

  setTimeout(() => input && input.focus(), 0);
};

MovementContextPadProvider.prototype._closeMenu = function(element) {
  const id = this._openMenus.get(element?.id);
  if (id) {
    this._overlays.remove(id);
    this._openMenus.delete(element.id);
  }
};

/* ---------------- context pad entries ---------------- */

MovementContextPadProvider.prototype.getContextPadEntries = function(element) {
  const t = this._translate;

  if (!isTask(element)) return {};

  return {
    'movement.open-type-menu': {
      group: 'edit',
      className: 'bpmn-icon-subprocess-collapsed',
      title: t('Set Type…'),
      action: { click: () => this._openMenu(element) }
    }
  };
};

/* ---------------- module descriptor ---------------- */

export default {
  __init__: [ 'movementContextPadProvider' ],
  movementContextPadProvider: [ 'type', MovementContextPadProvider ]
};
