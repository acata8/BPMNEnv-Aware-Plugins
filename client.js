// client.js
// Runs inside Camunda Modeler (Renderer process)

// Helpers to register plugins + moddle
import {
  registerBpmnJSPlugin,
  registerBpmnJSModdleExtension
} from 'camunda-modeler-plugin-helpers';

// Custom moddle (adds <space:destination> and <space:type>)
import spaceModdle from './space-moddle.json';

// Our modules
import MovementPaletteProvider from './modules/MovementPaletteProvider';
import MovementOverlay from './modules/MovementOverlay';
import MovementContextPadProvider from './modules/MovementContextPadProvider';

// 1) Register moddle before any modules
registerBpmnJSModdleExtension(spaceModdle);

// 2) Register bpmn-js modules
registerBpmnJSPlugin(MovementPaletteProvider);
registerBpmnJSPlugin(MovementOverlay);
registerBpmnJSPlugin(MovementContextPadProvider);
