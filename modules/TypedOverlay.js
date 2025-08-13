import TASK_TYPES from "./TaskTypes";

function TypedOverlay(eventBus, overlays, elementRegistry) {
  this._overlays = overlays;
  this._registry = elementRegistry;

  function getSpaceTypeFromExt(bo) {
    const ex = bo.extensionElements && bo.extensionElements.values;
    if (!ex) return null;

    const typeEl = ex.find((v) => v.$type === "space:Type");
    if (typeEl && typeEl.value) return String(typeEl.value).toLowerCase();

    const camProps = ex.find((v) => v.$type === "camunda:Properties");
    if (camProps && camProps.values) {
      const prop = camProps.values.find((p) => p.name === "space:type");
      if (prop && prop.value) return String(prop.value).toLowerCase();
    }
    return null;
  }

  const updateBadge = (element) => {
    if (!element || element.type !== "bpmn:Task" || !element.businessObject)
      return;

    const typeValue = getSpaceTypeFromExt(element.businessObject);

    TASK_TYPES.forEach((cfg) => {
      const existing =
        this._overlays.get({ element, type: `${cfg.key}-badge` }) || [];
      existing.forEach((o) => this._overlays.remove(o.id));

      if (typeValue === cfg.typeValue) {
        this._overlays.add(element, `${type}-badge`, {
          scale: true,
          position: { top: 0, left: 0 },
          html: `<div class="${type}-badge" title="${label}"></div>`,
        });
      }
    });
  };

  eventBus.on("import.render.complete", () => {
    this._registry.getAll().forEach(updateBadge);
  });
  eventBus.on("shape.added", ({ element }) => updateBadge(element));
  eventBus.on("shape.changed", ({ element }) => updateBadge(element));
  eventBus.on(
    "elements.changed",
    ({ elements }) => elements && elements.forEach(updateBadge)
  );
  eventBus.on("commandStack.element.updateModdleProperties.executed", (e) => {
    const el = e && e.context && e.context.element;
    if (el) updateBadge(el);
  });
}

TypedOverlay.$inject = ["eventBus", "overlays", "elementRegistry"];

export default {
  __init__: ["typedOverlay"],
  typedOverlay: ["type", TypedOverlay],
};
