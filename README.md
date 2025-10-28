Camunda Spatial BPMN PluginA Camunda Modeler 5.36 plugin that extends BPMN modeling with spatial and location-aware process capabilities.InstallationOption A: Standalone Plugin (Recommended for Users)
Locate Camunda Modeler plugins directory:

 # macOS
 ```
   ~/Library/Application Support/camunda-modeler/plugins/
 ```
   # Windows
 ```
 %APPDATA%\camunda-modeler\plugins\
 ```  
 # Linux
 ```
~/.config/camunda-modeler/plugins/
```
Copy plugin folder:

 # Clone or download this repo, then:
 ```
   cp -r camunda-spatial-bpmn /path/to/camunda-modeler/plugins/
```

# Restart Camunda Modeler
Option B: Inside Camunda Modeler Fork (For Development)TODO: Instructions for integrating into forked camunda-modeler repository

# 1. Fork/clone camunda-modeler repository
```
git clone https://github.com/camunda/camunda-modeler.git
cd camunda-modeler
```
# 2. Add this plugin to the client plugins

## TODO: Write standalone from camunda-modeler project

# Import Environment File
The plugin uses environment.json to provide place autocomplete and validation.
Environment File Format
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

### Load Environment in Modeler
Properties Panel

Select any task or click canvas background
Properties Panel → "Environment" section
Click "Load Environment File" button
Browse to your environment.json
Confirmation message appears when loaded


