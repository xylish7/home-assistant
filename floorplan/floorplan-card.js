import { floorplanSvg } from './floorplan-svg.js';

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
        @import url('/local/custom/floorplan/floorplan-card.css?v=1');
      </style>

      <div class="toolbar-wrap">
        <div class="toolbar-title">
          Plan Apartament
          <span>Interactiv</span>
        </div>
        <div class="btn-group">
          <button id="toggle-dims" class="chip-btn active btn-dims">📐 Cote</button>
          <button id="toggle-doors" class="chip-btn active btn-doors">🚪 Uși</button>
        </div>
      </div>

      <div class="svg-container">
        ${floorplanSvg}
      </div>
    `;

    // Hook button toggles
    const dimsBtn = this.shadowRoot.getElementById('toggle-dims');
    const doorsBtn = this.shadowRoot.getElementById('toggle-doors');
    const dimsLayer = this.shadowRoot.getElementById('dimensions');
    const doorsLayer = this.shadowRoot.getElementById('doors');

    dimsBtn.addEventListener('click', () => {
      this._showDimensions = !this._showDimensions;
      dimsBtn.classList.toggle('active', this._showDimensions);
      dimsLayer.style.display = this._showDimensions ? '' : 'none';
    });

    doorsBtn.addEventListener('click', () => {
      this._showDoors = !this._showDoors;
      doorsBtn.classList.toggle('active', this._showDoors);
      doorsLayer.style.display = this._showDoors ? '' : 'none';
    });

    // Room click handlers for HA toggle
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

  _updateStates() {
    if (!this.shadowRoot || !this._hass || !this._config?.entities) return;

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

  getCardSize() {
    return 6;
  }
}

customElements.define('apartment-floorplan-card', ApartmentFloorplanCard);
