// modules/CustomReplaceProvider.js
import movementIcon from '../icons/customTask/movement.svg';
import bindingIcon from '../icons/customTask/binding.svg';
import unbindingIcon from '../icons/customTask/unbinding.svg';

const TARGET = 'bpmn-replace';

function CustomReplaceProvider(popupMenu, eventBus, translate, taskTypeService) {
  this._popupMenu = popupMenu;
  this._eventBus = eventBus;
  this._translate = translate;
  this._taskTypeService = taskTypeService;

  // register with the Change element popup
  popupMenu.registerProvider(TARGET, this);
}

CustomReplaceProvider.$inject = [
  'popupMenu',
  'eventBus',
  'translate',
  'taskTypeService'
];

// show for any kind of Task
function isSupported(element) {
  const bo = element && element.businessObject;
  if (!bo) return false;
  return /bpmn:(.+)Task$/.test(bo.$type) || bo.$type === 'bpmn:Task';
}

CustomReplaceProvider.prototype.getEntries = function(element) {
  if (!isSupported(element)) return [];

  const t = this._translate;
  const taskTypeService = this._taskTypeService;
  const eventBus = this._eventBus;

  const setType = (type) => () => {
    taskTypeService.setType(element, type);
    eventBus.fire('elements.changed', { elements: [ element ] });
  };

  const entry = (id, label, imageUrl, action) => ({
    id,
    label: t(label),
    // className gives us a stable hook for CSS icons
    className: 'bpmn-replace-entry bpmn-icon-space-' + id,
    // imageUrl is supported in newer Modeler versions; harmless otherwise
    imageUrl,
    action: { click: action, dragstart: action },
    group: 'default'
  });

  return [
    entry('movement',  'Movement task',  movementIcon,  setType('movement')),
    entry('binding',   'Binding task',   bindingIcon,   setType('binding')),
    entry('unbinding', 'Unbinding task', unbindingIcon, setType('unbinding'))
  ];
};

// optional; leave empty
CustomReplaceProvider.prototype.getHeaderEntries = function() { return []; };

// export as a DI module
export default {
  __init__: [ 'customReplaceProvider' ],
  customReplaceProvider: [ 'type', CustomReplaceProvider ]
};
