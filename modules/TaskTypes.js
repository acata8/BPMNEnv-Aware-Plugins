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
    extensionElements: ["space:Type", "space:Destination"], // Keep Type
    defaultDestination: "${destination}",
    validationRules: [],
    formType: "destination"
  },
  [TASK_TYPE_KEYS.BINDING]: {
    key: TASK_TYPE_KEYS.BINDING, 
    typeValue: "Binding",
    displayName: "Binding",
    icon: { class: "binding-badge", iconFile: bindIcon },
    extensionElements: ["space:Type"], // KEEP Type for task identification
    validationRules: [],
    formType: "none" // No form - binding details in message flow
  },
  [TASK_TYPE_KEYS.UNBINDING]: {
    key: TASK_TYPE_KEYS.UNBINDING,
    typeValue: "Unbinding", 
    displayName: "Unbinding",
    icon: { class: "unbinding-badge", iconFile: unbindIcon },
    extensionElements: ["space:Type"], // KEEP Type for task identification
    validationRules: ["requiresUpstreamBinding"],
    formType: "none" // No form - unbinding details in message flow
  }
};

export const EXTENSION_TYPES = {
  TYPE: "space:Type",
  DESTINATION: "space:Destination",
  PARTICIPANT1: "space:Participant1",
  PARTICIPANT2: "space:Participant2"
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