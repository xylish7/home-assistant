import { floorplanSvg } from './floorplan-svg.js?v=3';

class ApartmentFloorplanCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._showDimensions = true;
    this._showDoors = true;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = config || {};
    if (this._rendered) {
      this._renderDevices();
      this._updateStates();
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

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('/local/custom/floorplan/floorplan-card.css?v=2');
      </style>

      <div class="toolbar-wrap">
        <div class="toolbar-title">
          Plan Apartament
          <span>Interactiv</span>
        </div>
        <div class="btn-group">
          <button id="toggle-dims" class="chip-btn active btn-dims">📏 Cote</button>
          <button id="toggle-doors" class="chip-btn active btn-doors">🚪 Uși</button>
        </div>
      </div>

      <div class="svg-container">
        ${floorplanSvg}
        <div id="coord-toast" class="coord-toast"></div>
      </div>
    `;

    // Hook button toggles
    const dimsBtn = this.shadowRoot.getElementById('toggle-dims');
    const doorsBtn = this.shadowRoot.getElementById('toggle-doors');
    const dimsLayer = this.shadowRoot.getElementById('dimensions');
    const doorsLayer = this.shadowRoot.getElementById('doors');

    if (dimsBtn && dimsLayer) {
      dimsBtn.addEventListener('click', () => {
        this._showDimensions = !this._showDimensions;
        dimsBtn.classList.toggle('active', this._showDimensions);
        dimsLayer.style.display = this._showDimensions ? '' : 'none';
      });
    }

    if (doorsBtn && doorsLayer) {
      doorsBtn.addEventListener('click', () => {
        this._showDoors = !this._showDoors;
        doorsBtn.classList.toggle('active', this._showDoors);
        doorsLayer.style.display = this._showDoors ? '' : 'none';
      });
    }

    // Coordinate helper: click on SVG canvas to inspect (x, y)
    const svgEl = this.shadowRoot.querySelector('svg');
    const coordToast = this.shadowRoot.getElementById('coord-toast');
    if (svgEl) {
      svgEl.addEventListener('click', (e) => {
        if (e.target.closest('.fp-device') || e.target.closest('.room-group') || e.target.closest('.chip-btn')) return;

        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svgEl.getScreenCTM().inverse());
        const x = Math.round(svgP.x);
        const y = Math.round(svgP.y);

        console.log(`[Floorplan Coordinate] x: ${x}, y: ${y}`);
        if (coordToast) {
          coordToast.textContent = `📍 x: ${x}, y: ${y}`;
          coordToast.classList.add('visible');
          clearTimeout(this._toastTimeout);
          this._toastTimeout = setTimeout(() => {
            coordToast.classList.remove('visible');
          }, 2500);
        }
      });
    }

    // Render YAML-configured devices
    this._renderDevices();

    // Legacy room click handlers (if room-group elements exist)
    const roomGroups = this.shadowRoot.querySelectorAll('.room-group');
    roomGroups.forEach((group) => {
      group.addEventListener('click', () => {
        const roomNum = group.getAttribute('data-room');
        const entityId = this._config?.entities?.[roomNum];
        if (entityId && this._hass) {
          this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
        }
      });
    });

    this._updateStates();
  }

  _renderDevices() {
    const layer = this.shadowRoot.getElementById('room-labels');
    if (!layer) return;

    const devices = this._config?.devices || [];
    if (!devices.length) {
      layer.innerHTML = '';
      return;
    }

    layer.innerHTML = devices.map((dev, idx) => {
      const x = Number(dev.x ?? dev.left) || 0;
      const y = Number(dev.y ?? dev['true'] ?? dev.top) || 0;
      const r = Number(dev.size) || 18;
      let icon = dev.icon;
      if (!icon || icon === '??' || icon === '?') {
        icon = dev.entity?.startsWith('switch.') ? 'mdi:power' : 'mdi:lightbulb';
      }
      const isMdi = icon.includes(':');
      const name = dev.name ? `<title>${dev.name}</title>` : (dev.entity ? `<title>${dev.entity}</title>` : '');

      let iconMarkup = '';
      if (isMdi) {
        iconMarkup = `
          <foreignObject x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" style="pointer-events: none;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
              <ha-icon icon="${icon}" style="--mdc-icon-size: ${Math.round(r * 1.2)}px; pointer-events: none;"></ha-icon>
            </div>
          </foreignObject>
        `;
      } else {
        iconMarkup = `<text class="device-icon" text-anchor="middle" dominant-baseline="central" font-size="${Math.round(r * 1.1)}" pointer-events="none">${icon}</text>`;
      }

      return `
        <g class="fp-device" id="fp-device-${idx}" data-entity="${dev.entity || ''}" transform="translate(${x}, ${y})">
          ${name}
          <circle class="device-badge" r="${r}" />
          ${iconMarkup}
        </g>
      `;
    }).join('');

    // Attach click listeners for toggle
    devices.forEach((dev, idx) => {
      const el = this.shadowRoot.getElementById(`fp-device-${idx}`);
      if (el && dev.entity) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this._hass) {
            this._hass.callService('homeassistant', 'toggle', { entity_id: dev.entity });
          }
        });
      }
    });
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
        const isOn = stateObj.state === 'on' || stateObj.state === 'open';
        el.classList.toggle('is-on', isOn);
      }
    });

    // 2. Legacy room badges (if any exist)
    if (this._config?.entities) {
      for (const [roomNum, entityId] of Object.entries(this._config.entities)) {
        const badge = this.shadowRoot.getElementById(`badge-${roomNum}`);
        const group = this.shadowRoot.getElementById(`group-${roomNum}`);
        const entity = this._hass.states[entityId];

        if (badge && entity) {
          const isOn = entity.state === 'on';
          badge.classList.toggle('is-on', isOn);
          if (group) group.classList.toggle('is-on', isOn);
        }
      }
    }
  }

  getCardSize() {
    return 6;
  }
}

customElements.define('apartment-floorplan-card', ApartmentFloorplanCard);
