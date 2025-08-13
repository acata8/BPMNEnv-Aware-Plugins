// Adds a palette entry that drops a plain BPMN Task with extension elements.
function MovementPaletteProvider(palette, create, elementFactory, translate) {
  this._create = create;
  this._elementFactory = elementFactory;
  this._translate = translate;

  palette.registerProvider(this);
}
MovementPaletteProvider.$inject = [ 'palette', 'create', 'elementFactory', 'translate' ];

MovementPaletteProvider.prototype.getPaletteEntries = function() {
  const { _create: create, _elementFactory: elementFactory, _translate: t } = this;

  function createMovementTask(event) {
    const shape = elementFactory.createShape({ type: 'bpmn:Task' });
    const bo = shape.businessObject;

    // 1) Display name
    bo.name = 'Move to destination';

    // 2) Ensure extensionElements
    const moddle = bo.$model;
    if (!bo.extensionElements) {
      bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] });
    }

    // 3) Create <space:destination> and <space:type>
    const destinationEl = moddle.create('space:Destination', { value: '${destination}' });
    const typeEl        = moddle.create('space:Type',        { value: 'movement' });

    // 4) Append
    bo.extensionElements.values = [
      ...(bo.extensionElements.values || []),
      destinationEl,
      typeEl
    ];

    create.start(event, shape);
  }

  return {
    'movement.task': {
      group: 'activity',
      className: 'bpmn-icon-task movement-overlay',
      title: t('Create MOVEMENT Task'),
      action: {
        dragstart: createMovementTask,
        click: createMovementTask
      }
    }
  };
};

export default {
  __init__: [ 'movementPaletteProvider' ],
  movementPaletteProvider: [ 'type', MovementPaletteProvider ]
};
