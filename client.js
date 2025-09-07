import {
  registerBpmnJSPlugin,
  registerBpmnJSModdleExtension
} from 'camunda-modeler-plugin-helpers';

import spaceModdle from './space-moddle.json';

// Existing modules
import TypedPaletteProvider from './modules/TypedPaletteProvider';
import TypedOverlay from './modules/TypedOverlay';
import MovementContextPadProvider from './modules/MovementContextPadProvider';
import SpacePropertiesProvider from './modules/SpacePropertiesProvider';
import ServicesModule from './services/ServicesModule';
import SimpleBindingHandler from './modules/SimpleBindingHandler';
import { SimpleBindingService } from './services/SimpleBindingService';

// NEW: Add the Custom Replace Provider
import CustomReplaceProvider from './modules/CustomReplaceProvider';

// Create simple binding module bundle
const SimpleBindingModule = {
  __init__: ['simpleBindingHandler', 'simpleBindingService'],
  simpleBindingHandler: ['type', SimpleBindingHandler],
  simpleBindingService: ['type', SimpleBindingService]
};

// Register moddle extension
registerBpmnJSModdleExtension(spaceModdle);

// Register all plugin modules
registerBpmnJSPlugin(ServicesModule);
registerBpmnJSPlugin(TypedOverlay);
registerBpmnJSPlugin(MovementContextPadProvider);
registerBpmnJSPlugin(SpacePropertiesProvider);
registerBpmnJSPlugin(SimpleBindingModule);

registerBpmnJSPlugin(CustomReplaceProvider);