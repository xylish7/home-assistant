import { floorplanSvg } from "./floorplan-svg.js?v=8";

class ApartmentFloorplanCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._showDimensions = false;
    this._showDoors = false;
    this._selectedCircuit = "";
    this._rendered = false;
    this._panelPopoverOpen = false;
  }

  setConfig(config) {
    this._config = config || {};
    if (this._rendered) {
      this._renderDevices();
      this._updateStates();
      if (this._panelPopoverOpen) {
        this._renderPanelPopover();
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._updateStates();
  }

  connectedCallback() {
    if (!this._rendered) {
      this._render();
      this._rendered = true;
    }
  }

  _parseCircuit(circuit) {
    if (!circuit) return null;
    if (typeof circuit === "string") {
      const trimmed = circuit.trim();
      if (!trimmed) return null;
      return {
        id: trimmed.toLowerCase(),
        name: trimmed,
        safety_type: "",
        color: this._getSafetyColor(""),
        softColor: this._getSafetySoftColor(""),
        entities: [],
      };
    }
    if (typeof circuit === "object") {
      const name = circuit.name || circuit.title || circuit.id || "";
      if (!name) return null;
      const safetyType =
        circuit.safety_type ||
        circuit.type ||
        circuit.rating ||
        circuit.breaker ||
        "";
      const rawColor = circuit.color || circuit.colour || null;
      const color = rawColor || this._getSafetyColor(safetyType);
      const softColor = rawColor
        ? this._hexToSoft(rawColor)
        : this._getSafetySoftColor(safetyType);
      const isDisabled = Boolean(
        circuit.disabled === true ||
        circuit.disable === true ||
        circuit.enabled === false
      );
      return {
        id: (circuit.id || name).trim().toLowerCase(),
        name: String(name).trim(),
        safety_type: safetyType ? String(safetyType).trim().toUpperCase() : "",
        color,
        softColor,
        entities: Array.isArray(circuit.entities) ? circuit.entities : [],
        disabled: isDisabled,
      };
    }
    return null;
  }

  _getSafetyColor(safetyType) {
    const s = String(safetyType || "").toUpperCase();
    if (s.includes("C25")) return "var(--c25-color, #f7768e)";
    if (s.includes("C20")) return "var(--c20-color, #e0af68)";
    if (s.includes("C16")) return "var(--c16-color, #7aa2f7)";
    if (s.includes("C10")) return "var(--c10-color, #9ece6a)";
    return "var(--c16-color, #7aa2f7)";
  }

  _getSafetySoftColor(safetyType) {
    const s = String(safetyType || "").toUpperCase();
    if (s.includes("C25")) return "var(--c25-soft, rgba(247, 118, 142, 0.22))";
    if (s.includes("C20")) return "var(--c20-soft, rgba(224, 175, 104, 0.22))";
    if (s.includes("C16")) return "var(--c16-soft, rgba(122, 162, 247, 0.22))";
    if (s.includes("C10")) return "var(--c10-soft, rgba(158, 206, 106, 0.22))";
    return "var(--c16-soft, rgba(122, 162, 247, 0.22))";
  }

  _hexToSoft(color) {
    if (!color) return "rgba(122, 162, 247, 0.22)";
    if (color.startsWith("rgba") || color.startsWith("var")) return color;
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, 0.22)`;
      }
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return `rgba(${r}, ${g}, ${b}, 0.22)`;
      }
    }
    return color;
  }

  _getAvailableCircuits() {
    const circuitsMap = new Map();
    const devices = this._config?.devices || [];

    // 1. Primary: check circuits defined on panel device
    const panelDev = devices.find(
      (d) =>
        d.type === "panel" ||
        d.type === "electrical-panel" ||
        d.type === "electric-panel" ||
        d.panel === true
    );

    if (panelDev && Array.isArray(panelDev.circuits)) {
      panelDev.circuits.forEach((c) => {
        const parsed = this._parseCircuit(c);
        if (parsed && !circuitsMap.has(parsed.id)) {
          circuitsMap.set(parsed.id, parsed);
        }
      });
    }

    // 2. Secondary: check root config.circuits
    if (Array.isArray(this._config?.circuits)) {
      this._config.circuits.forEach((c) => {
        const parsed = this._parseCircuit(c);
        if (parsed && !circuitsMap.has(parsed.id)) {
          circuitsMap.set(parsed.id, parsed);
        }
      });
    }

    // 3. Fallback: discover inline circuit objects from devices
    devices.forEach((dev) => {
      if (dev.circuit && typeof dev.circuit === "object") {
        const parsed = this._parseCircuit(dev.circuit);
        if (parsed && !circuitsMap.has(parsed.id)) {
          circuitsMap.set(parsed.id, parsed);
        }
      }
    });

    return Array.from(circuitsMap.values());
  }

  _getDeviceCircuit(dev, availableCircuits = null) {
    if (!dev || !dev.circuit) return null;
    const circuits = availableCircuits || this._getAvailableCircuits();

    if (typeof dev.circuit === "string") {
      const ref = dev.circuit.trim().toLowerCase();
      // Match by ID or Name
      const found = circuits.find(
        (c) => c.id === ref || c.name.toLowerCase() === ref
      );
      if (found) return found;
      return this._parseCircuit(dev.circuit);
    }

    if (typeof dev.circuit === "object") {
      const id = (dev.circuit.id || dev.circuit.name || "").trim().toLowerCase();
      const parent = circuits.find(
        (c) =>
          c.id === id ||
          (dev.circuit.name && c.name.toLowerCase() === dev.circuit.name.toLowerCase())
      );
      if (parent) {
        return {
          ...parent,
          ...dev.circuit,
          id: parent.id,
          name: dev.circuit.name || parent.name,
          safety_type: dev.circuit.safety_type || parent.safety_type,
          color: dev.circuit.color || parent.color,
          softColor: dev.circuit.color
            ? this._hexToSoft(dev.circuit.color)
            : parent.softColor,
        };
      }
      return this._parseCircuit(dev.circuit);
    }

    return null;
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('/local/custom/floorplan/floorplan-card.css?v=40');
      </style>

      <div class="toolbar-wrap">
        <div class="btn-group">
          <button id="toggle-dims" class="chip-btn btn-dims">📏 Cote</button>
          <button id="toggle-doors" class="chip-btn btn-doors">🚪 Uși</button>
        </div>
      </div>

      <div class="svg-container">
        ${floorplanSvg}
        <div id="coord-toast" class="coord-toast"></div>
        <div id="fp-popover" class="fp-popover"></div>
        <div id="panel-popover" class="fp-panel-popover"></div>
      </div>
    `;

    // Hook button toggles
    const dimsBtn = this.shadowRoot.getElementById("toggle-dims");
    const doorsBtn = this.shadowRoot.getElementById("toggle-doors");
    const dimsLayer = this.shadowRoot.getElementById("dimensions");
    const doorsLayer = this.shadowRoot.getElementById("doors");

    if (dimsBtn && dimsLayer) {
      dimsLayer.style.display = this._showDimensions ? "" : "none";
      dimsBtn.classList.toggle("active", this._showDimensions);
      dimsBtn.addEventListener("click", () => {
        this._showDimensions = !this._showDimensions;
        dimsBtn.classList.toggle("active", this._showDimensions);
        dimsLayer.style.display = this._showDimensions ? "" : "none";
      });
    }

    if (doorsBtn && doorsLayer) {
      doorsLayer.style.display = this._showDoors ? "" : "none";
      doorsBtn.classList.toggle("active", this._showDoors);
      doorsBtn.addEventListener("click", () => {
        this._showDoors = !this._showDoors;
        doorsBtn.classList.toggle("active", this._showDoors);
        doorsLayer.style.display = this._showDoors ? "" : "none";
      });
    }

    // Coordinate helper: click on SVG canvas to inspect (x, y)
    const svgEl = this.shadowRoot.querySelector("svg");
    const coordToast = this.shadowRoot.getElementById("coord-toast");
    const popover = this.shadowRoot.getElementById("fp-popover");

    if (svgEl) {
      svgEl.addEventListener("click", (e) => {
        if (popover) popover.classList.remove("visible");

        if (
          e.target.closest(".fp-device") ||
          e.target.closest(".room-group") ||
          e.target.closest(".chip-btn") ||
          e.target.closest(".fp-panel-popover")
        )
          return;

        // If clicking outside on SVG canvas, close panel popover if open
        if (this._panelPopoverOpen && !e.target.closest(".fp-panel-popover")) {
          this._hidePanelPopover();
        }

        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgEl.getScreenCTM().inverse());
        const x = Math.round(svgP.x);
        const y = Math.round(svgP.y);

        console.log(`[Floorplan Coordinate] x: ${x}, y: ${y}`);
        if (coordToast) {
          coordToast.textContent = `📍 x: ${x}, y: ${y}`;
          coordToast.classList.add("visible");
          clearTimeout(this._toastTimeout);
          this._toastTimeout = setTimeout(() => {
            coordToast.classList.remove("visible");
          }, 2500);
        }
      });
    }

    // Render YAML-configured devices
    this._renderDevices();

    // Legacy room click handlers (if room-group elements exist)
    const roomGroups = this.shadowRoot.querySelectorAll(".room-group");
    roomGroups.forEach((group) => {
      group.addEventListener("click", () => {
        const roomNum = group.getAttribute("data-room");
        const entityId = this._config?.entities?.[roomNum];
        if (entityId && this._hass) {
          this._hass.callService("homeassistant", "toggle", {
            entity_id: entityId,
          });
        }
      });
    });

    this._updateStates();
  }

  _applyCircuitHighlight() {
    const selectedId = this._selectedCircuit;
    const devices = this._config?.devices || [];
    const circuits = this._getAvailableCircuits();
    const activeCirc = circuits.find((c) => c.id === selectedId);

    devices.forEach((dev, idx) => {
      const el = this.shadowRoot.getElementById(`fp-device-${idx}`);
      if (!el) return;

      const isPanel =
        dev.type === "panel" ||
        dev.type === "electrical-panel" ||
        dev.type === "electric-panel" ||
        dev.panel === true;

      if (isPanel) {
        el.classList.remove("circuit-dimmed");
        if (selectedId) {
          el.classList.add("panel-active");
          el.style.setProperty(
            "--circuit-color",
            activeCirc ? activeCirc.color : "var(--c16-color)"
          );
        } else {
          el.classList.remove("panel-active");
          el.style.removeProperty("--circuit-color");
        }
        return;
      }

      if (!selectedId) {
        el.classList.remove("circuit-highlighted", "circuit-dimmed");
        el.style.removeProperty("--circuit-color");
        el.style.removeProperty("--circuit-soft");
      } else {
        const devCirc = this._getDeviceCircuit(dev, circuits);
        const matches = devCirc && devCirc.id === selectedId;

        if (matches) {
          el.classList.add("circuit-highlighted");
          el.classList.remove("circuit-dimmed");
          el.style.setProperty(
            "--circuit-color",
            activeCirc ? activeCirc.color : devCirc.color
          );
          el.style.setProperty(
            "--circuit-soft",
            activeCirc ? activeCirc.softColor : devCirc.softColor
          );
        } else {
          el.classList.remove("circuit-highlighted");
          el.classList.add("circuit-dimmed");
          el.style.removeProperty("--circuit-color");
          el.style.removeProperty("--circuit-soft");
        }
      }
    });

    const roomGroups = this.shadowRoot.querySelectorAll(".room-group");
    roomGroups.forEach((group) => {
      if (!selectedId) {
        group.classList.remove("circuit-dimmed", "circuit-highlighted");
      } else {
        const roomNum = group.getAttribute("data-room");
        const entityId = this._config?.entities?.[roomNum];
        const isMatchedEntity =
          activeCirc?.entities &&
          entityId &&
          activeCirc.entities.includes(entityId);
        if (isMatchedEntity) {
          group.classList.remove("circuit-dimmed");
          group.classList.add("circuit-highlighted");
        } else if (activeCirc?.entities?.length) {
          group.classList.add("circuit-dimmed");
          group.classList.remove("circuit-highlighted");
        }
      }
    });
  }

  _showPanelPopover(anchorEl, dev) {
    const popover = this.shadowRoot.getElementById("panel-popover");
    const container = this.shadowRoot.querySelector(".svg-container");
    if (!popover || !container) return;

    this._panelAnchorEl = anchorEl;
    this._panelDev = dev;
    this._panelPopoverOpen = true;

    this._renderPanelPopover();
    popover.classList.add("visible");
  }

  _hidePanelPopover() {
    const popover = this.shadowRoot.getElementById("panel-popover");
    if (popover) {
      popover.classList.remove("visible");
    }
    this._panelPopoverOpen = false;
  }

  _updatePanelPopoverState() {
    const popover = this.shadowRoot.getElementById("panel-popover");
    if (!popover) return;
    const resetBtn = popover.querySelector("#panel-btn-reset");
    if (resetBtn) {
      resetBtn.style.display = this._selectedCircuit ? "inline-flex" : "none";
    }
    const mcbs = popover.querySelectorAll(".mcb");
    mcbs.forEach((mcb) => {
      const isDisabled = mcb.classList.contains("disabled") || mcb.getAttribute("data-disabled") === "true";
      if (isDisabled) {
        mcb.classList.remove("active");
        return;
      }
      const dataId = mcb.getAttribute("data-circuit-id");
      const isActive = Boolean(this._selectedCircuit && this._selectedCircuit === dataId);
      mcb.classList.toggle("active", isActive);
    });
  }

  _renderPanelPopover() {
    const popover = this.shadowRoot.getElementById("panel-popover");
    const container = this.shadowRoot.querySelector(".svg-container");
    if (!popover || !container) return;

    const oldRail = popover.querySelector("#panel-din-rail");
    const savedScroll = oldRail ? oldRail.scrollLeft : 0;

    const circuits = this._getAvailableCircuits();
    const title = this._panelDev?.name || "Tablou Electric";
    const rawIcon = this._panelDev?.icon || "mdi:electric-switch";
    const panelIcon = (!rawIcon || rawIcon === "mdi:fuse-box") ? "mdi:electric-switch" : rawIcon;

    const hasExplicitGeneral = circuits.some(
      (c) => c.id === "general" || c.id === "all" || c.name.toLowerCase() === "general"
    );

    const isGeneralDisabled = Boolean(this._panelDev?.disable_general || this._panelDev?.general_disabled);

    let generalMcbHtml = "";
    if (!hasExplicitGeneral) {
      const isGeneralActive = Boolean(
        !isGeneralDisabled &&
        this._selectedCircuit &&
        (this._selectedCircuit === "general" || this._selectedCircuit === "all")
      );
      generalMcbHtml = `
        <div class="mcb c25 ${isGeneralActive ? "active" : ""} ${isGeneralDisabled ? "disabled" : ""}" data-circuit-id="general" data-disabled="${isGeneralDisabled ? "true" : "false"}" title="Siguranța Generală${isGeneralDisabled ? " - Dezactivat" : ""}">
          <span class="mcb-circuit-title">General</span>
          <span class="mcb-brand">Legrand</span>
          <div class="mcb-switch-slot"><div class="mcb-toggle"></div></div>
          <span class="mcb-rating">C25</span>
        </div>
      `;
    }

    const breakersHtml = circuits
      .map((c) => {
        const isGeneral =
          c.id === "general" || c.id === "all" || c.name.toLowerCase() === "general";
        const rating = c.safety_type || (isGeneral ? "C25" : "C16");
        const ratingLower = rating.toLowerCase();
        let ratingClass = "c16";
        if (ratingLower.includes("c25")) ratingClass = "c25";
        else if (ratingLower.includes("c20")) ratingClass = "c20";
        else if (ratingLower.includes("c10")) ratingClass = "c10";
        else if (ratingLower.includes("c16")) ratingClass = "c16";

        const isDisabled = Boolean(c.disabled);
        const isActive = Boolean(!isDisabled && this._selectedCircuit && this._selectedCircuit === c.id);

        const dataId = c.id;

        const customStyle = c.color
          ? ` style="--mcb-accent: ${c.color}; --mcb-soft: ${c.softColor};"`
          : "";

        const titleText = `${c.name} (${rating})${isDisabled ? " - Dezactivat" : ""}`;

        return `
        <div class="mcb ${ratingClass} ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}" data-circuit-id="${dataId}" data-disabled="${isDisabled ? "true" : "false"}" title="${titleText}"${customStyle}>
          <span class="mcb-circuit-title">${c.name}</span>
          <span class="mcb-brand">Legrand</span>
          <div class="mcb-switch-slot"><div class="mcb-toggle"></div></div>
          <span class="mcb-rating">${rating}</span>
        </div>
      `;
      })
      .join("");

    popover.innerHTML = `
      <div class="panel-popover-card">
        <div class="panel-popover-header">
          <div class="panel-header-left">
            <ha-icon icon="${panelIcon}"></ha-icon>
            <span class="panel-header-title">${title}</span>
          </div>
          <div class="panel-header-actions">
            <button class="panel-reset-btn" id="panel-btn-reset" title="Resetează" style="display: ${this._selectedCircuit ? "inline-flex" : "none"};">Reset</button>
            <button class="panel-close-btn" id="panel-btn-close" title="Închide">✕</button>
          </div>
        </div>

        <div class="din-rail" id="panel-din-rail">
            ${generalMcbHtml}
            ${breakersHtml}
        </div>
      </div>
    `;

    const newRail = popover.querySelector("#panel-din-rail");
    if (newRail && savedScroll > 0) {
      newRail.scrollLeft = savedScroll;
    }

    // Position popover relative to anchor
    if (this._panelAnchorEl) {
      const rect = this._panelAnchorEl.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const posX = rect.left - contRect.left + rect.width / 2;
      const posY = rect.top - contRect.top;

      popover.style.left = `${posX}px`;
      if (posY < 200) {
        popover.style.top = `${posY + rect.height + 12}px`;
        popover.classList.add("pos-below");
      } else {
        popover.style.top = `${posY - 12}px`;
        popover.classList.remove("pos-below");
      }
    }

    // Attach listeners inside panel popover
    const closeBtn = popover.querySelector("#panel-btn-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._hidePanelPopover();
      });
    }

    const resetBtn = popover.querySelector("#panel-btn-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._selectedCircuit = "";
        this._applyCircuitHighlight();
        this._updatePanelPopoverState();
      });
    }

    const mcbs = popover.querySelectorAll(".mcb");
    mcbs.forEach((mcb) => {
      mcb.addEventListener("click", (e) => {
        e.stopPropagation();
        const isDisabled = mcb.classList.contains("disabled") || mcb.getAttribute("data-disabled") === "true";
        if (isDisabled) return;

        const circId = mcb.getAttribute("data-circuit-id");
        if (!circId || this._selectedCircuit === circId) {
          this._selectedCircuit = "";
        } else {
          this._selectedCircuit = circId;
        }
        this._applyCircuitHighlight();
        this._updatePanelPopoverState();
      });
    });
  }

  _renderDevices() {
    const layer = this.shadowRoot.getElementById("room-labels");
    if (!layer) return;

    const devices = this._config?.devices || [];
    if (!devices.length) {
      layer.innerHTML = "";
      return;
    }

    const circuits = this._getAvailableCircuits();

    layer.innerHTML = devices
      .map((dev, idx) => {
        const x = Number(dev.x ?? dev.left) || 0;
        const y = Number(dev.y ?? dev["true"] ?? dev.top) || 0;
        const isPanel =
          dev.type === "panel" ||
          dev.type === "electrical-panel" ||
          dev.type === "electric-panel" ||
          dev.panel === true;

        const isSwitch =
          dev.type === "light-switch" ||
          dev.type === "light_switch" ||
          dev.type === "lightswitch" ||
          dev.type === "intrerupator" ||
          dev.type === "comutator" ||
          (dev.type === "switch" && !dev.entity) ||
          dev.switches !== undefined ||
          dev.gangs !== undefined ||
          dev.clape !== undefined;

        let switchCount = 1;
        if (Array.isArray(dev.switches)) {
          switchCount = dev.switches.length;
        } else if (Array.isArray(dev.gangs)) {
          switchCount = dev.gangs.length;
        } else if (Array.isArray(dev.clape)) {
          switchCount = dev.clape.length;
        } else {
          const countVal = dev.switches ?? dev.gangs ?? dev.clape ?? dev.buttons ?? dev.slots ?? dev.count;
          if (countVal !== undefined && countVal !== null && !isNaN(Number(countVal))) {
            switchCount = Math.max(1, parseInt(countVal, 10));
          }
        }

        const r = Number(dev.size) || (isPanel ? 15 : 14);
        const iconSize = isPanel ? 18 : 16;

        let icon = dev.icon;
        if (isPanel) {
          icon = (!icon || icon === "mdi:fuse-box" || icon === "??" || icon === "?")
            ? "mdi:electric-switch"
            : icon;
        } else if (isSwitch) {
          if (!icon || icon === "??" || icon === "?") {
            icon = "mdi:light-switch";
          }
        } else if (!icon || icon === "??" || icon === "?") {
          if (
            dev.type === "socket" ||
            Array.isArray(dev.entries) ||
            dev.slots
          ) {
            icon = "mdi:power-socket-eu";
          } else if (dev.entity) {
            icon = dev.entity.startsWith("switch.")
              ? "mdi:power"
              : "mdi:lightbulb";
          } else {
            icon = "mdi:power-socket-eu";
          }
        }
        const isMdi = icon.includes(":");
        const name = dev.name
          ? `<title>${dev.name}</title>`
          : dev.entity
            ? `<title>${dev.entity}</title>`
            : "";

        let iconMarkup = "";
        if (isMdi) {
          iconMarkup = `<foreignObject x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" style="pointer-events: none; overflow: visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: center; width: ${r * 2}px; height: ${r * 2}px; font-size: 0; line-height: 0; margin: 0; padding: 0; box-sizing: border-box;"><ha-icon icon="${icon}" style="--mdc-icon-size: ${iconSize}px; width: ${iconSize}px; height: ${iconSize}px; --ha-icon-display: flex; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; pointer-events: none; transform: translate(-1px, -1px);"></ha-icon></div></foreignObject>`;
        } else {
          iconMarkup = `<text class="device-icon" text-anchor="middle" dominant-baseline="central" font-size="${Math.round(r * 1.0)}" pointer-events="none">${icon}</text>`;
        }

        const devCirc = this._getDeviceCircuit(dev, circuits);
        const circuitAttr = devCirc ? ` data-circuit="${devCirc.id}"` : "";
        const panelClass = isPanel ? " fp-panel-device" : "";

        return `
        <g class="fp-device${panelClass}" id="fp-device-${idx}" data-entity="${dev.entity || ""}"${circuitAttr} transform="translate(${x}, ${y})">
          ${name}
          <circle class="device-badge" r="${r}" />
          ${iconMarkup}
        </g>
      `;
      })
      .join("");

    const popover = this.shadowRoot.getElementById("fp-popover");
    const container = this.shadowRoot.querySelector(".svg-container");

    const showPopover = (el, dev) => {
      if (!popover || !container) return;
      const rect = el.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();

      const isPanel =
        dev.type === "panel" ||
        dev.type === "electrical-panel" ||
        dev.type === "electric-panel" ||
        dev.panel === true;

      const isSwitch =
        dev.type === "light-switch" ||
        dev.type === "light_switch" ||
        dev.type === "lightswitch" ||
        dev.type === "intrerupator" ||
        dev.type === "comutator" ||
        (dev.type === "switch" && !dev.entity) ||
        dev.switches !== undefined ||
        dev.gangs !== undefined ||
        dev.clape !== undefined;

      let switchCount = 1;
      if (Array.isArray(dev.switches)) {
        switchCount = dev.switches.length;
      } else if (Array.isArray(dev.gangs)) {
        switchCount = dev.gangs.length;
      } else if (Array.isArray(dev.clape)) {
        switchCount = dev.clape.length;
      } else {
        const countVal = dev.switches ?? dev.gangs ?? dev.clape ?? dev.buttons ?? dev.slots ?? dev.count;
        if (countVal !== undefined && countVal !== null && !isNaN(Number(countVal))) {
          switchCount = Math.max(1, parseInt(countVal, 10));
        }
      }

      const devName =
        dev.name ||
        (isSwitch
          ? (switchCount === 1 ? "Întrerupător" : switchCount === 2 ? "Întrerupător dublu" : switchCount === 3 ? "Întrerupător triplu" : `Întrerupător (${switchCount} clape)`)
          : dev.type === "socket"
            ? "Priza de Perete"
            : "Dispozitiv");

      let icon = dev.icon;
      if (isPanel) {
        icon = (!icon || icon === "mdi:fuse-box" || icon === "??" || icon === "?")
          ? "mdi:electric-switch"
          : icon;
      } else if (isSwitch) {
        if (!icon || icon === "??" || icon === "?") {
          icon = "mdi:light-switch";
        }
      } else if (!icon || icon === "??" || icon === "?") {
        icon = (dev.type === "socket")
          ? "mdi:power-socket-eu"
          : dev.entity
            ? "mdi:lightbulb"
            : "mdi:power-socket-eu";
      }

      const isMdi = icon.includes(":");
      const iconHtml = isMdi
        ? `<ha-icon icon="${icon}"></ha-icon>`
        : `<span>${icon}</span>`;

      // Normalize entries / slots / strips
      let totalSlots = Number(dev.slots ?? dev.entries_count) || 0;
      let rawEntries = Array.isArray(dev.entries) ? [...dev.entries] : [];

      if (
        rawEntries.length === 0 &&
        (Array.isArray(dev.strips) || Array.isArray(dev.outlets))
      ) {
        const sList = dev.strips || dev.outlets;
        rawEntries = sList.map((s) => ({ strip: s }));
      }

      if (totalSlots > 0 && rawEntries.length < totalSlots) {
        while (rawEntries.length < totalSlots) {
          rawEntries.push({ empty: true });
        }
      } else if (rawEntries.length > 0 && totalSlots === 0) {
        totalSlots = rawEntries.length;
      }

      let usedCount = 0;
      const normalizedEntries = rawEntries.map((e, idx) => {
        const entryNum = idx + 1;
        const entryName =
          e && typeof e === "object" && e.name ? e.name : "P" + entryNum;

        if (
          !e ||
          e === true ||
          e.empty ||
          (typeof e === "object" && Object.keys(e).length === 0)
        ) {
          return {
            type: "empty",
            name: entryName,
            entryNum,
          };
        }

        if (e.strip || (typeof e === "object" && e.items && !e.item)) {
          const s = e.strip || e;
          const sItems = Array.isArray(s)
            ? s
            : Array.isArray(s.items)
              ? s.items
              : Array.isArray(s.connected)
                ? s.connected
                : [];
          const sSlots =
            !Array.isArray(s) && Number(s.slots) ? Number(s.slots) : 0;
          const sIcon =
            !Array.isArray(s) && s.icon ? s.icon : e.icon ? e.icon : null;
          const sFallbackName = !Array.isArray(s) && s.name ? s.name : null;
          const finalName = e.name
            ? e.name
            : sFallbackName
              ? sFallbackName
              : entryName;

          usedCount++;
          return {
            type: "strip",
            name: finalName,
            icon: sIcon,
            items: sItems,
            slots: sSlots,
            entryNum,
          };
        }

        const itemVal =
          typeof e === "string"
            ? e
            : e.item || (Array.isArray(e.items) ? e.items : null);
        const items = Array.isArray(itemVal)
          ? itemVal
          : itemVal
            ? [itemVal]
            : [];
        const iIcon =
          typeof e === "object" && e.icon ? e.icon : "mdi:power-plug";
        usedCount++;
        return {
          type: "item",
          name: entryName,
          itemName: typeof e === "object" && e.label ? e.label : null,
          icon: iIcon,
          items,
          entryNum,
        };
      });

      const flatList = Array.isArray(dev.connected)
        ? dev.connected
        : Array.isArray(dev.plugged)
          ? dev.plugged
          : Array.isArray(dev.items)
            ? dev.items
            : typeof dev.connected === "string"
              ? dev.connected
                  .split(/\n|,/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];

      let contentHtml = "";

      // For light switches: display only top part (no bottom entries)
      if (isSwitch) {
        contentHtml = "";
      } else if (normalizedEntries.length > 0) {
        contentHtml = `
          <div class="socket-entries">
            ${normalizedEntries
              .map((entry) => {
                if (entry.type === "strip") {
                  const sIconHtml = entry.icon
                    ? entry.icon.includes(":")
                      ? `<ha-icon icon="${entry.icon}"></ha-icon>`
                      : `<span>${entry.icon}</span>`
                    : "";
                  const stripBadge = entry.slots
                    ? `<span class="entry-slots-badge">${entry.items.length}/${entry.slots}</span>`
                    : "";

                  return `
                  <div class="entry-card is-strip">
                    <div class="entry-header">
                      ${sIconHtml}
                      <span class="entry-title">${entry.name}</span>
                      <div class="entry-badges">
                        ${!entry.name.toLowerCase().includes("prelungitor") && !entry.name.toLowerCase().includes("strip") ? '<span class="entry-type-tag">Prelungitor</span>' : ""}
                        ${stripBadge}
                      </div>
                    </div>
                    <ul class="entry-items-list">
                      ${
                        entry.items.length > 0
                          ? entry.items
                              .map(
                                (it) => `
                        <li>
                          <span class="popover-dot"></span>
                          <span>${it}</span>
                        </li>
                      `,
                              )
                              .join("")
                          : '<li class="entry-empty-body">Prelungitor liber (fara consumatori)</li>'
                      }
                    </ul>
                  </div>
                `;
                } else if (entry.type === "item") {
                  return `
                  <div class="entry-card is-direct">
                    <div class="entry-header">
                      <span class="entry-title">${entry.name}</span>
                      <div class="entry-badges">
                        ${entry.itemName ? `<span class="entry-type-tag">${entry.itemName}</span>` : '<span class="entry-type-tag">Direct</span>'}
                      </div>
                    </div>
                    <ul class="entry-items-list">
                      ${entry.items
                        .map(
                          (it) => `
                        <li>
                          <span class="popover-dot dot-direct"></span>
                          <span>${it}</span>
                        </li>
                      `,
                        )
                        .join("")}
                    </ul>
                  </div>
                `;
                } else {
                  return `
                  <div class="entry-card is-empty">
                    <div class="entry-header">
                      <span class="entry-title">${entry.name}</span>
                      <div class="entry-badges">
                        <span class="entry-empty-tag">Libera</span>
                      </div>
                    </div>
                    <div class="entry-empty-body">Priza disponibila / neutilizata</div>
                  </div>
                `;
                }
              })
              .join("")}
          </div>
        `;
      } else if (flatList.length > 0) {
        contentHtml = `
          <ul class="popover-list">
            ${flatList
              .map(
                (item) => `
              <li>
                <span class="popover-dot"></span>
                <span>${item}</span>
              </li>
            `,
              )
              .join("")}
          </ul>
        `;
      }

      let totalBadge = "";
      if (isSwitch) {
        totalBadge = `<span class="socket-total-badge">${switchCount} ${switchCount === 1 ? "clapă" : "clape"}</span>`;
      } else if (totalSlots > 0) {
        totalBadge = `<span class="socket-total-badge">${usedCount}/${totalSlots}</span>`;
      }

      const devCirc = this._getDeviceCircuit(dev, circuits);
      let circuitBadgeHtml = "";
      if (devCirc) {
        const ratingStr = devCirc.safety_type ? ` • ${devCirc.safety_type}` : "";
        circuitBadgeHtml = `
          <div class="popover-circuit-tag" style="--tag-color: ${devCirc.color};">
            <ha-icon icon="mdi:flash"></ha-icon>
            <span>${devCirc.name}${ratingStr}</span>
          </div>
        `;
      }

      popover.innerHTML = `
        <div class="popover-header">
          <div class="popover-header-row">
            <div class="popover-icon">${iconHtml}</div>
            <span class="popover-title">${devName}</span>
            ${totalBadge}
          </div>
          ${circuitBadgeHtml}
        </div>
        ${contentHtml}
      `;

      const posX = rect.left - contRect.left + rect.width / 2;
      const posY = rect.top - contRect.top;

      popover.style.left = posX + "px";
      if (posY < 160) {
        popover.style.top = (posY + rect.height + 8) + "px";
        popover.classList.add("pos-below");
      } else {
        popover.style.top = (posY - 8) + "px";
        popover.classList.remove("pos-below");
      }

      popover.classList.add("visible");
    };

    const hidePopover = () => {
      if (popover) {
        popover.classList.remove("visible");
      }
    };

    // Attach listeners for devices
    devices.forEach((dev, idx) => {
      const el = this.shadowRoot.getElementById(`fp-device-${idx}`);
      if (!el) return;

      const isPanel =
        dev.type === "panel" ||
        dev.type === "electrical-panel" ||
        dev.type === "electric-panel" ||
        dev.panel === true;

      if (isPanel) {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          if (this._panelPopoverOpen) {
            this._hidePanelPopover();
          } else {
            this._showPanelPopover(el, dev);
          }
        });
        return;
      }

      const isSwitch =
        dev.type === "light-switch" ||
        dev.type === "light_switch" ||
        dev.type === "lightswitch" ||
        dev.type === "intrerupator" ||
        dev.type === "comutator" ||
        (dev.type === "switch" && !dev.entity) ||
        dev.switches !== undefined ||
        dev.gangs !== undefined ||
        dev.clape !== undefined;

      const hasEntries =
        dev.type === "socket" ||
        isSwitch ||
        (Array.isArray(dev.entries) && dev.entries.length > 0) ||
        Boolean(dev.slots) ||
        (Array.isArray(dev.strips) && dev.strips.length > 0) ||
        (Array.isArray(dev.outlets) && dev.outlets.length > 0);

      const hasFlat =
        (Array.isArray(dev.connected) && dev.connected.length > 0) ||
        (Array.isArray(dev.plugged) && dev.plugged.length > 0) ||
        (Array.isArray(dev.items) && dev.items.length > 0) ||
        (typeof dev.connected === "string" && dev.connected.trim().length > 0);

      const hasDetails = hasEntries || hasFlat;

      if (hasDetails) {
        el.addEventListener("mouseenter", () => showPopover(el, dev));
        el.addEventListener("mouseleave", () => hidePopover());
      }

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (dev.entity && this._hass) {
          this._hass.callService("homeassistant", "toggle", {
            entity_id: dev.entity,
          });
        } else if (hasDetails) {
          if (popover && popover.classList.contains("visible")) {
            hidePopover();
          } else {
            showPopover(el, dev);
          }
        }
      });
    });

    // Apply circuit highlight after devices render
    this._applyCircuitHighlight();
  }

  _updateStates() {
    if (!this.shadowRoot || !this._hass) return;

    // 1. Update YAML devices
    const devices = this._config?.devices || [];
    devices.forEach((dev, idx) => {
      const el = this.shadowRoot.getElementById(`fp-device-${idx}`);
      if (!el || !dev.entity) return;
      const stateObj = this._hass.states[dev.entity];
      if (stateObj) {
        const isOn = stateObj.state === "on" || stateObj.state === "open";
        el.classList.toggle("is-on", isOn);
      }
    });

    // 2. Legacy room badges (if any exist)
    if (this._config?.entities) {
      for (const [roomNum, entityId] of Object.entries(this._config.entities)) {
        const badge = this.shadowRoot.getElementById(`badge-${roomNum}`);
        const group = this.shadowRoot.getElementById(`group-${roomNum}`);
        const entity = this._hass.states[entityId];

        if (badge && entity) {
          const isOn = entity.state === "on";
          badge.classList.toggle("is-on", isOn);
          if (group) group.classList.toggle("is-on", isOn);
        }
      }
    }
  }

  getCardSize() {
    return 6;
  }
}

if (!customElements.get("apartment-floorplan-card")) {
  customElements.define("apartment-floorplan-card", ApartmentFloorplanCard);
}
if (!customElements.get("apartment-floor-card")) {
  customElements.define("apartment-floor-card", ApartmentFloorplanCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "apartment-floorplan-card")) {
  window.customCards.push({
    type: "apartment-floorplan-card",
    name: "Apartment Floorplan Card",
    description: "Interactive apartment floorplan card with electrical panel & circuits",
  });
}
if (!window.customCards.some((c) => c.type === "apartment-floor-card")) {
  window.customCards.push({
    type: "apartment-floor-card",
    name: "Apartment Floor Card",
    description: "Interactive apartment floor card with electrical panel & circuits",
  });
}
