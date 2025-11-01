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

Replace the content of `index.html` with the following:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="script-src 'self'" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>Camunda Modeler</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
  <style>
    /* Floating button to open environment modal */
    .btn-open-environment {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 100000000 !important;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: none;
      background: #0d6efd;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-open-environment:hover {
      background: #0b5ed7;
      transform: scale(1.05);
    }
    
    /* Modal styles */
    .modal-environment {
      display: none;
      position: fixed;
      z-index: 1060;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .modal-environment.show {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-dialog-xl {
      max-width: 90%;
      width: 1800px;
      margin: 1.75rem auto;
    }
    
    .modal-content {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 0.3rem;
      outline: 0;
    }
    
    .modal-header {
      padding: 0 !important;
      background-color: white !important;
      font-size: 3px !important;
      border-bottom: none !important;
      height: 13px !important;
    }
    
    .modal-body {
      position: relative;
      flex: 1 1 auto;
      padding: 0;
    }
    
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 1rem;
      border-top: 1px solid #dee2e6;
    }
    
    /* Full height for bpenv container inside modal */
    #bpenv-container {
      height: 70vh;
      width: 100%;
    }
    
    .btn-close {
      background: transparent;
      border: 0;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
      color: #000;
      opacity: 0.5;
      cursor: pointer;
    }
    
    .btn-close:hover {
      opacity: 0.75;
    }
  </style>
</head>
<body>
  <div class="spinner-border spinner-border-global"></div>
  
  <!-- Main BPMN Modeler (full width) -->
  <div id="app-container" style="width: 100%; height: 100vh;">
    <div id="root" style="width: 100%; height: 100%;"></div>
  </div>
  
  <!-- Floating button to open environment viewer -->
  <button type="button" 
          class="btn-open-environment" 
          id="openEnvironmentBtn"
          title="Open Environment Viewer">
    🗺️
  </button>
  
  <!-- Environment Modal -->
  <div class="modal-environment" id="environmentModal">
    <div class="modal-dialog-xl">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" 
                  class="btn-close" 
                  id="closeModalBtn"
                  aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <!-- This is the container your bpenv-modeler renders into -->
          <div id="bpenv-container"></div>
        </div>
      </div>
    </div>
  </div>
  
  <script src="bundle.js"></script>
  
  <script>
    // Vanilla JS modal functionality
    (function() {
      const modal = document.getElementById('environmentModal');
      const openBtn = document.getElementById('openEnvironmentBtn');
      const closeBtn = document.getElementById('closeModalBtn');
      const closeFooterBtn = document.getElementById('closeModalFooterBtn');
      
      // Open modal
      openBtn.addEventListener('click', function() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      });
      
      // Close modal - X button
      closeBtn.addEventListener('click', function() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
      });
      
      // Close modal - Footer button
      closeFooterBtn.addEventListener('click', function() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
      });
      
      // Close modal - Click outside
      modal.addEventListener('click', function(event) {
        if (event.target === modal) {
          modal.classList.remove('show');
          document.body.style.overflow = 'auto';
        }
      });
      
      // Close modal - Escape key
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
          modal.classList.remove('show');
          document.body.style.overflow = 'auto';
        }
      });
    })();
  </script>
</body>
</html>
```

</details>

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
