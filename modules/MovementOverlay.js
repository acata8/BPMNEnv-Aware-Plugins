function MovementOverlay(eventBus, overlays, elementRegistry) {
  this._overlays = overlays;
  this._registry = elementRegistry;

  const isMovementBySpace = (bo) => {
    const ex = bo.extensionElements && bo.extensionElements.values;
    if (!ex) return false;
    const spaceType = ex.find(v => v.$type === 'space:Type');
    return !!(spaceType && String(spaceType.value).toLowerCase() === 'movement');
  };

  const isMovementByCamundaProp = (bo) => {
    const ex = bo.extensionElements && bo.extensionElements.values;
    if (!ex) return false;
    const camProps = ex.find(v => v.$type === 'camunda:Properties');
    if (!camProps || !camProps.values) return false;
    const typeProp = camProps.values.find(p => p.name === 'space:type');
    return !!(typeProp && String(typeProp.value).toLowerCase() === 'movement');
  };

  const isMovementTask = (element) => {
    if (!element || element.type !== 'bpmn:Task' || !element.businessObject) return false;
    const bo = element.businessObject;
    return isMovementBySpace(bo) || isMovementByCamundaProp(bo);
  };

  const updateBadge = (element) => {
    if (!element) return;

    const existing = this._overlays.get({ element, type: 'movement-badge' }) || [];
    existing.forEach(o => this._overlays.remove(o.id));

    if (isMovementTask(element)) {
      this._overlays.add(element, 'movement-badge', {
        position: { top: 6, right: 6 },
        html: '<div class="movement-di-badge" title="MOVEMENT"></div>'
      });
    }
  };

  eventBus.on('import.render.complete', () => {
    this._registry.getAll().forEach(updateBadge);
  });
  eventBus.on('shape.added', ({ element }) => updateBadge(element));
  eventBus.on('shape.changed', ({ element }) => updateBadge(element));
  eventBus.on('elements.changed', ({ elements }) => elements && elements.forEach(updateBadge));
}

MovementOverlay.$inject = [ 'eventBus', 'overlays', 'elementRegistry' ];

export default {
  __init__: [ 'movementOverlay' ],
  movementOverlay: [ 'type', MovementOverlay ]
};
