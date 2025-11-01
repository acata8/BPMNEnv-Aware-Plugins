# Camunda Spatial BPMN Plugin

A plugin for Camunda Modeler that extends BPMN modeling with spatial and location-aware process capabilities.

---

## Overview

This plugin adds:
- **Custom Task Types**: Movement, Binding, and Unbinding tasks
- **Environment Integration**: Load and reference places from `environment.json`
- **Visual Badges**: SVG overlays showing task types
- **Destination Autocomplete**: Search and select places
- **Validation**: Non-blocking warnings for spatial relationships
- **Environment Viewer**: Modal overlay for visualizing spatial environments

---

## Installation & Setup

### 1. Fork Camunda Modeler Project
```bash
# Fork and clone the official Camunda Modeler repository
git clone https://github.com/camunda/camunda-modeler.git
cd camunda-modeler
```

### 3. Setup the Plugin

#### 3.1. Modify `index.html`

Navigate to the Camunda Modeler client public folder:
```bash
cd camunda-modeler/client/public
```

Replace the content of `index.html` with [this file](../modeler/index.html).

This adds:
- Floating button (🗺️) to open environment viewer
- Modal overlay for visualizing spatial environments
- Integration hooks for the `#bpenv-container`

#### 3.2. Install the Plugin

Navigate to the plugins folder:
```bash
cd ../../resources/plugins
```

Clone/fork this plugin repository into the plugins folder:
```bash
# Clone the spatial BPMN plugin
git clone <this-plugin-repository-url> camunda-spatial-bpmn

# Or if you have it locally, copy it:
# cp -r /path/to/camunda-spatial-bpmn ./
```

Directory structure should look like:
```
camunda-modeler/
├── client/
│   └── public/
│       └── index.html (modified)
├── resources/
│   └── plugins/
│       └── camunda-spatial-bpmn/  ← Plugin folder
│           ├── index.js
│           ├── space-moddle.json
│           ├── package.json
│           ├── modules/
│           ├── services/
│           └── ...
```

#### 3.3. Install Plugin Dependencies

Inside the plugin folder:
```bash
cd camunda-spatial-bpmn
npm install
```

#### 3.4. Build the Plugin (Development Mode - Optional)

If you want to work on the plugin code with hot reload:
```bash
npm run dev
```

This watches for changes and rebuilds automatically. **Skip this step** if you're just using the plugin.

---

### 4. Install Modeler Dependencies

Go back to the modeler root and install dependencies:
```bash
npm install
```

---

### 5. Run Camunda Modeler (Development Mode)

Launch the modeler in development mode:
```bash
npm run dev
```

This will:
- Start the Electron app
- Load the modified `index.html` with environment viewer UI
- Load the spatial BPMN plugin from `resources/plugins/`
- Enable hot reload for modeler code changes

The modeler window should open with:
- Standard BPMN modeling interface
- Floating 🗺️ button (bottom-right) for environment viewer
- Spatial task types in palette
- Properties panel with spatial configuration

---

## Using the Plugin

### Create Spatial Tasks

**From Palette:**
1. Look for custom entries: "Movement Task", "Binding Task", "Unbinding Task"
2. Drag onto canvas

**Convert Existing Tasks:**
1. Select any task
2. Context pad (wrench icon) → Choose task type
3. Or use Properties Panel → "Task Type" dropdown

### Load Environment File

The plugin uses environment.json to provide place autocomplete and validation. 

**Environment File Format**
```json
{
  "places": [
    {
      "id": "room-101",
      "name": "Conference Room A",
      "attributes": {
        "floor": 1,
        "capacity": 12,
        "building": "North Wing"
      }
    },
    {
      "id": "lab-205",
      "name": "Research Lab 205",
      "attributes": {
        "floor": 2,
        "equipment": ["microscope", "centrifuge"]
      }
    }
  ],
  "edges": [],
  "logicalPlaces": [],
  "views": []
}
```

1. Select any task or canvas background
2. Properties Panel → "Environment" section
3. Click "Load Environment File"
4. Browse to your `environment.json`

## Project Structure
```
camunda-spatial-bpmn/
├── index.js                    # Plugin entry point
├── space-moddle.json           # BPMN extension schema
├── package.json                # Build scripts & dependencies
├── README.md                   # This file
│
├── modules/                    # UI components
│   ├── TypedPaletteProvider.js
│   ├── MovementContextPadProvider.js
│   ├── TypedOverlay.js
│   └── SpacePropertiesProvider.js
│
├── services/                   # Business logic
│   ├── ExtensionService.js
│   ├── TaskTypeService.js
│   ├── ValidationService.js
│   └── EnvironmentService.js
│
├── styles/
│   └── plugin.css
│
├── icons/
│   ├── movement.svg
│   ├── binding.svg
│   └── unbinding.svg
│
└── sample/
    ├── diagram.bpmn            # Example spatial BPMN
    └── environment.json        # Sample environment data
```

---

## Development Workflow

### Making Changes to the Plugin

1. Edit plugin code in `camunda-modeler/resources/plugins/camunda-spatial-bpmn/`
2. If using `npm run dev` in plugin folder, changes auto-rebuild
3. Restart the modeler to reload plugin:
```bash
   # Stop modeler (Ctrl+C in terminal)
   # Restart:
   npm run dev
```

**Modeler Console:**
- Help → Toggle DevTools
- Console tab shows plugin registration logs
- Network tab shows environment.json loading

---

## Requirements

- **Node.js**: 16+ 
- **npm**: 8+
- **Camunda Modeler**: 5.36 (forked version)
- **Camunda Platform**: 7.x (for deployment)
- **OS**: macOS, Windows, or Linux

---

## License

MIT

---

## Support

- **Plugin Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Modeler Issues**: [Camunda Modeler Repository](https://github.com/camunda/camunda-modeler)
- **Examples**: See `sample/` folder
