// Adds two palette entries that drop a BPMN Task with extension elements:
//   Bind   -> <space:type>bind</space:type>
//   Unbind -> <space:type>unbind</space:type>

import bindIcon from '../icons/binding.svg';
import unbindIcon from '../icons/unbinding.svg';

function BindingPaletteProvider(palette, create, elementFactory, translate) {
  this._create = create;
  this._elementFactory = elementFactory;
  this._translate = translate;

  palette.registerProvider(this);
}

BindingPaletteProvider.$inject = [ 'palette', 'create', 'elementFactory', 'translate' ];

BindingPaletteProvider.prototype.getPaletteEntries = function() {
  const { _create: create, _elementFactory: elementFactory, _translate: t } = this;

  function createTaskWithType(event, typeValue, defaultName) {
    const shape = elementFactory.createShape({ type: 'bpmn:Task' });
    const bo = shape.businessObject;

    // Optional display name
    bo.name = defaultName;

    // Ensure extensionElements
    const moddle = bo.$model;
    if (!bo.extensionElements) {
      bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] });
    }

    // Create <space:Type>
    const typeEl = moddle.create('space:Type', { value: typeValue });

    // Append
    bo.extensionElements.values = [
      ...(bo.extensionElements.values || []),
      typeEl
    ];

    create.start(event, shape);
  }

  return {
    'bind.task': {
      group: 'activity',
      className: 'bpmn-icon-task binding-overlay',
      title: t('Create BIND Task'),
      action: {
        dragstart: (e) => createTaskWithType(e, 'bind', t('Bind')),
        click:     (e) => createTaskWithType(e, 'bind', t('Bind'))
      }
    },
    'unbind.task': {
      group: 'activity',
      className: 'bpmn-icon-task unbinding-overlay',
      title: t('Create UNBIND Task'),
      action: {
        dragstart: (e) => createTaskWithType(e, 'unbind', t('Unbind')),
        click:     (e) => createTaskWithType(e, 'unbind', t('Unbind'))
      }
    }
  };
};

export default {
  __init__: [ 'bindingPaletteProvider' ],
  bindingPaletteProvider: [ 'type', BindingPaletteProvider ]
};
