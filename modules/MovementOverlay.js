// modules/TypedOverlay.js
// One overlay for movement / bind / unbind badges.

import movementIcon from '../icons/movement.svg';
import bindIcon from '../icons/binding.svg';
import unbindIcon from '../icons/unbinding.svg';

function TypedOverlay(eventBus, overlays, elementRegistry) {
  this._overlays = overlays;
  this._registry = elementRegistry;

  const TYPES = {
    movement:  { overlayType: 'movement-badge',   title: 'Movement', icon: movementIcon,  pos: { top: 0, left: 0 } },
    bind:      { overlayType: 'binding-badge',    title: 'Bind',     icon: bindIcon,      pos: { top: 0, left: 0 } },
    unbind:    { overlayType: 'unbinding-badge',  title: 'Unbind',   icon: unbindIcon,    pos: { top: 0, left: 0 } }
  };

  function getSpaceTypeFromExt(bo) {
    const ex = bo.extensionElements && bo.extensionElements.values;
    if (!ex) return null;

    // direct <space:Type value="...">
    const typeEl = ex.find(v => v.$type === 'space:Type');
    if (typeEl?.value) return String(typeEl.value).toLowerCase();

    // fallback camunda:Properties[name="space:type"]
    const camProps = ex.find(v => v.$type === 'camunda:Properties');
    if (camProps?.values) {
      const prop = camProps.values.find(p => p.name === 'space:type');
      if (prop?.value) return String(prop.value).toLowerCase();
    }

    return null;
  }

  function normalizeType(type) {
    if (!type) return null;
    if (type === 'bind' || type === 'binding') return 'bind';
    if (type === 'unbind' || type === 'unbinding') return 'unbind';
    if (type === 'movement') return 'movement';
    return null;
  }

  function isTask(element) {
    return element && element.type === 'bpmn:Task' && element.businessObject;
  }

  const updateBadge = (element) => {
    if (!isTask(element)) return;

    // Remove all known badges first
    Object.values(TYPES).forEach(({ overlayType }) => {
      (this._overlays.get({ element, type: overlayType }) || []).forEach(o => this._overlays.remove(o.id));
    });

    const type = normalizeType(getSpaceTypeFromExt(element.businessObject));
    if (!type) return;

    const conf = TYPES[type];
    if (!conf) return;

    this._overlays.add(element, conf.overlayType, {
      scale: true,
      position: conf.pos,
      html: `<div class="${conf.overlayType}" title="${conf.title}" style="
        width: 20px;
        height: 20px;
        background: url('${conf.icon}') no-repeat center / contain;
        pointer-events: none;
      "></div>`
    });
  };

  // lifecycle
  eventBus.on('import.render.complete', () => {
    this._registry.getAll().forEach(updateBadge);
  });

  eventBus.on('shape.added',   ({ element }) => updateBadge(element));
  eventBus.on('shape.changed', ({ element }) => updateBadge(element));
  eventBus.on('elements.changed', ({ elements }) => elements && elements.forEach(updateBadge));

  eventBus.on('commandStack.element.updateModdleProperties.executed', (e) => {
    const el = e?.context?.element;
    if (el) updateBadge(el);
  });
}

TypedOverlay.$inject = [ 'eventBus', 'overlays', 'elementRegistry' ];

export default {
  __init__: [ 'typedOverlay' ],
  typedOverlay: [ 'type', TypedOverlay ]
};
