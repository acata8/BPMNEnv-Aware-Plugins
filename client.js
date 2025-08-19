import {
  registerBpmnJSPlugin,
  registerBpmnJSModdleExtension
} from 'camunda-modeler-plugin-helpers';

import spaceModdle from './space-moddle.json';
import TypedPaletteProvider from './modules/TypedPaletteProvider';
import TypedOverlay from './modules/TypedOverlay';
import MovementContextPadProvider from './modules/MovementContextPadProvider';

// Register services as bpmn-js modules
import ServicesModule from './services/ServicesModule';

registerBpmnJSModdleExtension(spaceModdle);
registerBpmnJSPlugin(ServicesModule); // Register services first
registerBpmnJSPlugin(TypedPaletteProvider);
registerBpmnJSPlugin(TypedOverlay);
registerBpmnJSPlugin(MovementContextPadProvider);