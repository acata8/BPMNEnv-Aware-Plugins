import { EXTENSION_TYPES } from '../modules/TaskTypes';

/**
 * AssignmentService - Manages task assignments for place attributes
 * Uses ExtensionService for all moddle operations
 */
export function AssignmentService(extensionService) {
  console.log('AssignmentService constructor called (simplified)');
  this.extensionService = extensionService;
}

// Only inject what we need
AssignmentService.$inject = ['extensionService'];

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
  try {
    console.log('Adding assignment:', { condition, value });
    
    // Use ExtensionService to set the extensions
    // We'll store assignments as a serialized format in a single extension for now
    const assignments = this.getAssignments(element);
    
    // Add the new assignment
    assignments.push({
      id: `assignment_${assignments.length}`,
      condition: condition || '',
      value: value || ''
    });
    
    // Serialize all assignments
    const serializedConditions = assignments.map(a => a.condition).join('|||');
    const serializedValues = assignments.map(a => a.value).join('|||');
    
    // Store using ExtensionService's setExtension method
    this.extensionService.setExtension(element, EXTENSION_TYPES.TASK_ASSIGNMENT, serializedConditions);
    this.extensionService.setExtension(element, EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED, serializedValues);
    
    console.log('Assignment added successfully using serialized format');
  } catch (error) {
    console.error('Error adding assignment:', error);
  }
};

/**
 * Update an existing assignment
 * @param {Object} element - BPMN task element
 * @param {number} index - Assignment index to update
 * @param {string} condition - New condition
 * @param {string} value - New value
 */
AssignmentService.prototype.updateAssignment = function(element, index, condition, value) {
  try {
    const assignments = this.getAssignmentsFromSerialized(element);
    
    if (assignments[index]) {
      assignments[index].condition = condition || '';
      assignments[index].value = value || '';
      
      // Re-serialize and save
      const serializedConditions = assignments.map(a => a.condition).join('|||');
      const serializedValues = assignments.map(a => a.value).join('|||');
      
      this.extensionService.setExtension(element, EXTENSION_TYPES.TASK_ASSIGNMENT, serializedConditions);
      this.extensionService.setExtension(element, EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED, serializedValues);
    }
  } catch (error) {
    console.error('Error updating assignment:', error);
  }
};

/**
 * Get assignments from serialized format
 * @param {Object} element - BPMN task element
 * @returns {Array} Array of assignments
 */
AssignmentService.prototype.getAssignmentsFromSerialized = function(element) {
  const conditionExt = this.extensionService.findExtension(element.businessObject, EXTENSION_TYPES.TASK_ASSIGNMENT);
  const valueExt = this.extensionService.findExtension(element.businessObject, EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED);
  
  const conditionsText = this.extensionService.getText(conditionExt);
  const valuesText = this.extensionService.getText(valueExt);
  
  const conditions = conditionsText ? conditionsText.split('|||') : [];
  const values = valuesText ? valuesText.split('|||') : [];
  
  const assignments = [];
  const maxLength = Math.max(conditions.length, values.length);
  
  for (let i = 0; i < maxLength; i++) {
    assignments.push({
      id: `assignment_${i}`,
      condition: conditions[i] || '',
      value: values[i] || ''
    });
  }
  
  return assignments.filter(a => a.condition || a.value);
};

/**
 * Override getAssignments to use serialized format
 */
AssignmentService.prototype.getAssignments = function(element) {
  if (!element?.businessObject) return [];
  return this.getAssignmentsFromSerialized(element);
};

/**
 * Remove an assignment from a task
 * @param {Object} element - BPMN task element
 * @param {number} index - Assignment index to remove
 */
AssignmentService.prototype.removeAssignment = function(element, index) {
  try {
    const assignments = this.getAssignmentsFromSerialized(element);
    
    // Remove the assignment at the specified index
    assignments.splice(index, 1);
    
    if (assignments.length === 0) {
      // Remove the extensions entirely if no assignments left
      this.extensionService.removeExtensions(element, 
        v => v.$type === EXTENSION_TYPES.TASK_ASSIGNMENT || 
             v.$type === EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED
      );
    } else {
      // Re-serialize and save
      const serializedConditions = assignments.map(a => a.condition).join('|||');
      const serializedValues = assignments.map(a => a.value).join('|||');
      
      this.extensionService.setExtension(element, EXTENSION_TYPES.TASK_ASSIGNMENT, serializedConditions);
      this.extensionService.setExtension(element, EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED, serializedValues);
    }
  } catch (error) {
    console.error('Error removing assignment:', error);
  }
};

/**
 * Clear all assignments from a task
 * @param {Object} element - BPMN task element
 */
AssignmentService.prototype.clearAssignments = function(element) {
  this.extensionService.removeExtensions(element, 
    v => v.$type === EXTENSION_TYPES.TASK_ASSIGNMENT || 
         v.$type === EXTENSION_TYPES.TASK_ASSIGNMENT_REACHED
  );
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
  } else if (conditionParsed && environmentService && environmentService.hasConfiguration()) {
    const place = environmentService.findPlaceById(conditionParsed.place);
    if (!place) {
      errors.push(`Place '${conditionParsed.place}' not found in environment`);
    }
  }
  
  // Parse value assignment
  const valueParsed = this.parseAssignment(value);
  if (value && !valueParsed) {
    errors.push('Invalid assignment format. Use: place.attribute = value');
  } else if (valueParsed && environmentService && environmentService.hasConfiguration()) {
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
  try {
    const assignments = this.getAssignments(element);
    return assignments.length;
  } catch (error) {
    console.error('Error getting assignment count:', error);
    return 0;
  }
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

// Verify the service is exported correctly
console.log('AssignmentService exported (simplified)');