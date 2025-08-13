// Runs inside Camunda Modeler (Renderer process)

// Helpers to register plugins + moddle
import {
  registerBpmnJSPlugin,
  registerBpmnJSModdleExtension
} from 'camunda-modeler-plugin-helpers';


// Custom moddle (adds <space:destination> and <space:type>)
import spaceModdle from './space-moddle.json';

// Movement modules
import MovementPaletteProvider from './modules/MovementPaletteProvider';
import MovementOverlay from './modules/MovementOverlay';
import MovementContextPadProvider from './modules/MovementContextPadProvider';

// Binding/Unbinding modules
import BindingPaletteProvider from './modules/BindingPaletteProvider';
import BindingOverlay from './modules/BindingOverlay';

// Moddles 
registerBpmnJSModdleExtension(spaceModdle);

// Movement modules
registerBpmnJSPlugin(MovementPaletteProvider);
registerBpmnJSPlugin(MovementOverlay);
registerBpmnJSPlugin(MovementContextPadProvider);

// Binding Unbinding modules
registerBpmnJSPlugin(BindingPaletteProvider);
registerBpmnJSPlugin(BindingOverlay);
