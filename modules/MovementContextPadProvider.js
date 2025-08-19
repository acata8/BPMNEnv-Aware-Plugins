import { getAllTaskTypes, getTaskConfig } from './TaskTypes';

// Enhanced Form Handlers class with environment integration
class FormHandlers {
  constructor(extensionService, elementRegistry, modeling, elementFactory, environmentService) {
    this.extensionService = extensionService;
    this.elementRegistry = elementRegistry;
    this.modeling = modeling;
    this.elementFactory = elementFactory;
    this.environmentService = environmentService; // New environment service
  }

  renderForm(container, element, config, translate, onComplete) {
    switch (config.formType) {
      case "destination":
        return this.renderDestinationForm(container, element, config, translate, onComplete);
      case "binding":
        return this.renderBindingForm(container, element, config, translate, onComplete);
      case "none":
        return onComplete();
      default:
        console.warn(`Unknown form type: ${config.formType}`);
    }
  }

  renderDestinationForm(container, element, config, translate, onComplete) {
    const currentValue = this.extensionService.getDestination(element);
    const hasEnvConfig = this.environmentService.hasConfiguration();
    const availableDestinations = hasEnvConfig ? this.environmentService.getAvailableDestinations() : [];

    container.innerHTML = `
      <div class="menu-header">
        <div class="title">${translate("Set Movement Destination")}</div>
        <button type="button" class="btn-close" title="${translate("Close menu")}" aria-label="${translate("Close")}">
          <span class="close-icon">×</span>
        </button>
      </div>
      
      ${hasEnvConfig ? this._renderEnvironmentDestinationForm(currentValue, availableDestinations, translate) : this._renderManualDestinationForm(currentValue, config, translate)}
      
      <div class="actions">
        <button type="button" class="btn-save">${translate("Save")}</button>
        <button type="button" class="btn-cancel">${translate("Cancel")}</button>
      </div>
    `;

    const input = container.querySelector(".form-input");
    const select = container.querySelector(".destination-select");
    
    // Set up input handlers based on mode
    if (hasEnvConfig && select) {
      this._setupEnvironmentDestinationHandlers(container, currentValue, availableDestinations);
    } else if (input) {
      // Auto-select text for easy editing
      setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
    }

    const onSave = () => {
      let newDestination;
      if (hasEnvConfig && select) {
        newDestination = select.value;
      } else if (input) {
        newDestination = input.value.trim() || config.defaultDestination;
      } else {
        newDestination = config.defaultDestination;
      }
      
      this.extensionService.setExtension(element, "space:Destination", newDestination);
      // Remove the text annotation creation - destination is stored in extension only
      onComplete(); // Close after save
    };

    this.attachFormHandlers(container, onSave, onComplete, input || select);
  }

  _renderEnvironmentDestinationForm(currentValue, availableDestinations, translate) {
    const configSummary = this.environmentService.getConfigSummary();
    
    return `
      <div class="env-config-info">
        <div class="config-status">
          <span class="config-icon">📄</span>
          <span class="config-text">${translate("Environment loaded")}: ${configSummary.fileName}</span>
        </div>
        <div class="config-summary">
          ${configSummary.summary.places} ${translate("places available")}
        </div>
      </div>
      
      <div class="row">
        <label class="form-label">${translate("Select Destination")}</label>
        <select class="destination-select form-select" style="width:100%;padding:8px;border:1px solid #cfcfcf;border-radius:6px;outline:none;">
          <option value="">${translate("-- Select a place --")}</option>
          ${availableDestinations.map(dest => 
            `<option value="${this.escapeHtml(dest)}" ${dest === currentValue ? 'selected' : ''}>${this.escapeHtml(dest)}</option>`
          ).join("")}
        </select>
      </div>
      
      <div class="row">
        <input type="text" class="form-input" placeholder="${translate("Or enter custom destination")}" value="${currentValue && !availableDestinations.includes(currentValue) ? currentValue : ''}" />
      </div>
      
      <div class="row">
        <small class="help-text">${translate("Choose from available places or enter a custom destination")}</small>
      </div>
    `;
  }

  _renderManualDestinationForm(currentValue, config, translate) {
    return `
      <div class="env-config-info env-config-missing">
        <div class="config-status">
          <span class="config-icon">⚠️</span>
          <span class="config-text">${translate("No environment configuration loaded")}</span>
        </div>
        <div class="config-action">
          <small>${translate("Load an environment.json file to see available destinations")}</small>
        </div>
      </div>
      
      <div class="row">
        <input type="text" class="form-input" placeholder="${config.defaultDestination}" value="${currentValue}" />
      </div>
      <div class="row">
        <small class="help-text">${translate("Specify where this movement should go")}</small>
      </div>
    `;
  }

  _setupEnvironmentDestinationHandlers(container, currentValue, availableDestinations) {
    const select = container.querySelector(".destination-select");
    const input = container.querySelector(".form-input");
    
    // Handle select changes
    select.addEventListener('change', () => {
      if (select.value) {
        input.value = ''; // Clear manual input when selecting from list
      }
    });
    
    // Handle manual input
    input.addEventListener('input', () => {
      if (input.value.trim()) {
        select.value = ''; // Clear selection when typing manually
      }
      
      // Show suggestions if available
      this._showDestinationSuggestions(input, availableDestinations);
    });
    
    // Set initial focus
    setTimeout(() => {
      if (currentValue && availableDestinations.includes(currentValue)) {
        select.focus();
      } else {
        input.focus();
        input.select();
      }
    }, 0);
  }

  _showDestinationSuggestions(input, availableDestinations) {
    const value = input.value.trim();
    if (!value || value.length < 2) return;
    
    const suggestions = this.environmentService.getDestinationSuggestions(value, 3);
    if (suggestions.length > 0) {
      // Could implement a dropdown suggestion list here
      console.log('Suggestions for "' + value + '":', suggestions);
    }
  }

  renderBindingForm(container, element, config, translate, onComplete) {
    const participants = this.getAvailableParticipants(element);
    
    if (!participants.length) {
      container.innerHTML = `
        <div class="menu-header">
          <div class="title">${translate("Select Participant")}</div>
          <button type="button" class="btn-close" title="${translate("Close menu")}" aria-label="${translate("Close")}">
            <span class="close-icon">×</span>
          </button>
        </div>
        <div class="row" style="color:#555; margin-bottom:6px;">
          ${translate("No other participants available. Add another Participant (pool) to bind.")}
        </div>
        <div class="actions">
          <button type="button" class="btn-cancel">${translate("OK")}</button>
        </div>
      `;
      container.querySelector(".btn-cancel").addEventListener("click", onComplete);
      return;
    }

    const currentBinding = this.extensionService.getBinding(element);
    
    // If no current binding, default to first available participant
    const defaultBinding = currentBinding || participants[0]?.id;

    container.innerHTML = `
      <div class="menu-header">
        <div class="title">${translate("Select Participant")}</div>
        <button type="button" class="btn-close" title="${translate("Close menu")}" aria-label="${translate("Close")}">
          <span class="close-icon">×</span>
        </button>
      </div>
      
      <div class="current-binding-info">
        <div class="config-status">
          <span class="config-text">${translate("Current binding")}: ${currentBinding ? this.escapeHtml(this.getParticipantNameById(currentBinding) || currentBinding) : translate("Will be set to first available")}</span>
        </div>
      </div>
      
      <div class="row">
        <label class="form-label">${translate("Select Participant to Bind")}</label>
        <select class="form-select binding-select" style="width:100%;padding:8px;border:1px solid #cfcfcf;border-radius:6px;outline:none;" required>
          ${participants.map(p => 
            `<option value="${p.id}" ${p.id === defaultBinding ? 'selected' : ''}>${this.escapeHtml(p.name)}</option>`
          ).join("")}
        </select>
      </div>
      
      <div class="row">
        <small class="help-text">${translate("Choose which participant (pool) this task should bind to. A binding is required.")}</small>
      </div>
      
      <div class="actions">
        <button type="button" class="btn-save">${translate("Save")}</button>
        <button type="button" class="btn-cancel">${translate("Cancel")}</button>
      </div>
    `;

    const select = container.querySelector(".binding-select");
    
    // Ensure a value is always selected
    if (!select.value && participants.length > 0) {
      select.value = participants[0].id;
    }
    
    // Focus on the select element
    setTimeout(() => {
      select.focus();
    }, 0);

    const onSave = () => {
      const selectedValue = select.value;
      // Always require a binding - never allow null/empty
      if (selectedValue) {
        this.extensionService.setExtension(element, "space:Binding", selectedValue);
        onComplete(); // Close after save
      } else {
        // This shouldn't happen since we remove the empty option, but just in case
        console.warn("No participant selected for binding");
      }
    };

    this.attachFormHandlers(container, onSave, onComplete, select);
  }

  // Helper method to get participant name by ID
  getParticipantNameById(participantId) {
    const participant = this.elementRegistry.get(participantId);
    return participant?.businessObject?.name || participantId;
  }

  // Utility methods for form handling
  attachFormHandlers(container, onSave, onCancel, focusElement = null) {
    container.querySelector(".btn-save")?.addEventListener("click", onSave);
    container.querySelector(".btn-cancel")?.addEventListener("click", onCancel);
    container.querySelector(".btn-close")?.addEventListener("click", onCancel);
    
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onSave();
      if (e.key === "Escape") onCancel();
    });

    if (focusElement) {
      setTimeout(() => focusElement.focus(), 0);
    }
  }

  getAvailableParticipants(element) {
    const containingParticipant = this.getContainingParticipant(element);
    
    return this.elementRegistry.getAll()
      .filter(e => e.type === "bpmn:Participant" && 
                   (!containingParticipant || e.id !== containingParticipant.id))
      .map(e => ({
        id: e.id,
        name: (e.businessObject?.name) || e.id
      }));
  }

  getContainingParticipant(element) {
    const process = element?.businessObject?.$parent;
    if (!process?.id) return null;

    return this.elementRegistry.getAll().find(e => {
      if (e.type !== "bpmn:Participant") return false;
      const pref = e.businessObject?.processRef;
      return pref?.id === process.id;
    });
  }

  escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

function MovementContextPadProvider(
  contextPad, modeling, bpmnFactory, elementFactory, overlays, 
  eventBus, translate, elementRegistry, 
  extensionService, validationService, taskTypeService, environmentService
) {
  this._contextPad = contextPad;
  this._translate = translate;
  this._overlays = overlays;
  this._openMenus = new Map();

  // Use injected services
  this.extensionService = extensionService;
  this.validationService = validationService;
  this.taskTypeService = taskTypeService;
  this.environmentService = environmentService; // Add environment service
  this.formHandlers = new FormHandlers(extensionService, elementRegistry, modeling, elementFactory, environmentService);

  contextPad.registerProvider(this);
  eventBus.on("shape.remove", ({ element }) => this._closeMenu(element));
}

MovementContextPadProvider.$inject = [
  "contextPad", "modeling", "bpmnFactory", "elementFactory", 
  "overlays", "eventBus", "translate", "elementRegistry",
  "extensionService", "validationService", "taskTypeService", "environmentService"
];

// Enhanced context pad entries to include edit options for current types
MovementContextPadProvider.prototype.getContextPadEntries = function(element) {
  if (element?.type !== "bpmn:Task") return {};

  const currentType = this.extensionService.getCurrentType(element);
  const entries = {};

  // Always show the main type menu
  entries["movement.open-type-menu"] = {
    group: "edit",
    className: "bpmn-icon-subprocess-collapsed",
    title: this._translate("Set Type…"),
    action: { click: () => this._openMenu(element) }
  };

  // Add specific edit entries for current type
  if (currentType === "movement") {
    entries["movement.edit-destination"] = {
      group: "edit",
      className: "bpmn-icon-conditional-flow",
      title: this._translate("Edit Destination"),
      action: { click: () => this._openDirectEditForm(element, "destination") }
    };
  } else if (currentType === "binding") {
    entries["movement.edit-binding"] = {
      group: "edit", 
      className: "bpmn-icon-connection-multi",
      title: this._translate("Edit Participant Binding"),
      action: { click: () => this._openDirectEditForm(element, "binding") }
    };
  }

  return entries;
};

// New method to open edit forms directly
MovementContextPadProvider.prototype._openDirectEditForm = function(element, formType) {
  this._contextPad.close();
  this._closeMenu(element);

  const container = document.createElement("div");
  container.className = "movement-type-menu";

  const overlayId = this._overlays.add(element, "movement-type-menu", {
    position: { top: 8, left: 8 },
    html: container,
    scale: true
  });
  this._openMenus.set(element.id, overlayId);

  const config = getTaskConfig(this.extensionService.getCurrentType(element));
  
  if (formType === "destination" && config) {
    this.formHandlers.renderDestinationForm(container, element, config, this._translate, () => {
      this._closeMenu(element);
    });
  } else if (formType === "binding" && config) {
    this.formHandlers.renderBindingForm(container, element, config, this._translate, () => {
      this._closeMenu(element);
    });
  }

  // Close on Escape key
  container.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      this._closeMenu(element);
    }
  });

  // Make the container focusable for keyboard interaction
  container.setAttribute("tabindex", "-1");
  setTimeout(() => container.focus(), 0);
};

MovementContextPadProvider.prototype._openMenu = function(element) {
  this._contextPad.close();
  this._closeMenu(element);

  const container = document.createElement("div");
  container.className = "movement-type-menu";
  container.innerHTML = this._createEnhancedMenuMarkup(element, this._translate);

  const overlayId = this._overlays.add(element, "movement-type-menu", {
    position: { top: 8, left: 8 },
    html: container,
    scale: true
  });
  this._openMenus.set(element.id, overlayId);

  // Handle type selection buttons
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-type]");
    if (btn && !btn.disabled) {
      this._handleTypeSelection(element, btn.getAttribute("data-type"), container, this._translate);
      return;
    }
    
    // Handle close button
    const closeBtn = e.target.closest(".btn-close");
    if (closeBtn) {
      this._closeMenu(element);
      return;
    }
  });

  // Close on Escape key
  container.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      this._closeMenu(element);
    }
  });

  // Make the container focusable for keyboard interaction
  container.setAttribute("tabindex", "-1");
  setTimeout(() => container.focus(), 0);
};

MovementContextPadProvider.prototype._createEnhancedMenuMarkup = function(element, translate) {
  const currentType = this.extensionService.getCurrentType(element);
  
  const buttons = getAllTaskTypes().map(config => {
    const isCurrentType = config.key === currentType;
    const validation = this._prevalidateTypeChange(element, config.key, translate);
    const hasWarnings = validation.hasWarnings;
    
    // Button styling classes
    let buttonClass = 'btn';
    if (isCurrentType) {
      buttonClass += ' btn-current';
    } else if (hasWarnings) {
      buttonClass += ' btn-warning'; // Whole button orange for warnings
    }
    
    // Special text for current types - show "Edit" instead of type name
    let buttonText;
    if (isCurrentType) {
      if (config.key === "movement") {
        buttonText = translate("Edit Destination");
      } else if (config.key === "binding") {
        buttonText = translate("Edit Participant");
      } else {
        buttonText = translate("Edit ") + translate(config.typeValue);
      }
    } else {
      buttonText = translate(config.typeValue);
    }
    
    // Get warning message for tooltip
    const warningTooltip = hasWarnings && validation.warnings && validation.warnings[0] 
      ? validation.warnings[0].message.replace(/[⚠️ℹ️]/g, '').trim()
      : '';
    
    // Build title attribute
    let titleAttr = '';
    if (isCurrentType) {
      titleAttr = 'title="Current type - click to edit"';
    } else if (hasWarnings && warningTooltip) {
      titleAttr = `title="${warningTooltip}"`;
    }
    
    return `
      <button type="button" 
              data-type="${config.key}" 
              class="${buttonClass}"
              ${titleAttr}>
        ${config.icon.iconFile ? `<img src="${config.icon.iconFile}" alt="${translate(config.typeValue)}" class="${config.icon.class}"/>` : ''}
        <span>${buttonText}</span>
        ${isCurrentType ? '<span class="current-icon">●</span>' : ''}
      </button>
    `;
  }).join('');

  // Show current info for configured tasks
  let currentInfo = "";
  if (currentType === "movement") {
    const currentDestination = this.extensionService.getDestination(element);
    currentInfo = `<div class="current-destination">
      ${translate("Current destination")}: <strong>${currentDestination || "${destination}"}</strong>
    </div>`;
  } else if (currentType === "binding") {
    const currentBinding = this.extensionService.getBinding(element);
    const participantName = currentBinding ? this.formHandlers.getParticipantNameById(currentBinding) : null;
    currentInfo = `<div class="current-destination">
      ${translate("Current binding")}: <strong>${participantName || currentBinding || translate("None selected")}</strong>
    </div>`;
  }

  return `
    <div class="menu-header">
      <div class="title">${translate("Set Task Type")}</div>
      <button type="button" class="btn-close" title="${translate("Close menu")}" aria-label="${translate("Close")}">
        <span class="close-icon">×</span>
      </button>
    </div>
    <div class="current-type">
      ${currentType ? translate(`Current: ${getTaskConfig(currentType)?.typeValue || currentType}`) : translate("No type set")}
    </div>
    ${currentInfo}
    <div class="buttons">${buttons}</div>
    <div class="menu-warning" style="display:none;"></div>
    <div class="menu-info" style="display:none;"></div>
  `;
};

// ... (all other existing methods remain the same)

MovementContextPadProvider.prototype._prevalidateTypeChange = function(element, newTypeKey, translate) {
  const currentType = this.extensionService.getCurrentType(element);
  
  if (currentType === newTypeKey) {
    return { valid: true };
  }

  // Get validation result (now includes warnings)
  const validation = this.validationService.quickValidationCheck(element, newTypeKey);
  return {
    valid: true, // Always allow changes
    hasWarnings: validation.hasWarnings,
    warningCount: validation.warningCount,
    warnings: validation.warnings
  };
};

MovementContextPadProvider.prototype._handleTypeSelection = function(element, typeKey, container, translate) {
  const config = getTaskConfig(typeKey);
  if (!config) return;

  const currentType = this.extensionService.getCurrentType(element);
  
  if (currentType === typeKey) {
    // Same type selected - go directly to appropriate edit form
    if (typeKey === "movement") {
      this.formHandlers.renderDestinationForm(container, element, config, translate, () => {
        this._closeMenu(element);
      });
      return;
    } else if (typeKey === "binding") {
      this.formHandlers.renderBindingForm(container, element, config, translate, () => {
        this._closeMenu(element);
      });
      return;
    }
    // For other types, just close menu
    this._closeMenu(element);
    return;
  }

  // Get validation warnings (if any)
  const validation = this.validationService.validateTypeChange(element, typeKey, translate);
  
  // Show warning in the menu if present, but don't block
  if (validation.warning) {
    this._showWarning(container, validation.warning);
  }

  // Apply the type change immediately
  this._executeTypeChange(element, typeKey, config, container, translate);
};

MovementContextPadProvider.prototype._executeTypeChange = function(element, typeKey, config, container, translate) {
  try {
    // Use TaskTypeService for the change
    this.taskTypeService.setTaskType(element, typeKey);

    // Clear any previous warnings
    this._clearWarning(container);

    // Handle different form types immediately
    if (config.formType === "destination") {
      // For movement - show destination form immediately
      this.formHandlers.renderDestinationForm(container, element, config, translate, () => {
        this._closeMenu(element);
      });
    } else if (config.formType === "binding") {
      // For binding - show participant selection immediately  
      this.formHandlers.renderBindingForm(container, element, config, translate, () => {
        this._closeMenu(element);
      });
    } else {
      // For unbinding or other types with no form - close immediately
      this._closeMenu(element);
    }
    
  } catch (error) {
    this._showValidationError(container, translate("Failed to change task type: " + error.message));
  }
};

MovementContextPadProvider.prototype._showWarning = function(container, message) {
  const warningBox = container.querySelector(".menu-warning");
  if (warningBox) {
    warningBox.innerHTML = `
      <div class="warning-content">
        <span class="warning-text">${message}</span>
      </div>
    `;
    warningBox.style.display = "block";
  }
};

MovementContextPadProvider.prototype._clearWarning = function(container) {
  const warningBox = container.querySelector(".menu-warning");
  if (warningBox) {
    warningBox.style.display = "none";
  }
};

MovementContextPadProvider.prototype._showValidationError = function(container, message) {
  const warningBox = container.querySelector(".menu-warning");
  if (warningBox) {
    warningBox.innerHTML = `
      <div class="error-content">
        <span class="error-text">${message}</span>
      </div>
    `;
    warningBox.style.display = "block";
  }
};

MovementContextPadProvider.prototype._closeMenu = function(element) {
  const overlayId = this._openMenus.get(element?.id);
  if (overlayId) {
    this._overlays.remove(overlayId);
    this._openMenus.delete(element.id);
  }
};

export default {
  __init__: ["movementContextPadProvider"],
  movementContextPadProvider: ["type", MovementContextPadProvider]
};