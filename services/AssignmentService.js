import { EXTENSION_TYPES } from '../modules/TaskTypes';

/**
 * AssignmentService - Manages task assignments for place attributes
 * 
 * Responsibilities:
 * - Add/remove/update task assignments
 * - Handle multiple assignments per task
 * - Parse and validate assignment conditions and values
 * - Provide utilities for assignment operations
 */
export function AssignmentService(modeling, bpmnFactory, extensionService) {
  this.modeling = modeling;
  this.bpmnFactory = bpmnFactory;
  this.extensionService = extensionService;
}

AssignmentService.$inject = ['modeling', 'bpmnFactory', 'extensionService'];

/**
 * Get all assignments for a task element
 * @param {Object} element - BPMN task element
 * @returns {Array} Array of assignment objects {condition, value}
 */
AssignmentService.prototype.getAssignments = function(element) {
  if (!element?.businessObject) return [];
  
  const assignments = [];
  const extensions = this.extensionService.getExtensionValues(element.businessObject);
  
  // Collect all assignment pairs
  const conditions = extensions.filter(ext => ext.$type === EXTENSION_TYPES.TASK_ASSIGNMENT);
  const values = extensions.filter(ext => ext.$type === EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED);
  
  // Pair conditions with values based on order
  const maxLength = Math.max(conditions.length, values.length);
  for (let i = 0; i < maxLength; i++) {
    assignments.push({
      id: `assignment_${i}`,
      condition: conditions[i] ? this.extensionService.getText(conditions[i]) : '',
      value: values[i] ? this.extensionService.getText(values[i]) : ''
    });
  }
  
  return assignments;
};

/**
 * Add a new assignment to a task
 * @param {Object} element - BPMN task element
 * @param {string} condition - Starting condition
 * @param {string} value - Value to assign
 */
AssignmentService.prototype.addAssignment = function(element, condition, value) {
  const bo = element.businessObject;
  this.extensionService.ensureExtensionElements(element, bo);
  
  // Create new assignment elements
  const conditionElement = this.bpmnFactory.create(EXTENSION_TYPES.TASK_ASSIGNMENT, {
    body: condition || ''
  });
  
  const valueElement = this.bpmnFactory.create(EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED, {
    body: value || ''
  });
  
  // Add to extension elements
  const currentValues = [...(bo.extensionElements.values || [])];
  currentValues.push(conditionElement);
  currentValues.push(valueElement);
  
  this.modeling.updateModdleProperties(element, bo.extensionElements, {
    values: currentValues
  });
};

/**
 * Update an existing assignment
 * @param {Object} element - BPMN task element
 * @param {number} index - Assignment index to update
 * @param {string} condition - New condition
 * @param {string} value - New value
 */
AssignmentService.prototype.updateAssignment = function(element, index, condition, value) {
  const bo = element.businessObject;
  if (!bo.extensionElements) return;
  
  const extensions = bo.extensionElements.values || [];
  const conditions = extensions.filter(ext => ext.$type === EXTENSION_TYPES.TASK_ASSIGNMENT);
  const values = extensions.filter(ext => ext.$type === EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED);
  
  // Update condition if it exists
  if (conditions[index]) {
    this.modeling.updateModdleProperties(element, conditions[index], {
      body: condition || ''
    });
  }
  
  // Update value if it exists
  if (values[index]) {
    this.modeling.updateModdleProperties(element, values[index], {
      body: value || ''
    });
  }
};

/**
 * Remove an assignment from a task
 * @param {Object} element - BPMN task element
 * @param {number} index - Assignment index to remove
 */
AssignmentService.prototype.removeAssignment = function(element, index) {
  const bo = element.businessObject;
  if (!bo.extensionElements) return;
  
  const extensions = bo.extensionElements.values || [];
  const conditions = extensions.filter(ext => ext.$type === EXTENSION_TYPES.TASK_ASSIGNMENT);
  const values = extensions.filter(ext => ext.$type === EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED);
  
  // Build new values array without the removed assignment
  const newValues = extensions.filter((ext, i) => {
    const isCondition = ext.$type === EXTENSION_TYPES.TASK_ASSIGNMENT;
    const isValue = ext.$type === EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED;
    
    if (isCondition) {
      const conditionIndex = conditions.indexOf(ext);
      return conditionIndex !== index;
    }
    
    if (isValue) {
      const valueIndex = values.indexOf(ext);
      return valueIndex !== index;
    }
    
    return true; // Keep other extension types
  });
  
  this.modeling.updateModdleProperties(element, bo.extensionElements, {
    values: newValues
  });
};

/**
 * Clear all assignments from a task
 * @param {Object} element - BPMN task element
 */
AssignmentService.prototype.clearAssignments = function(element) {
  const bo = element.businessObject;
  if (!bo.extensionElements) return;
  
  const newValues = (bo.extensionElements.values || []).filter(ext => 
    ext.$type !== EXTENSION_TYPES.TASK_ASSIGNMENT && 
    ext.$type !== EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED
  );
  
  this.modeling.updateModdleProperties(element, bo.extensionElements, {
    values: newValues
  });
};

/**
 * Parse an assignment condition or value
 * Returns object with place, attribute, and value/condition
 * @param {string} text - Text to parse (e.g., "place1.temperature = 20")
 * @returns {Object} Parsed assignment {place, attribute, operator, value}
 */
AssignmentService.prototype.parseAssignment = function(text) {
  if (!text) return null;
  
  // Simple regex to parse place.attribute = value or place.attribute operator value
  const match = text.match(/^([^.]+)\.([^=<>!]+)\s*([=<>!]+)\s*(.+)$/);
  
  if (match) {
    return {
      place: match[1].trim(),
      attribute: match[2].trim(),
      operator: match[3].trim(),
      value: match[4].trim()
    };
  }
  
  return null;
};

/**
 * Validate an assignment against available places and attributes
 * @param {string} condition - Condition to validate
 * @param {string} value - Value to validate
 * @param {Object} environmentService - Environment service instance
 * @returns {Object} Validation result {valid, errors}
 */
AssignmentService.prototype.validateAssignment = function(condition, value, environmentService) {
  const errors = [];
  
  // Parse condition
  const conditionParsed = this.parseAssignment(condition);
  if (condition && !conditionParsed) {
    errors.push('Invalid condition format. Use: place.attribute = value');
  } else if (conditionParsed && environmentService.hasConfiguration()) {
    const place = environmentService.findPlaceById(conditionParsed.place);
    if (!place) {
      errors.push(`Place '${conditionParsed.place}' not found in environment`);
    }
  }
  
  // Parse value assignment
  const valueParsed = this.parseAssignment(value);
  if (value && !valueParsed) {
    errors.push('Invalid assignment format. Use: place.attribute = value');
  } else if (valueParsed && environmentService.hasConfiguration()) {
    const place = environmentService.findPlaceById(valueParsed.place);
    if (!place) {
      errors.push(`Place '${valueParsed.place}' not found in environment`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Get assignment count for a task
 * @param {Object} element - BPMN task element
 * @returns {number} Number of assignments
 */
AssignmentService.prototype.getAssignmentCount = function(element) {
  const assignments = this.getAssignments(element);
  return assignments.filter(a => a.condition || a.value).length;
};

/**
 * Format assignment for display
 * @param {Object} assignment - Assignment object
 * @returns {string} Formatted display string
 */
AssignmentService.prototype.formatAssignment = function(assignment) {
  if (!assignment.condition && !assignment.value) {
    return '(Empty assignment)';
  }
  
  const parts = [];
  if (assignment.condition) {
    parts.push(`When: ${assignment.condition}`);
  }
  if (assignment.value) {
    parts.push(`Set: ${assignment.value}`);
  }
  
  return parts.join(' → ');
};