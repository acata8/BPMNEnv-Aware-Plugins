import {
  registerBpmnJSPlugin,
  registerBpmnJSModdleExtension
} from 'camunda-modeler-plugin-helpers';

import spaceModdle from './space-moddle.json';
import TypedPaletteProvider from './modules/TypedPaletteProvider';
import TypedOverlay from './modules/TypedOverlay';
import MovementContextPadProvider from './modules/MovementContextPadProvider';
import SpacePropertiesProvider from './modules/SpacePropertiesProvider';


import ServicesModule from './services/ServicesModule';

registerBpmnJSModdleExtension(spaceModdle);
registerBpmnJSPlugin(ServicesModule); 
registerBpmnJSPlugin(TypedPaletteProvider);
registerBpmnJSPlugin(TypedOverlay);
registerBpmnJSPlugin(MovementContextPadProvider);
registerBpmnJSPlugin(SpacePropertiesProvider); 