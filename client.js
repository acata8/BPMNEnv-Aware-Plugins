// Runs inside Camunda Modeler (Renderer process)

import {
  registerBpmnJSPlugin,
  registerBpmnJSModdleExtension
} from 'camunda-modeler-plugin-helpers';

// Custom moddle for <space:destination> and <space:type>
import spaceModdle from './space-moddle.json';

// Unified modules
import TypedPaletteProvider from './modules/TypedPaletteProvider';
import TypedOverlay from './modules/TypedOverlay';
import MovementContextPadProvider from './modules/MovementContextPadProvider';

// --- Register moddle ---
registerBpmnJSModdleExtension(spaceModdle);

// --- Register plugins ---
registerBpmnJSPlugin(TypedPaletteProvider);
registerBpmnJSPlugin(TypedOverlay);
registerBpmnJSPlugin(MovementContextPadProvider);
