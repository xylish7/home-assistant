import { floorplanSvg } from './floorplan-svg.js?v=8';

class ApartmentFloorplanCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._showDimensions = false;
    this._showDoors = false;
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
        @import url('/local/custom/floorplan/floorplan-card.css?v=8');
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
      </div>
    `;

    // Hook button toggles
    const dimsBtn = this.shadowRoot.getElementById('toggle-dims');
    const doorsBtn = this.shadowRoot.getElementById('toggle-doors');
    const dimsLayer = this.shadowRoot.getElementById('dimensions');
    const doorsLayer = this.shadowRoot.getElementById('doors');

    if (dimsBtn && dimsLayer) {
      dimsLayer.style.display = this._showDimensions ? '' : 'none';
      dimsBtn.classList.toggle('active', this._showDimensions);
      dimsBtn.addEventListener('click', () => {
        this._showDimensions = !this._showDimensions;
        dimsBtn.classList.toggle('active', this._showDimensions);
        dimsLayer.style.display = this._showDimensions ? '' : 'none';
      });
    }

    if (doorsBtn && doorsLayer) {
      doorsLayer.style.display = this._showDoors ? '' : 'none';
      doorsBtn.classList.toggle('active', this._showDoors);
      doorsBtn.addEventListener('click', () => {
        this._showDoors = !this._showDoors;
        doorsBtn.classList.toggle('active', this._showDoors);
        doorsLayer.style.display = this._showDoors ? '' : 'none';
      });
    }

    // Coordinate helper: click on SVG canvas to inspect (x, y)
    const svgEl = this.shadowRoot.querySelector('svg');
    const coordToast = this.shadowRoot.getElementById('coord-toast');
    const popover = this.shadowRoot.getElementById('fp-popover');

    if (svgEl) {
      svgEl.addEventListener('click', (e) => {
        if (popover) popover.classList.remove('visible');

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
        if (dev.type === 'socket' || Array.isArray(dev.entries) || dev.slots) {
          icon = 'mdi:power-socket-eu';
        } else if (dev.entity) {
          icon = dev.entity.startsWith('switch.') ? 'mdi:power' : 'mdi:lightbulb';
        } else {
          icon = 'mdi:power-socket-eu';
        }
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

    const popover = this.shadowRoot.getElementById('fp-popover');
    const container = this.shadowRoot.querySelector('.svg-container');

    const showPopover = (el, dev) => {
      if (!popover || !container) return;
      const rect = el.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();

      const devName = dev.name || (dev.type === 'socket' ? 'Priză de Perete' : 'Dispozitiv');
      let icon = dev.icon || (dev.type === 'socket' ? 'mdi:power-socket-eu' : (dev.entity ? 'mdi:lightbulb' : 'mdi:power-socket-eu'));
      const isMdi = icon.includes(':');
      const iconHtml = isMdi
        ? `<ha-icon icon="${icon}"></ha-icon>`
        : `<span>${icon}</span>`;

      // Normalize entries / slots / strips
      let totalSlots = Number(dev.slots ?? dev.entries_count) || 0;
      let rawEntries = Array.isArray(dev.entries) ? [...dev.entries] : [];

      // Convert legacy strips: or outlets: into entries format
      if (rawEntries.length === 0 && (Array.isArray(dev.strips) || Array.isArray(dev.outlets))) {
        const sList = dev.strips || dev.outlets;
        rawEntries = sList.map(s => ({ strip: s }));
      }

      // If totalSlots specified and greater than rawEntries.length, fill empty entries
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
        const entryName = (e && typeof e === 'object' && e.name) ? e.name : `Priza ${entryNum}`;

        // Empty entry
        if (!e || e === true || e.empty || (typeof e === 'object' && Object.keys(e).length === 0)) {
          return {
            type: 'empty',
            name: entryName,
            entryNum
          };
        }

        // Strip entry
        if (e.strip || (typeof e === 'object' && e.items && !e.item)) {
          const s = e.strip || e;
          const sItems = Array.isArray(s) ? s : (Array.isArray(s.items) ? s.items : (Array.isArray(s.connected) ? s.connected : []));
          const sSlots = (!Array.isArray(s) && Number(s.slots)) ? Number(s.slots) : 0;
          const sIcon = (!Array.isArray(s) && s.icon) ? s.icon : (e.icon ? e.icon : null);
          const sFallbackName = (!Array.isArray(s) && s.name) ? s.name : null;
          const finalName = e.name ? e.name : (sFallbackName ? sFallbackName : entryName);

          usedCount++;
          return {
            type: 'strip',
            name: finalName,
            icon: sIcon,
            items: sItems,
            slots: sSlots,
            entryNum
          };
        }

        // Direct item entry
        const itemVal = typeof e === 'string' ? e : (e.item || (Array.isArray(e.items) ? e.items : null));
        const items = Array.isArray(itemVal) ? itemVal : (itemVal ? [itemVal] : []);
        const iIcon = (typeof e === 'object' && e.icon) ? e.icon : 'mdi:power-plug';
        usedCount++;
        return {
          type: 'item',
          name: entryName,
          itemName: (typeof e === 'object' && e.label) ? e.label : null,
          icon: iIcon,
          items,
          entryNum
        };
      });

      // Flat connected list fallback
      const flatList = Array.isArray(dev.connected) ? dev.connected
        : (Array.isArray(dev.plugged) ? dev.plugged
        : (Array.isArray(dev.items) ? dev.items
        : (typeof dev.connected === 'string' ? dev.connected.split(/\n|,/).map(s => s.trim()).filter(Boolean) : [])));

      let contentHtml = '';

      if (normalizedEntries.length > 0) {
        contentHtml = `
          <div class="socket-entries">
            ${normalizedEntries.map(entry => {
              if (entry.type === 'strip') {
                const sIconHtml = entry.icon ? (entry.icon.includes(':') ? `<ha-icon icon="${entry.icon}"></ha-icon>` : `<span>${entry.icon}</span>`) : '';
                const stripBadge = entry.slots ? `<span class="entry-slots-badge">${entry.items.length}/${entry.slots}</span>` : '';

                return `
                  <div class="entry-card is-strip">
                    <div class="entry-header">
                      ${sIconHtml}
                      <span class="entry-title">${entry.name}</span>
                      <div class="entry-badges">
                        ${(!entry.name.toLowerCase().includes("prelungitor") && !entry.name.toLowerCase().includes("strip")) ? '<span class="entry-type-tag">Prelungitor</span>' : ''}
                        ${stripBadge}
                      </div>
                    </div>
                    <ul class="entry-items-list">
                      ${entry.items.length > 0 ? entry.items.map(it => `
                        <li>
                          <span class="popover-dot"></span>
                          <span>${it}</span>
                        </li>
                      `).join('') : '<li class="entry-empty-body">Prelungitor liber (fără consumatori)</li>'}
                    </ul>
                  </div>
                `;
              } else if (entry.type === 'item') {
                return `
                  <div class="entry-card is-direct">
                    <div class="entry-header">
                      <span class="entry-title">${entry.name}</span>
                      <div class="entry-badges">
                        ${entry.itemName ? `<span class="entry-type-tag">${entry.itemName}</span>` : '<span class="entry-type-tag">Direct</span>'}
                      </div>
                    </div>
                    <ul class="entry-items-list">
                      ${entry.items.map(it => `
                        <li>
                          <span class="popover-dot dot-direct"></span>
                          <span>${it}</span>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                `;
              } else {
                // Empty entry card
                return `
                  <div class="entry-card is-empty">
                    <div class="entry-header">
                      <ha-icon icon="mdi:power-socket-eu"></ha-icon>
                      <span class="entry-title">${entry.name}</span>
                      <div class="entry-badges">
                        <span class="entry-empty-tag">Liberă</span>
                      </div>
                    </div>
                    <div class="entry-empty-body">Priză disponibilă / neutilizată</div>
                  </div>
                `;
              }
            }).join('')}
          </div>
        `;
      } else if (flatList.length > 0) {
        contentHtml = `
          <ul class="popover-list">
            ${flatList.map(item => `
              <li>
                <span class="popover-dot"></span>
                <span>${item}</span>
              </li>
            `).join('')}
          </ul>
        `;
      }

      const totalBadge = totalSlots > 0 ? `<span class="socket-total-badge">${usedCount}/${totalSlots}</span>` : '';

      popover.innerHTML = `
        <div class="popover-header">
          ${iconHtml}
          <span class="popover-title">${devName}</span>
          ${totalBadge}
        </div>
        ${contentHtml}
      `;

      const posX = (rect.left - contRect.left) + rect.width / 2;
      const posY = (rect.top - contRect.top);

      popover.style.left = `${posX}px`;
      if (posY < 160) {
        popover.style.top = `${posY + rect.height + 8}px`;
        popover.classList.add('pos-below');
      } else {
        popover.style.top = `${posY - 8}px`;
        popover.classList.remove('pos-below');
      }

      popover.classList.add('visible');
    };

    const hidePopover = () => {
      if (popover) {
        popover.classList.remove('visible');
      }
    };

    // Attach listeners for toggle or popover
    devices.forEach((dev, idx) => {
      const el = this.shadowRoot.getElementById(`fp-device-${idx}`);
      if (!el) return;

      const hasEntries = dev.type === 'socket' ||
        (Array.isArray(dev.entries) && dev.entries.length > 0) ||
        Boolean(dev.slots) ||
        (Array.isArray(dev.strips) && dev.strips.length > 0) ||
        (Array.isArray(dev.outlets) && dev.outlets.length > 0);

      const hasFlat = (Array.isArray(dev.connected) && dev.connected.length > 0) ||
        (Array.isArray(dev.plugged) && dev.plugged.length > 0) ||
        (Array.isArray(dev.items) && dev.items.length > 0) ||
        (typeof dev.connected === 'string' && dev.connected.trim().length > 0);

      const hasDetails = hasEntries || hasFlat;

      if (hasDetails) {
        el.addEventListener('mouseenter', () => showPopover(el, dev));
        el.addEventListener('mouseleave', () => hidePopover());
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dev.entity && this._hass) {
          this._hass.callService('homeassistant', 'toggle', { entity_id: dev.entity });
        } else if (hasDetails) {
          if (popover && popover.classList.contains('visible')) {
            hidePopover();
          } else {
            showPopover(el, dev);
          }
        }
      });
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
