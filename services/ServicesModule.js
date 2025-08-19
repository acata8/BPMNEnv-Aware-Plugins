import { ExtensionService } from './ExtensionService';
import { ValidationService } from './ValidationService';
import { TaskTypeService } from './TaskTypeService';


export default {
  __init__: [
    'extensionService', 
    'validationService', 
    'taskTypeService'
  ],
  extensionService: ['type', ExtensionService],
  validationService: ['type', ValidationService],
  taskTypeService: ['type', TaskTypeService]
};