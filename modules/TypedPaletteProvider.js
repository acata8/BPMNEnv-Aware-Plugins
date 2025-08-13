import TASK_TYPES from './TaskTypes';

function TypedPaletteProvider(palette, create, elementFactory, translate) {
  this._create = create;
  this._elementFactory = elementFactory;
  this._translate = translate;
  palette.registerProvider(this);
}

TypedPaletteProvider.$inject = ['palette', 'create', 'elementFactory', 'translate'];

TypedPaletteProvider.prototype.getPaletteEntries = function () {
  const { _create: create, _elementFactory: elementFactory, _translate: t } = this;

  function createTask(event, cfg) {
    const shape = elementFactory.createShape({ type: 'bpmn:Task' });
    const bo = shape.businessObject;

    bo.name = cfg.defaultName;

    const moddle = bo.$model;
    if (!bo.extensionElements) {
      bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] });
    }

    const typeEl = moddle.create('space:Type', { value: cfg.typeValue });

    bo.extensionElements.values = [
      ...(bo.extensionElements.values || []),
      ...(cfg.extraExt ? cfg.extraExt(moddle) : []),
      typeEl
    ];

    create.start(event, shape);
  }

  return TASK_TYPES.reduce((entries, cfg) => {
    entries[`${cfg.key}.task`] = {
      group: 'activity',
      className: `bpmn-icon-task ${cfg.iconClass}`,
      title: t(`Create ${cfg.key.toUpperCase()} Task`),
      action: {
        dragstart: (e) => createTask(e, cfg),
        click: (e) => createTask(e, cfg)
      }
    };
    return entries;
  }, {});
};

export default {
  __init__: ['typedPaletteProvider'],
  typedPaletteProvider: ['type', TypedPaletteProvider]
};
