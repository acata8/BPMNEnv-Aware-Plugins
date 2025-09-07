import { ExtensionService } from './ExtensionService';
import { ValidationService } from './ValidationService';
import { TaskTypeService } from './TaskTypeService';
import { EnvironmentService } from './EnvironmentService';
import { MessageFlowXmlService } from './MessageFlowXmlService';

export default {
  __init__: [
    'extensionService', 
    'validationService', 
    'taskTypeService',
    'environmentService',
    'messageFlowXmlService'
  ],
  extensionService: ['type', ExtensionService],
  validationService: ['type', ValidationService],
  taskTypeService: ['type', TaskTypeService],
  environmentService: ['type', EnvironmentService],
  messageFlowXmlService: ['type', MessageFlowXmlService]
};