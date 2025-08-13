// Shows a small badge on tasks with space:type = bind / unbind.
// Accepts both "bind" | "binding" and "unbind" | "unbinding".
// Also supports fallback via camunda:Properties[name="space:type"].

function BindingOverlay(eventBus, overlays, elementRegistry) {
  this._overlays = overlays;
  this._registry = elementRegistry;

  // --- helpers ---------------------------------------------------------------

  function getSpaceTypeFromExt(bo) {
    const ex = bo.extensionElements && bo.extensionElements.values;
    if (!ex) return null;

    // direct <space:Type value="...">
    const typeEl = ex.find(v => v.$type === 'space:Type');
    if (typeEl && typeEl.value) return String(typeEl.value).toLowerCase();

    // fallback camunda:Properties[name="space:type"]
    const camProps = ex.find(v => v.$type === 'camunda:Properties');
    if (camProps && camProps.values) {
      const prop = camProps.values.find(p => p.name === 'space:type');
      if (prop && prop.value) return String(prop.value).toLowerCase();
    }

    return null;
  }

  function normalizeBinding(type) {
    if (!type) return null;
    if (type === 'bind' || type === 'binding') return 'bind';
    if (type === 'unbind' || type === 'unbinding') return 'unbind';
    return null;
  }

  function isTask(element) {
    return element && element.type === 'bpmn:Task' && element.businessObject;
  }

  const updateBadge = (element) => {
    if (!isTask(element)) return;

    const type = normalizeBinding(getSpaceTypeFromExt(element.businessObject));

    // Clear any previous badges of both kinds first
    const prevBind = this._overlays.get({ element, type: 'binding-badge' }) || [];
    prevBind.forEach(o => this._overlays.remove(o.id));
    const prevUnbind = this._overlays.get({ element, type: 'unbinding-badge' }) || [];
    prevUnbind.forEach(o => this._overlays.remove(o.id));

    // Render badge by type
    if (type === 'bind') {
      this._overlays.add(element, 'binding-badge', {
        scale: true,
        position: { top: 0, left: 0 },
        html: '<div class="binding-badge" title="Bind"></div>'
      });
    }

    if (type === 'unbind') {
      this._overlays.add(element, 'unbinding-badge', {
        scale: true,
          position: { top: 0, left: 0 },
        html: '<div class="unbinding-badge" title="Unbind"></div>'
      });
    }
  };



  // --- lifecycle -------------------------------------------------------------

  eventBus.on('import.render.complete', () => {
    this._registry.getAll().forEach(updateBadge);
  });

  eventBus.on('shape.added', ({ element }) => updateBadge(element));
  eventBus.on('shape.changed', ({ element }) => updateBadge(element));
  eventBus.on('elements.changed', ({ elements }) => elements && elements.forEach(updateBadge));

  // Optional: if you edit type via your context-pad, you may want to re-run updateBadge
  // after properties updates, e.g. listen to command stack:
  eventBus.on('commandStack.element.updateModdleProperties.executed', (e) => {
    const el = e && e.context && e.context.element;
    if (el) updateBadge(el);
  });
}

BindingOverlay.$inject = [ 'eventBus', 'overlays', 'elementRegistry' ];

export default {
  __init__: [ 'bindingOverlay' ],
  bindingOverlay: [ 'type', BindingOverlay ]
};
