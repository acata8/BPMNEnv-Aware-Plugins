// ============================================================================
// Updated MovementContextPadProvider.js with clean UX improvements
// ============================================================================

import { getAllTaskTypes, getTaskConfig } from './TaskTypes';

// Form Handlers class - now uses injected services
class FormHandlers {
  constructor(extensionService, elementRegistry, modeling, elementFactory) {
    this.extensionService = extensionService;
    this.elementRegistry = elementRegistry;
    this.modeling = modeling;
    this.elementFactory = elementFactory;
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

    container.innerHTML = `
      <div class="menu-header">
        <div class="title">${translate("Set Movement Destination")}</div>
        <button type="button" class="btn-close" title="${translate("Close menu")}" aria-label="${translate("Close")}">
          <span class="close-icon">×</span>
        </button>
      </div>
      <div class="row">
        <input type="text" class="form-input" placeholder="${config.defaultDestination}" value="${currentValue}" />
      </div>
      <div class="row">
        <small class="help-text">${translate("Specify where this movement should go")}</small>
      </div>
      <div class="actions">
        <button type="button" class="btn-save">${translate("Save")}</button>
        <button type="button" class="btn-cancel">${translate("Cancel")}</button>
      </div>
    `;

    const input = container.querySelector(".form-input");
    
    // Auto-select text for easy editing
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);

    const onSave = () => {
      const newDestination = input.value.trim() || config.defaultDestination;
      this.extensionService.setExtension(element, "space:Destination", newDestination);
      this.createOrUpdateDestLabel(element, newDestination);
      onComplete(); // Close after save
    };

    this.attachFormHandlers(container, onSave, onComplete, input);
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

    container.innerHTML = `
      <div class="menu-header">
        <div class="title">${translate("Select Participant")}</div>
        <button type="button" class="btn-close" title="${translate("Close menu")}" aria-label="${translate("Close")}">
          <span class="close-icon">×</span>
        </button>
      </div>
      <div class="row">
        <select class="form-select" style="width:100%;padding:8px;border:1px solid #cfcfcf;border-radius:6px;outline:none;">
          ${participants.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join("")}
        </select>
      </div>
      <div class="actions">
        <button type="button" class="btn-save">${translate("Save")}</button>
        <button type="button" class="btn-cancel">${translate("Cancel")}</button>
      </div>
    `;

    const select = container.querySelector(".form-select");
    if (currentBinding) {
      const option = Array.from(select.options).find(o => o.value === currentBinding);
      if (option) select.value = currentBinding;
    }

    const onSave = () => {
      this.extensionService.setExtension(element, "space:Binding", select.value);
      onComplete(); // Close after save
    };

    this.attachFormHandlers(container, onSave, onComplete);
  }

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

  createOrUpdateDestLabel(element, value) {
    const displayText = value?.trim() || "${destination}";
    const existing = this.findDestAnnotation(element);

    if (existing) {
      this.modeling.updateModdleProperties(existing, existing.businessObject, {
        text: displayText
      });
      return;
    }

    const annotationShape = this.elementFactory.createShape({ type: "bpmn:TextAnnotation" });
    annotationShape.businessObject.text = displayText;

    const dy = Math.max(60, element.height * 0.8);
    const pos = { x: element.x, y: element.y + element.height / 2 + dy };

    const created = this.modeling.createShape(annotationShape, pos, element.parent);
    this.modeling.connect(element, created, { type: "bpmn:Association" });
  }

  findDestAnnotation(element) {
    const candidates = (element.outgoing || [])
      .filter(conn => conn.type === "bpmn:Association" && 
                     conn.target?.type === "bpmn:TextAnnotation")
      .map(conn => conn.target);

    return candidates.length === 1 ? candidates[0] : null;
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
  extensionService, validationService, taskTypeService
) {
  this._contextPad = contextPad;
  this._translate = translate;
  this._overlays = overlays;
  this._openMenus = new Map();

  // Use injected services
  this.extensionService = extensionService;
  this.validationService = validationService;
  this.taskTypeService = taskTypeService;
  this.formHandlers = new FormHandlers(extensionService, elementRegistry, modeling, elementFactory);

  contextPad.registerProvider(this);
  eventBus.on("shape.remove", ({ element }) => this._closeMenu(element));
}

MovementContextPadProvider.$inject = [
  "contextPad", "modeling", "bpmnFactory", "elementFactory", 
  "overlays", "eventBus", "translate", "elementRegistry",
  "extensionService", "validationService", "taskTypeService"
];

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
    
    // Special text for movement when it's current type
    const buttonText = (isCurrentType && config.key === "movement") 
      ? translate("Edit Destination") 
      : translate(config.typeValue);
    
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

  // Show current destination for movement tasks
  let currentInfo = "";
  if (currentType === "movement") {
    const currentDestination = this.extensionService.getDestination(element);
    currentInfo = `<div class="current-destination">
      ${translate("Current destination")}: <strong>${currentDestination || "${destination}"}</strong>
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
    // Same type selected - for movement, go directly to destination edit
    if (typeKey === "movement") {
      this.formHandlers.renderDestinationForm(container, element, config, translate, () => {
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

MovementContextPadProvider.prototype.getContextPadEntries = function(element) {
  if (element?.type !== "bpmn:Task") return {};

  return {
    "movement.open-type-menu": {
      group: "edit",
      className: "bpmn-icon-subprocess-collapsed",
      title: this._translate("Set Type…"),
      action: { click: () => this._openMenu(element) }
    }
  };
};

export default {
  __init__: ["movementContextPadProvider"],
  movementContextPadProvider: ["type", MovementContextPadProvider]
};