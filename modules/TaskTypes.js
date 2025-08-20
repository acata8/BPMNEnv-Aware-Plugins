import movementIcon from "../icons/customTask/movement.svg";
import bindIcon from "../icons/customTask/binding.svg";
import unbindIcon from "../icons/customTask/unbinding.svg";

export const TASK_TYPE_KEYS = {
  MOVEMENT: "movement",
  BINDING: "binding", 
  UNBINDING: "unbinding"
};

export const TASK_TYPES_CONFIG = {
  [TASK_TYPE_KEYS.MOVEMENT]: {
    key: TASK_TYPE_KEYS.MOVEMENT,
    typeValue: "Movement",
    displayName: "Move to destination",
    icon: { class: "movement-badge", iconFile: movementIcon },
    extensionElements: ["space:Destination"],
    defaultDestination: "${destination}",
    validationRules: [], // Movement has no special validation rules
    formType: "destination"
  },
  [TASK_TYPE_KEYS.BINDING]: {
    key: TASK_TYPE_KEYS.BINDING, 
    typeValue: "Bind",
    displayName: "Bind",
    icon: { class: "binding-badge", iconFile: bindIcon },
    extensionElements: ["space:Binding"],
    validationRules: [
      "noDownstreamUnbinding" // Prevent changing FROM binding if unbinding exists downstream
    ],
    formType: "binding"
  },
  [TASK_TYPE_KEYS.UNBINDING]: {
    key: TASK_TYPE_KEYS.UNBINDING,
    typeValue: "Unbind", 
    displayName: "Unbind",
    icon: { class: "unbinding-badge", iconFile: unbindIcon },
    extensionElements: [],
    validationRules: [
      "requiresUpstreamBinding" // Ensure there's a binding task upstream
    ],
    formType: "none"
  }
};

export const EXTENSION_TYPES = {
  TYPE: "space:Type",
  DESTINATION: "space:Destination", 
  BINDING: "space:Binding"
};

// Validation rule definitions for clarity
export const VALIDATION_RULES = {
  requiresUpstreamBinding: {
    description: "Task requires a preceding Binding task in the same pool",
    appliesTo: [TASK_TYPE_KEYS.UNBINDING]
  },
  noDownstreamUnbinding: {
    description: "Prevents changing from Binding if Unbinding tasks exist downstream",
    appliesTo: [TASK_TYPE_KEYS.BINDING]
  }
};

export const getTaskConfig = (key) => TASK_TYPES_CONFIG[key];
export const getAllTaskTypes = () => Object.values(TASK_TYPES_CONFIG);
export const getTaskByTypeValue = (typeValue) => 
  Object.values(TASK_TYPES_CONFIG).find(t => 
    t.typeValue.toLowerCase() === typeValue.toLowerCase()
  );
export const getTaskKeys = () => Object.keys(TASK_TYPES_CONFIG);
export const hasTaskType = (key) => key in TASK_TYPES_CONFIG;

// Validation helpers
export const getValidationRules = (taskKey) => {
  const config = getTaskConfig(taskKey);
  return config ? config.validationRules : [];
};

export const requiresValidation = (fromType, toType) => {
  // Changing FROM binding requires validation
  if (fromType === TASK_TYPE_KEYS.BINDING && toType !== TASK_TYPE_KEYS.BINDING) return true;
  
  // Changing TO unbinding requires validation  
  if (toType === TASK_TYPE_KEYS.UNBINDING) return true;
  
  return false;
};