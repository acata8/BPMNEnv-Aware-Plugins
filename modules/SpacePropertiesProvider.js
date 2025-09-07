import { getTaskConfig, getAllTaskTypes, TASK_TYPE_KEYS } from './TaskTypes';

function SpacePropertiesProvider(
  eventBus, 
  translate,
  extensionService,
  taskTypeService,
  environmentService,
  messageFlowXmlService, 
  elementRegistry
) {
  this._eventBus = eventBus;
  this._translate = translate;
  this._extensionService = extensionService;
  this._taskTypeService = taskTypeService;
  this._environmentService = environmentService;
  this._messageFlowXmlService = messageFlowXmlService;  
  this._elementRegistry = elementRegistry;


  console.info('SpacePropertiesProvider initialized');

  eventBus.on('selection.changed', (event) => {
    if (event.newSelection && event.newSelection.length === 1) {
      const element = event.newSelection[0];
      
        if (element.type === 'bpmn:Task') {
          setTimeout(() => this.createStandaloneSpaceSection(element), 200);
        } else if (element.type === 'bpmn:MessageFlow') {
          // Show binding info for connections
          setTimeout(() => this.createMessageFlowSpaceSection(element), 200);
        } else {
          setTimeout(() => this.showEnvironmentSection(), 200);
        }
    } else if (event.newSelection && event.newSelection.length === 0) {
      // No selection - show environment configuration section
      setTimeout(() => this.showEnvironmentSection(), 200);
    }
    // Do nothing for multiple selections
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

  // Listen for environment changes
  eventBus.on('environment.ready', () => {
    this.refreshEnvironmentSection();
  });

  eventBus.on('environment.cleared', () => {
    this.refreshEnvironmentSection();
  });

  // Listen for manual file load results
  eventBus.on('environment.manual.loaded', (event) => {
    this.handleManualLoadResult(event);
  });
}

SpacePropertiesProvider.$inject = [
  'eventBus',
  'translate',
  'extensionService',
  'taskTypeService',
  'environmentService',
  'messageFlowXmlService',  
  'elementRegistry'
];

/**
 * Create Space Properties section for message flows
 */
SpacePropertiesProvider.prototype.createMessageFlowSpaceSection = function(messageFlow) {
  const propertiesPanel = document.querySelector('.bio-properties-panel-scroll-container');
  if (!propertiesPanel) {
    console.error('Properties panel scroll container not found');
    return;
  }

  // Remove existing space sections
  const existingSection = propertiesPanel.querySelector('.space-properties-section');
  if (existingSection) {
    existingSection.remove();
  }

  // Get connection info using the XML service
  const connectionInfo = this._messageFlowXmlService.getConnectionInfo(messageFlow);
  
  // Create the space section for message flow
  const section = this.createMessageFlowSection(messageFlow, connectionInfo);
  
  // Insert after General section or at the beginning
  const generalSection = propertiesPanel.querySelector('[data-group-id*="general"]');
  if (generalSection && generalSection.nextSibling) {
    propertiesPanel.insertBefore(section, generalSection.nextSibling);
  } else {
    propertiesPanel.insertBefore(section, propertiesPanel.firstChild);
  }
};

/**
 * Create the Space Properties section for message flow
 */
SpacePropertiesProvider.prototype.createMessageFlowSection = function(messageFlow, connectionInfo) {
  const section = document.createElement('div');
  section.className = 'bio-properties-panel-group space-properties-section';
  section.setAttribute('data-group-id', 'group-space-properties');

  const translate = this._translate;
  const hasData = !!connectionInfo;
  const isExpanded = hasData;

  // Get participant names
  const sourceParticipant = connectionInfo ? this._elementRegistry.get(connectionInfo.sourceRef) : null;
  const targetParticipant = connectionInfo ? this._elementRegistry.get(connectionInfo.targetRef) : null;
  const sourceName = sourceParticipant?.businessObject?.name || connectionInfo?.sourceRef || '';
  const targetName = targetParticipant?.businessObject?.name || connectionInfo?.targetRef || '';

 section.innerHTML = `
  ${hasData ? `
    <div class="bio-properties-panel-group-header ${isExpanded ? 'open' : ''}">
      <div title="Space Properties" 
           data-title="Space Properties" 
           class="bio-properties-panel-group-header-title">
        Space Properties
      </div>
      <div class="bio-properties-panel-group-header-buttons">
        <div title="Section contains data" class="bio-properties-panel-dot"></div>
        <button type="button" 
                title="Toggle section" 
                class="bio-properties-panel-group-header-button bio-properties-panel-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
               class="${isExpanded ? 'bio-properties-panel-arrow-down' : 'bio-properties-panel-arrow-right'}">
            <path fill-rule="evenodd" 
                  d="m11.657 8-4.95 4.95a1 1 0 0 1-1.414-1.414L8.828 8 5.293 4.464A1 1 0 1 1 6.707 3.05L11.657 8Z">
            </path>
          </svg>
        </button>
      </div>
    </div>

    <div class="bio-properties-panel-group-entries ${isExpanded ? 'open' : ''}" style="${isExpanded ? '' : 'display: none;'}">

      <!-- Connection Type Entry -->
      <div data-entry-id="space-connection-type" class="bio-properties-panel-entry">
        <div class="bio-properties-panel-textfield">
          <label class="bio-properties-panel-label">${translate('Type')}</label>
          <input type="text" 
                 class="bio-properties-panel-input" 
                 value="${connectionInfo.type}" 
                 readonly
                 style="background: #f8f9fa; cursor: default;" />
        </div>
      </div>

      <!-- Source Reference Entry -->
      <div data-entry-id="space-source-ref" class="bio-properties-panel-entry">
        <div class="bio-properties-panel-textfield">
          <label class="bio-properties-panel-label">${translate('Source Reference')}</label>
          <input type="text" 
                 class="bio-properties-panel-input" 
                 value="${connectionInfo.sourceRef}" 
                 readonly
                 title="${sourceName}"
                 style="background: #f8f9fa; cursor: default;" />
          ${sourceName && sourceName !== connectionInfo.sourceRef ? 
            `<small class="bio-properties-panel-description">${sourceName}</small>` : ''
          }
        </div>
      </div>

      <!-- Target Reference Entry -->
      <div data-entry-id="space-target-ref" class="bio-properties-panel-entry">
        <div class="bio-properties-panel-textfield">
          <label class="bio-properties-panel-label">${translate('Target Reference')}</label>
          <input type="text" 
                 class="bio-properties-panel-input" 
                 value="${connectionInfo.targetRef}" 
                 readonly
                 title="${targetName}"
                 style="background: #f8f9fa; cursor: default;" />
          ${targetName && targetName !== connectionInfo.targetRef ? 
            `<small class="bio-properties-panel-description">${targetName}</small>` : ''
          }
        </div>
      </div>

    </div>
  ` : ``}`;


  // Attach toggle event listener
  this.attachSectionEventListeners(section, messageFlow);

  return section;
};

/**
 * Show environment configuration section when no task is selected
 */
SpacePropertiesProvider.prototype.showEnvironmentSection = function() {
  const propertiesPanel = document.querySelector('.bio-properties-panel-scroll-container');
  if (!propertiesPanel) {
    console.error('Properties panel scroll container not found');
    return;
  }

  // Check if environment section already exists
  const existingEnvSection = propertiesPanel.querySelector('.space-properties-section[data-group-id="group-environment-config"]');
  if (existingEnvSection) {
    return;
  }

  // Remove any other space sections (task-related)
  const existingSpaceSection = propertiesPanel.querySelector('.space-properties-section');
  if (existingSpaceSection) {
    existingSpaceSection.remove();
  }

  // Create the environment configuration section
  const envSection = this.createEnvironmentSection();
  
  // Insert at the beginning
  propertiesPanel.insertBefore(envSection, propertiesPanel.firstChild);
};

/**
 * Create environment configuration section
 */
SpacePropertiesProvider.prototype.createEnvironmentSection = function() {
  const section = document.createElement('div');
  section.className = 'bio-properties-panel-group space-properties-section';
  section.setAttribute('data-group-id', 'group-environment-config');

  const translate = this._translate;
  const hasConfig = this._environmentService.hasConfiguration();
  const configSummary = hasConfig ? this._environmentService.getConfigSummary() : null;
  
  // Section should be expanded if there's configuration
  const isExpanded = hasConfig;

  // The svg is the small round icon (•) on the group
  section.innerHTML = `
    <!-- Section Header -->
    <div class="bio-properties-panel-group-header ${isExpanded ? 'open' : ''} ${hasConfig ? '' : 'empty'}">
      <div title="Environment Configuration" data-title="Environment Configuration" class="bio-properties-panel-group-header-title">
          Environment Configuration
      </div>
      <div class="bio-properties-panel-group-header-buttons">
        ${hasConfig ? '<div title="Environment loaded" class="bio-properties-panel-dot"></div>' : ''}
        <button type="button" 
                title="Toggle section" 
                class="bio-properties-panel-group-header-button bio-properties-panel-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="${isExpanded ? 'bio-properties-panel-arrow-down' : 'bio-properties-panel-arrow-right'}">
            <path fill-rule="evenodd" d="m11.657 8-4.95 4.95a1 1 0 0 1-1.414-1.414L8.828 8 5.293 4.464A1 1 0 1 1 6.707 3.05L11.657 8Z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Section Entries -->
    <div class="bio-properties-panel-group-entries ${isExpanded ? 'open' : ''}" style="${isExpanded ? '' : 'display: none;'}">
      
      <!-- File Upload Entry -->
      ${hasConfig == false ?
      `<div data-entry-id="env-file-upload" class="bio-properties-panel-entry">
        <div class="bio-properties-panel-textfield">
          <label class="bio-properties-panel-label">${translate('Environment File')}</label>
          <div class="env-file-input-container">
            <button type="button" class="env-file-load-btn bio-properties-panel-input" 
                    style="text-align: left; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <span class="file-text">${translate('Load environment.json')}</span>
            </button>
            <input type="file" 
                   accept=".json" 
                   class="env-file-input" 
                   style="display: none;" />
          </div>
          <small class="bio-properties-panel-description">
            ${hasConfig 
              ? translate('Replace the current environment with a different file')
              : translate('Load environment.json to configure available places and destinations')
            }
          </small>
        </div>
      </div>`
      : `` }

      ${hasConfig ? this.renderConfigurationDetails(configSummary) : ''}
       
      <!-- Clear Configuration Button (only if config loaded) -->
      ${hasConfig ? `
      <div data-entry-id="env-clear-config" class="bio-properties-panel-entry">
        <div class="bio-properties-panel-textfield">
          <button type="button" class="env-clear-config-btn bio-properties-panel-input" 
                  style="text-align: center; cursor: pointer; color: #d32f2f; border-color: #d32f2f;">
            ${translate('Clear Configuration')}
          </button>
        </div>
      </div>
      ` : ''}
      
    </div>
  `;

  // Attach event listeners
  this.attachEnvironmentEventListeners(section);

  return section;
};

/**
 * Render configuration details section
 */
SpacePropertiesProvider.prototype.renderConfigurationDetails = function(configSummary) {
  const translate = this._translate;
  
  return `
    <!-- Configuration Details Entry -->
    <div data-entry-id="env-config-details" class="bio-properties-panel-entry">
      <div class="bio-properties-panel-textfield">
        <label class="bio-properties-panel-label">${translate('Configuration Summary')}</label>
        <div class="env-config-details">
          <div class="config-metric">
            <span class="metric-label">${translate('Places')}:</span>
            <span class="metric-value">${configSummary.summary.places}</span>
          </div>
          <div class="config-metric">
            <span class="metric-label">${translate('Logical Places')}:</span>
            <span class="metric-value">${configSummary.summary.logicalPlaces}</span>
          </div>
          <div class="config-metric">
            <span class="metric-label">${translate('Views')}:</span>
            <span class="metric-value">${configSummary.summary.views}</span>
          </div>
          ${configSummary.zones.length > 0 ? `
          <div class="config-metric">
            <span class="metric-label">${translate('Zones')}:</span>
            <span class="metric-value">${configSummary.zones.join(', ')}</span>
          </div>
          ` : ''}
          ${configSummary.purposes.length > 0 ? `
          <div class="config-metric">
            <span class="metric-label">${translate('Purposes')}:</span>
            <span class="metric-value">${configSummary.purposes.join(', ')}</span>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
};

/**
 * Attach event listeners to environment section
 */
SpacePropertiesProvider.prototype.attachEnvironmentEventListeners = function(section) {
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

  // File input handling
  const fileButton = section.querySelector('.env-file-load-btn');
  const fileInput = section.querySelector('.env-file-input');

  if (fileButton && fileInput) {
    fileButton.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileLoad(file, section);
      }
    });
  }

  // Clear configuration button
  const clearButton = section.querySelector('.env-clear-config-btn');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      this.handleClearConfiguration(section);
    });
  }
};

/**
 * Handle file loading (manual upload)
 */
SpacePropertiesProvider.prototype.handleFileLoad = function(file, section) {
  // Validate file type
  if (!file.name.toLowerCase().endsWith('.json')) {
    this.showFileError(section, this._translate('Please select a JSON file'));
    return;
  }

  // Show loading state
  this.showFileLoading(section, file.name);

  // Use environment service to handle the file
  this._environmentService.handleManualFileLoad(file);
};

/**
 * Handle clear configuration
 */
SpacePropertiesProvider.prototype.handleClearConfiguration = function(section) {  
  // Confirm with user
  if (confirm(this._translate('Are you sure you want to clear the environment configuration?'))) {
    this._environmentService.clearConfiguration();
    this.refreshEnvironmentSection();
  }
};

/**
 * Handle manual load result
 */
SpacePropertiesProvider.prototype.handleManualLoadResult = function(event) {
  const section = document.querySelector('.space-properties-section[data-group-id="group-environment-config"]');
  if (!section) return;

  if (event.success) {
      this.refreshEnvironmentSection();
  } else {
    this.showFileError(section, event.error || this._translate('Unknown error occurred'));
  }
};

/**
 * Show file loading state
 */
SpacePropertiesProvider.prototype.showFileLoading = function(section, fileName) {
  const button = section.querySelector('.env-file-load-btn');
  if (button) {
    button.innerHTML = `
      <span class="file-text">${this._translate('Loading')} ${fileName}...</span>
    `;
    button.disabled = true;
    button.style.opacity = '0.7';
  }
};

/**
 * Show file success state
 */
SpacePropertiesProvider.prototype.showFileSuccess = function(section, fileName) {
  const button = section.querySelector('.env-file-load-btn');
  if (button) {
    button.innerHTML = `
      <span class="file-text">${this._translate('Loaded')} ${fileName}</span>
    `;
    setTimeout(() => {
      button.disabled = false;
      button.style.opacity = '1';
    }, 1500);
  }
};

/**
 * Show file error state
 */
SpacePropertiesProvider.prototype.showFileError = function(section, message) {
  const button = section.querySelector('.env-file-load-btn');
  if (button) {
    button.innerHTML = `
      <span class="file-text">${message}</span>
    `;
    button.style.color = '#d32f2f';
    
    setTimeout(() => {
      const hasConfig = this._environmentService.hasConfiguration();
      button.innerHTML = `
        <span class="file-text">${hasConfig ? this._translate('Load Different File') : this._translate('Load environment.json')}</span>
      `;
      button.style.color = '';
      button.disabled = false;
      button.style.opacity = '1';
    }, 3000);
  }
};

/**
 * Refresh environment section
 */
SpacePropertiesProvider.prototype.refreshEnvironmentSection = function() {  
  // Check if we're currently showing an environment section
  const existingSection = document.querySelector('.space-properties-section[data-group-id="group-environment-config"]');
  if (existingSection) {
    // Force refresh by removing and recreating
    existingSection.remove();
    this.showEnvironmentSection();
  }
};

// Keep all existing task-related methods unchanged from the original SpacePropertiesProvider
SpacePropertiesProvider.prototype.hideSpaceSection = function() {
  const existingSection = document.querySelector('.space-properties-section');
  if (existingSection) {
    existingSection.remove();
  }
};

SpacePropertiesProvider.prototype.createStandaloneSpaceSection = function(element) {
  
  const propertiesPanel = document.querySelector('.bio-properties-panel-scroll-container');
  if (!propertiesPanel) {
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
        ${this.renderDestinationAttributes(element)}
      </div>

      <!-- Binding Entry (for Bind) -->
      <div data-entry-id="space-binding" 
           class="bio-properties-panel-entry space-binding-entry" 
           style="${currentType !== 'binding' ? 'display: none;' : ''}">
      </div>
    </div>
  `;

  // Attach event listeners
  this.attachSectionEventListeners(section, element);

  return section;
};

SpacePropertiesProvider.prototype.renderDestinationAttributes = function(element) {
  const destination = this._extensionService.getDestination(element);
  const hasEnvironment = this._environmentService.hasConfiguration();
  const translate = this._translate;
  
  if (!hasEnvironment || !destination) {
    return '';
  }
  // Find the place by id
  const place = this._environmentService.findPlaceById(destination);
  if(!place)
    return ``;

  // if (!place) {
  //   return `
  //     <div class="destination-attributes destination-not-found">
  //       <small class="bio-properties-panel-description">
  //         <span style="color: #f57c00;">${translate('Destination not found in environment')}</span>
  //       </small>
  //     </div>
  //   `;
  // }

  // Render place attributes
  const attributes = place.attributes || {};
  const attributeKeys = Object.keys(attributes);
  
  if (attributeKeys.length === 0) {
    return `
      <div class="destination-attributes destination-no-attributes">
        <small class="bio-properties-panel-description">
          <span style="color: #666;">${translate('No attributes available for this destination')}</span>
        </small>
      </div>
    `;
  }

  // Generate attributes HTML
  const attributesHtml = attributeKeys.map(key => {
    const value = attributes[key];
    let displayValue = value;
    let valueClass = 'attribute-value';
    
    // Special formatting for certain attribute types
    if (key === 'freeSeats') {
      if (value === 0) {
        displayValue = `${value} (${translate('Full')})`;
        valueClass = 'attribute-value attribute-value-warning';
      } else if (value > 0) {
        displayValue = `${value} ${translate('available')}`;
        valueClass = 'attribute-value attribute-value-success';
      }
    } else if (key === 'zone') {
      valueClass = 'attribute-value attribute-value-zone';
      displayValue = `Zone ${value}`;
    } else if (key === 'purpose') {
      valueClass = 'attribute-value attribute-value-purpose';
      displayValue = value.charAt(0).toUpperCase() + value.slice(1);
    }
    
    return `
      <div class="attribute-item">
        <span class="attribute-key">${translate(key)}:</span>
        <span class="${valueClass}">${displayValue}</span>
      </div>
    `;
  }).join('');

  return `
  <div class="destination-attributes destination-found">
      <small class="bio-properties-panel-description">
        <span>${translate('Destination attributes')}</span>
      </small>
      <div class="attributes-header">
      </div>
      <div class="attributes-content">
        ${attributesHtml}
      </div>
    </div>
  `;
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

  // Type selection 
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      try {
        const newType = e.target.value;
        
        if (newType) {
          this._taskTypeService.setTaskType(element, newType);
        } else {
          this._taskTypeService.clearTaskType(element);
        }

        // Update immediately
        this.updateFieldVisibility(section, newType);
        this.updateSectionIndicators(section, element);

      } catch (error) {
        console.error('Error changing type:', error);
      }
    });
  }

  // Destination input - save on change AND refresh attributes
  if (destinationInput) {
    ['input', 'blur', 'change'].forEach(eventType => {
      destinationInput.addEventListener(eventType, (e) => {        
        try {
          const value = e.target.value.trim();
          if (value) {
            this._extensionService.setExtension(element, 'space:Destination', value);
          }
          
          this.updateSectionIndicators(section, element);
          
          this.updateDestinationAttributes(section, element);
          
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

SpacePropertiesProvider.prototype.updateDestinationAttributes = function(section, element) {
  const destinationEntry = section.querySelector('.space-destination-entry');
  if (!destinationEntry) return;

  // Remove existing attributes
  const existingAttributes = destinationEntry.querySelector('.destination-attributes');
  if (existingAttributes) {
    existingAttributes.remove();
  }

  // Add attributes
  const attributesHtml = this.renderDestinationAttributes(element);
  if (attributesHtml) {
    const textField = destinationEntry.querySelector('.bio-properties-panel-textfield');
    textField.insertAdjacentHTML('beforeend', attributesHtml);
  }
};

SpacePropertiesProvider.prototype.updateFieldVisibility = function(section, selectedType) {
  const destinationEntry = section.querySelector('.space-destination-entry');
  const bindingEntry = section.querySelector('.space-binding-entry');
  const unbindingEntry = section.querySelector('.space-unbinding-entry');

  if (destinationEntry) {
    destinationEntry.style.display = selectedType === TASK_TYPE_KEYS.MOVEMENT ? 'block' : 'none';
  }
  if (bindingEntry) {
    bindingEntry.style.display = selectedType === TASK_TYPE_KEYS.BINDING ? 'block' : 'none';
  }
  if (unbindingEntry) {
    unbindingEntry.style.display = selectedType === TASK_TYPE_KEYS.UNBINDING ? 'block' : 'none';
  }
};

SpacePropertiesProvider.prototype.getStatusText = function(element, currentType) {
  const translate = this._translate;
  
  if (!currentType) {
    return `<strong>${translate('Status')}:</strong> ${translate('No configuration')} <br><em>${translate('Select a type to configure this task')}</em>`;
  }
  
  const config = getTaskConfig(currentType);
  let status = `<strong>${translate('Status')}:</strong> ${config.typeValue} ${translate('configured')}`;
  
  if (currentType === TASK_TYPE_KEYS.MOVEMENT) {
    const destination = this._extensionService.getDestination(element);
    status += `<br><strong>${translate('Destination')}:</strong> ${destination || `<em>${translate('(required)')}</em>`}`;
  } else if (currentType === TASK_TYPE_KEYS.BINDING) {
    const binding = this._extensionService.getBinding(element);
    status += `<br><strong>${translate('Participant')}:</strong> ${binding || `<em>${translate('(required)')}</em>`}`;
  } else if (currentType === TASK_TYPE_KEYS.UNBINDING) {
    status += `<br><em>${translate('Ready to release bound participants')}</em>`;
  }
  
  return status;
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
    
    this.updateDestinationAttributes(existingSection, element);
  }
};

SpacePropertiesProvider.prototype.getStatusText = function(element, currentType) {
  const translate = this._translate;
  
  if (!currentType) {
    return `<strong>${translate('Status')}:</strong> ${translate('No configuration')} <br><em>${translate('Select a type to configure this task')}</em>`;
  }
  
  const config = getTaskConfig(currentType);
  let status = `<strong>${translate('Status')}:</strong> ${config.typeValue} ${translate('configured')}`;
  
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