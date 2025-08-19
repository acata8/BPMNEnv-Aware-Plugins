import { getTaskConfig, getAllTaskTypes } from './TaskTypes';

function SpacePropertiesProvider(
  eventBus, 
  translate,
  extensionService,
  taskTypeService
) {
  this._eventBus = eventBus;
  this._translate = translate;
  this._extensionService = extensionService;
  this._taskTypeService = taskTypeService;

  console.log('SpacePropertiesProvider initialized');

  eventBus.on('selection.changed', (event) => {
    if (event.newSelection && event.newSelection.length === 1) {
      const element = event.newSelection[0];
      
      if (element.type === 'bpmn:Task') {
        setTimeout(() => this.createStandaloneSpaceSection(element), 200);
      }
    }
  });

  // Listen for model changes to refresh the UI
  eventBus.on('elements.changed', (event) => {
    if (event.elements && event.elements.length > 0) {
      const element = event.elements[0];
      if (element.type === 'bpmn:Task') {
        setTimeout(() => this.refreshSpaceSection(element), 100);
      }
    }
  });
}

SpacePropertiesProvider.$inject = [
  'eventBus',
  'translate',
  'extensionService',
  'taskTypeService'
];

SpacePropertiesProvider.prototype.createStandaloneSpaceSection = function(element) {
  
  const propertiesPanel = document.querySelector('.bio-properties-panel-scroll-container');
  if (!propertiesPanel) {
    console.error('Properties panel scroll container not found');
    return;
  }

  // Remove existing space section if present
  const existingSection = propertiesPanel.querySelector('.space-properties-section');
  if (existingSection) {
    existingSection.remove();
  }

  // Create the standalone space section
  const spaceSection = this.createSpaceSection(element);
  
  // Insert after General section (usually the first section)
  const generalSection = propertiesPanel.querySelector('[data-group-id*="general"]');
  if (generalSection && generalSection.nextSibling) {
    propertiesPanel.insertBefore(spaceSection, generalSection.nextSibling);
  } else {
    // Fallback: add at the beginning
    propertiesPanel.insertBefore(spaceSection, propertiesPanel.firstChild);
  }
};

SpacePropertiesProvider.prototype.createSpaceSection = function(element) {
  const section = document.createElement('div');
  section.className = 'bio-properties-panel-group space-properties-section';
  section.setAttribute('data-group-id', 'group-space-properties');

  const currentType = this._extensionService.getCurrentType(element);
  const translate = this._translate;
  
  // Determine if section should be expanded (if there's a space configuration)
  const isExpanded = !!currentType;
  const hasData = !!currentType;

  section.innerHTML = `
    <!-- Section Header (matches native style) -->
    <div class="bio-properties-panel-group-header ${isExpanded ? 'open' : ''} ${hasData ? '' : 'empty'}">
      <div title="Space Properties" 
           data-title="Space Properties" 
           class="bio-properties-panel-group-header-title">
          Space Properties
      </div>
      <div class="bio-properties-panel-group-header-buttons">
        ${hasData ? '<div title="Section contains data" class="bio-properties-panel-dot"></div>' : ''}
        <button type="button" 
                title="Toggle section" 
                class="bio-properties-panel-group-header-button bio-properties-panel-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="${isExpanded ? 'bio-properties-panel-arrow-down' : 'bio-properties-panel-arrow-right'}">
            <path fill-rule="evenodd" d="m11.657 8-4.95 4.95a1 1 0 0 1-1.414-1.414L8.828 8 5.293 4.464A1 1 0 1 1 6.707 3.05L11.657 8Z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Section Entries (matches native style) -->
    <div class="bio-properties-panel-group-entries ${isExpanded ? 'open' : ''}" style="${isExpanded ? '' : 'display: none;'}">
      
      <!-- Task Type Entry -->
      <div data-entry-id="space-task-type" class="bio-properties-panel-entry">
        <div class="bio-properties-panel-textfield">
          <label for="space-type-select" class="bio-properties-panel-label">Type</label>
          <select id="space-type-select" 
                  name="spaceType" 
                  class="bio-properties-panel-input space-type-select">
            <option value="">(None)</option>
            ${getAllTaskTypes().map(config => 
              `<option value="${config.key}" ${config.key === currentType ? 'selected' : ''}>${translate(config.typeValue)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <!-- Destination Entry (for Movement) -->
      <div data-entry-id="space-destination" 
           class="bio-properties-panel-entry space-destination-entry" 
           style="${currentType !== 'movement' ? 'display: none;' : ''}">
        <div class="bio-properties-panel-textfield">
          <label for="space-destination-input" class="bio-properties-panel-label">Destination</label>
          <input id="space-destination-input" 
                 type="text" 
                 name="spaceDestination" 
                 spellcheck="false" 
                 autocomplete="off" 
                 class="bio-properties-panel-input space-destination-input"
                 placeholder="${translate('Enter destination')}"
                 value="${this._extensionService.getDestination(element) || ''}" />
        </div>
      </div>

      <!-- Binding Entry (for Bind) -->
      <div data-entry-id="space-binding" 
           class="bio-properties-panel-entry space-binding-entry" 
           style="${currentType !== 'binding' ? 'display: none;' : ''}">
        <div class="bio-properties-panel-textfield">
          <label for="space-binding-input" class="bio-properties-panel-label">Participant</label>
          <input id="space-binding-input" 
                 type="text" 
                 name="spaceBinding" 
                 spellcheck="false" 
                 autocomplete="off" 
                 class="bio-properties-panel-input space-binding-input"
                 placeholder="${translate('Enter participant ID')}"
                 value="${this._extensionService.getBinding(element) || ''}" />
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  this.attachSectionEventListeners(section, element);

  return section;
};

SpacePropertiesProvider.prototype.attachSectionEventListeners = function(section, element) {
  // Toggle section expand/collapse
  const toggleButton = section.querySelector('.bio-properties-panel-group-header-button');
  const header = section.querySelector('.bio-properties-panel-group-header');
  const entries = section.querySelector('.bio-properties-panel-group-entries');

  if (toggleButton && header && entries) {
    toggleButton.addEventListener('click', () => {
      const isOpen = header.classList.contains('open');
      
      if (isOpen) {
        // Close section
        header.classList.remove('open');
        entries.classList.remove('open');
        entries.style.display = 'none';
        
        const arrow = toggleButton.querySelector('svg');
        if (arrow) {
          arrow.classList.remove('bio-properties-panel-arrow-down');
          arrow.classList.add('bio-properties-panel-arrow-right');
        }
      } else {
        // Open section
        header.classList.add('open');
        entries.classList.add('open');
        entries.style.display = 'block';
        
        const arrow = toggleButton.querySelector('svg');
        if (arrow) {
          arrow.classList.remove('bio-properties-panel-arrow-right');
          arrow.classList.add('bio-properties-panel-arrow-down');
        }
      }
      
    });
  }

  // Form field event listeners
  const typeSelect = section.querySelector('.space-type-select');
  const destinationInput = section.querySelector('.space-destination-input');
  const bindingInput = section.querySelector('.space-binding-input');

  // Type selection - save to XML
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      try {
        const newType = e.target.value;
        if (newType) {
          this._taskTypeService.setTaskType(element, newType);
        } else {
          this._taskTypeService.clearTaskType(element);
        }

        // Update UI immediately
        this.updateFieldVisibility(section, newType);
        this.updateSectionIndicators(section, element);

      } catch (error) {
        console.error('Error changing type:', error);
      }
    });
  }

  // Destination input - save on change
  if (destinationInput) {
    ['input', 'blur', 'change'].forEach(eventType => {
      destinationInput.addEventListener(eventType, (e) => {;
        
        try {
          const value = e.target.value.trim();
          if (value) {
            this._extensionService.setExtension(element, 'space:Destination', value);
          }
          
          this.updateSectionIndicators(section, element);
          
        } catch (error) {
          console.error('Error saving destination:', error);
        }
      });
    });
  }

  // Binding input - save on change
  if (bindingInput) {
    ['input', 'blur', 'change'].forEach(eventType => {
      bindingInput.addEventListener(eventType, (e) => {
        
        try {
          const value = e.target.value.trim();
          if (value) {
            this._extensionService.setExtension(element, 'space:Binding', value);
          }
          
          this.updateSectionIndicators(section, element);
          
        } catch (error) {
          console.error('Error saving binding:', error);
        }
      });
    });
  }
};

SpacePropertiesProvider.prototype.updateFieldVisibility = function(section, selectedType) {
  const destinationEntry = section.querySelector('.space-destination-entry');
  const bindingEntry = section.querySelector('.space-binding-entry');
  const unbindingEntry = section.querySelector('.space-unbinding-entry');

  if (destinationEntry) {
    destinationEntry.style.display = selectedType === 'movement' ? 'block' : 'none';
  }
  if (bindingEntry) {
    bindingEntry.style.display = selectedType === 'binding' ? 'block' : 'none';
  }
  if (unbindingEntry) {
    unbindingEntry.style.display = selectedType === 'unbinding' ? 'block' : 'none';
  }
};

SpacePropertiesProvider.prototype.updateSectionIndicators = function(section, element) {
  const header = section.querySelector('.bio-properties-panel-group-header');
  const statusDisplay = section.querySelector('.space-status-display');
  
  const currentType = this._extensionService.getCurrentType(element);
  const hasData = !!currentType;

  // Update header class and dot indicator
  if (hasData) {
    header.classList.remove('empty');
    
    // Add data dot if not present
    let dot = header.querySelector('.bio-properties-panel-dot');
    if (!dot) {
      dot = document.createElement('div');
      dot.className = 'bio-properties-panel-dot';
      dot.title = 'Section contains data';
      
      const buttonsContainer = header.querySelector('.bio-properties-panel-group-header-buttons');
      if (buttonsContainer) {
        buttonsContainer.insertBefore(dot, buttonsContainer.firstChild);
      }
    }
  } else {
    header.classList.add('empty');
    
    // Remove data dot
    const dot = header.querySelector('.bio-properties-panel-dot');
    if (dot) {
      dot.remove();
    }
  }

  // Update status display
  if (statusDisplay) {
    statusDisplay.innerHTML = this.getStatusText(element, currentType);
    statusDisplay.style.background = currentType ? '#e8f5e8' : '#f0f0f0';
    statusDisplay.style.color = currentType ? '#2e7d32' : '#666';
    statusDisplay.style.borderLeftColor = currentType ? '#4caf50' : '#ccc';
  }
};

SpacePropertiesProvider.prototype.refreshSpaceSection = function(element) {
  const existingSection = document.querySelector('.space-properties-section');
  if (existingSection && element) {
    
    // Update form fields with current XML values
    const currentType = this._extensionService.getCurrentType(element);
    const currentDestination = this._extensionService.getDestination(element);
    const currentBinding = this._extensionService.getBinding(element);

    const typeSelect = existingSection.querySelector('.space-type-select');
    const destinationInput = existingSection.querySelector('.space-destination-input');
    const bindingInput = existingSection.querySelector('.space-binding-input');

    if (typeSelect) typeSelect.value = currentType || '';
    if (destinationInput) destinationInput.value = currentDestination || '';
    if (bindingInput) bindingInput.value = currentBinding || '';

    // Update visibility and indicators
    this.updateFieldVisibility(existingSection, currentType);
    this.updateSectionIndicators(existingSection, element);
  }
};

SpacePropertiesProvider.prototype.getStatusText = function(element, currentType) {
  const translate = this._translate;
  
  if (!currentType) {
    return `<strong>${translate('Status')}:</strong> ${translate('No configuration')} <br><em>${translate('Select a type to configure this task')}</em>`;
  }
  
  const config = getTaskConfig(currentType);
  let status = `<strong>${translate('Status')}:</strong> ${config.typeValue} ${translate('configured')} ✅`;
  
  if (currentType === 'movement') {
    const destination = this._extensionService.getDestination(element);
    status += `<br><strong>${translate('Destination')}:</strong> ${destination || `<em>${translate('(required)')}</em>`}`;
  } else if (currentType === 'binding') {
    const binding = this._extensionService.getBinding(element);
    status += `<br><strong>${translate('Participant')}:</strong> ${binding || `<em>${translate('(required)')}</em>`}`;
  } else if (currentType === 'unbinding') {
    status += `<br><em>${translate('Ready to release bound participants')}</em>`;
  }
  
  return status;
};

export default {
  __init__: ['spacePropertiesProvider'],
  spacePropertiesProvider: ['type', SpacePropertiesProvider]
};