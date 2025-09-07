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

// Simple binding modules
import SimpleBindingHandler from './modules/SimpleBindingHandler';
import { SimpleBindingService } from './services/SimpleBindingService';

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