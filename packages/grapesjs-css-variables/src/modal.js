import { html, render } from 'lit-html'
import { map } from 'lit-html/directives/map.js'
import {
  getDevices,
  getAllVariablesOrdered,
  setVariableForDevice,
  removeVariable,
  removeVariableForDevice,
  renameVariable,
  setVariableOrder,
  setVariable,
} from './variables.js'
import { refreshStyleManager } from './style-manager.js'

const styles = document.createElement('style')
styles.textContent = `
  .css-vars-modal { padding: 0; }

  /* Toolbar */
  .css-vars-toolbar {
    display: flex;
    align-items: center;
    padding: 8px 0 12px 0;
    position: relative;
  }
  .css-vars-add-btn {
    background: transparent;
    border: 1px solid var(--gjs-light-border);
    color: var(--gjs-font-color);
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  }
  .css-vars-add-btn:hover {
    background: var(--gjs-soft-light-color);
  }

  /* Type picker dropdown */
  .css-vars-type-picker {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    background: #3b3b3b;
    border: 1px solid #666;
    border-radius: 4px;
    overflow: hidden;
    min-width: 160px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }
  .css-vars-type-picker--open {
    display: block;
  }
  .css-vars-type-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    color: #ddd;
    font-size: 12px;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
  }
  .css-vars-type-option:hover {
    background: #555;
  }
  .css-vars-type-icon {
    width: 18px;
    text-align: center;
    font-style: normal;
    font-weight: bold;
    font-size: 13px;
  }

  /* Table */
  .css-vars-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .css-vars-table th {
    text-align: left;
    padding: 8px 4px 10px 4px;
    color: var(--gjs-font-color-active);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--gjs-light-border);
    white-space: nowrap;
  }
  .css-vars-table td {
    padding: 6px 4px;
    border-bottom: 1px solid var(--gjs-light-border);
    vertical-align: middle;
  }
  .css-vars-table tbody tr:hover {
    background: var(--gjs-soft-light-color, rgba(255,255,255,0.04));
  }

  /* Handle + icon column */
  .css-vars-col-handle { width: 40px; }
  .css-vars-handle-cell {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .css-vars-grip {
    cursor: grab;
    color: var(--gjs-secondary-light-color);
    font-size: 14px;
    opacity: 0.4;
    transition: opacity 0.15s, color 0.15s;
    user-select: none;
    line-height: 1;
    padding: 2px;
  }
  .css-vars-grip:hover {
    opacity: 1;
    color: var(--gjs-font-color-active);
  }
  .css-vars-grip:active {
    cursor: grabbing;
    opacity: 1;
  }
  .css-vars-var-type-icon {
    font-style: normal;
    font-weight: bold;
    font-size: 12px;
    width: 16px;
    text-align: center;
  }

  /* Name column */
  .css-vars-col-name { width: 110px; }
  .css-vars-name-input {
    background: var(--gjs-main-light-color);
    color: var(--gjs-font-color);
    border: 1px solid var(--gjs-light-border);
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Value cells */
  .css-vars-value-cell {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .css-vars-color-input {
    width: 28px;
    height: 24px;
    padding: 1px;
    border: 1px solid var(--gjs-light-border);
    border-radius: 4px;
    background: var(--gjs-main-light-color);
    cursor: pointer;
    flex-shrink: 0;
  }
  .css-vars-color-text {
    background: var(--gjs-main-light-color);
    color: var(--gjs-font-color);
    border: 1px solid var(--gjs-light-border);
    border-radius: 4px;
    padding: 4px 4px;
    font-size: 11px;
    width: 100%;
    min-width: 50px;
    box-sizing: border-box;
  }
  .css-vars-size-number {
    background: var(--gjs-main-light-color);
    color: var(--gjs-font-color);
    border: 1px solid var(--gjs-light-border);
    border-radius: 4px;
    padding: 4px 4px;
    font-size: 11px;
    flex: 1;
    min-width: 30px;
    box-sizing: border-box;
  }
  .css-vars-size-unit,
  .css-vars-font-select {
    background: var(--gjs-main-light-color);
    color: var(--gjs-font-color);
    border: 1px solid var(--gjs-light-border);
    border-radius: 3px;
    padding: 3px 2px;
    font-size: 11px;
    cursor: pointer;
  }
  .css-vars-font-select {
    width: 100%;
    min-width: 80px;
  }

  /* Focus rings (WCAG 2.4.7) */
  .css-vars-name-input:focus,
  .css-vars-color-text:focus,
  .css-vars-size-number:focus,
  .css-vars-size-unit:focus,
  .css-vars-font-select:focus,
  .css-vars-color-input:focus {
    outline: none;
    border-color: var(--gjs-main-color, #804f7b);
    box-shadow: 0 0 0 1px var(--gjs-main-color, #804f7b);
  }

  /* Actions column (duplicate + delete) */
  .css-vars-col-actions { width: 50px; }
  .css-vars-actions-cell {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .css-vars-delete-btn,
  .css-vars-duplicate-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 12px;
    padding: 4px;
    border-radius: 4px;
    opacity: 0.5;
    transition: opacity 0.15s;
  }
  .css-vars-delete-btn { color: var(--gjs-color-red, #c0392b); }
  .css-vars-duplicate-btn { color: var(--gjs-font-color); }
  .css-vars-delete-btn:hover,
  .css-vars-duplicate-btn:hover {
    opacity: 1;
  }
  .css-vars-delete-btn:hover {
    background: rgba(192, 57, 43, 0.15);
  }
  .css-vars-duplicate-btn:hover {
    background: var(--gjs-soft-light-color);
  }

  /* Drag state */
  .css-vars-row--dragging {
    opacity: 0.4;
  }

  /* Empty state */
  .css-vars-empty {
    padding: 16px;
    font-style: italic;
    color: var(--gjs-secondary-light-color);
    font-size: 12px;
    text-align: center;
  }

  /* Placeholder text for inherited values */
  .css-vars-color-text::placeholder,
  .css-vars-size-number::placeholder {
    color: var(--gjs-secondary-light-color);
    opacity: 0.6;
  }
`
document.head.appendChild(styles)

const SIZE_UNITS = ['px', '%', 'em', 'rem', 'vh', 'vw', 'dvw', 'dvh', 'vmin', 'vmax', 'ch', 'ex']

/**
 * Sanitize a variable name: lowercase, replace spaces/special chars with hyphens
 */
function sanitizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Parse a CSS size value into number and unit
 */
function parseSizeValue(val) {
  if (!val) return { number: '', unit: 'px' }
  const match = val.match(/^(-?[\d.]+)\s*(.*)$/)
  if (!match) return { number: val, unit: '' }
  return { number: match[1], unit: match[2] || 'px' }
}

/**
 * Convert any CSS color value to hex for the color picker input.
 * Supports hex, rgb(), rgba(), and named CSS colors (e.g. "red", "blue").
 */
const _colorCanvas = document.createElement('canvas')
_colorCanvas.width = _colorCanvas.height = 1
const _colorCtx = _colorCanvas.getContext('2d')

function toHexColor(value) {
  if (!value) return '#000000'
  if (value.startsWith('#')) {
    if (value.length === 4) {
      return '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3]
    }
    return value.slice(0, 7)
  }
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0')
    const g = parseInt(match[2]).toString(16).padStart(2, '0')
    const b = parseInt(match[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  // Named color fallback: draw on canvas and read back
  _colorCtx.fillStyle = '#000000'
  _colorCtx.fillStyle = value
  _colorCtx.fillRect(0, 0, 1, 1)
  const [r, g, b] = _colorCtx.getImageData(0, 0, 1, 1).data
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Get font options from the editor
 */
function getFontOptions(editor) {
  const smFonts = editor.StyleManager.getBuiltIn
    ? editor.StyleManager.getBuiltIn('font-family')
    : null
  const defaults = smFonts?.options || []
  const installed = editor.getModel().get('fonts') || []
  // Merge: defaults first, then installed fonts
  const all = [...defaults]
  for (const font of installed) {
    const name = typeof font === 'string' ? font : (font.name || font.value || '')
    if (name && !all.some(d => (d.value || d) === name)) {
      all.push(typeof font === 'string' ? { value: font, name: font } : font)
    }
  }
  return all
}

/**
 * Type icons for display
 */
const TYPE_ICONS = {
  color: '\u25C7',  // ◇
  size: '\u2197',   // ↗
  typo: 'A',
}

// Drag state (module-level, following page-panel.ts pattern)
let draggedVar = null
let draggedEl = null

/**
 * Render the modal content
 */
export function renderModal(el, editor, options) {
  const t = (key) => editor.I18n.t(`grapesjs-css-variables.${key}`)
  const devices = getDevices(editor)
  const allVars = getAllVariablesOrdered(editor, options.prefix)

  // --- Event handlers ---

  const rerender = () => {
    refreshStyleManager(editor, options)
    renderModal(el, editor, options)
  }

  const onValueChange = (varItem, widthMedia, newValue) => {
    setVariableForDevice(editor, { name: varItem.name, value: newValue, type: varItem.type }, options.prefix, widthMedia)
    rerender()
  }

  const onSizeChange = (varItem, widthMedia, number, unit) => {
    if (number === '' || number === undefined) {
      // Clear the value for this breakpoint if number is empty
      removeVariableForDevice(editor, { name: varItem.name, type: varItem.type }, options.prefix, widthMedia)
      rerender()
      return
    }
    const value = `${number}${unit}`
    setVariableForDevice(editor, { name: varItem.name, value, type: varItem.type }, options.prefix, widthMedia)
    rerender()
  }

  const onNameChange = (varItem, newName) => {
    const sanitized = sanitizeName(newName)
    if (!sanitized || sanitized === varItem.name) return
    renameVariable(editor, { oldName: varItem.name, newName: sanitized, type: varItem.type }, options.prefix)
    rerender()
  }

  const onDelete = (varItem) => {
    if (!confirm(t('Delete variable') + ` "${varItem.name}"?`)) return
    removeVariable(editor, { name: varItem.name, type: varItem.type }, options.prefix)
    // Remove from order
    const order = editor.getModel().get('cssVarOrder') || []
    const newOrder = order.filter(o => !(o.type === varItem.type && o.name === varItem.name))
    setVariableOrder(editor, newOrder)
    rerender()
  }

  const onDuplicate = (varItem) => {
    const existingNames = allVars.filter(v => v.type === varItem.type).map(v => v.name)
    let copyName = `${varItem.name}-copy`
    let idx = 2
    while (existingNames.includes(copyName)) {
      copyName = `${varItem.name}-copy-${idx++}`
    }
    // Copy all breakpoint values
    for (const [wm, value] of Object.entries(varItem.values)) {
      setVariableForDevice(editor, { name: copyName, value, type: varItem.type }, options.prefix, wm)
    }
    // Add to order right after original
    const order = editor.getModel().get('cssVarOrder') || []
    const idx2 = order.findIndex(o => o.type === varItem.type && o.name === varItem.name)
    order.splice(idx2 + 1, 0, { type: varItem.type, name: copyName })
    setVariableOrder(editor, order)
    rerender()
  }

  const onAdd = (type) => {
    // Use the first available font from the editor as default for typography
    const fontOpts = getFontOptions(editor)
    const defaultFont = fontOpts.length > 0 ? (fontOpts[0].value || fontOpts[0].id || fontOpts[0]) : 'Arial, Helvetica, sans-serif'
    const defaults = { color: '#3498db', size: '16px', typo: defaultFont }
    const existingNames = allVars.filter(v => v.type === type).map(v => v.name)
    let idx = 1
    let name = `${type}-${idx}`
    while (existingNames.includes(name)) {
      idx++
      name = `${type}-${idx}`
    }
    setVariable(editor, { name, value: defaults[type], type }, options.prefix)
    // Add to order
    const order = editor.getModel().get('cssVarOrder') || []
    order.push({ type, name })
    setVariableOrder(editor, order)
    rerender()
    // Auto-focus the new variable's name input
    requestAnimationFrame(() => {
      const inputs = el.querySelectorAll('.css-vars-name-input')
      const lastInput = inputs[inputs.length - 1]
      if (lastInput) { lastInput.focus(); lastInput.select() }
    })
  }

  // --- Type picker toggle ---
  let pickerOpen = false
  const togglePicker = () => {
    pickerOpen = !pickerOpen
    const picker = el.querySelector('.css-vars-type-picker')
    if (picker) picker.classList.toggle('css-vars-type-picker--open', pickerOpen)
  }
  const closePicker = () => {
    pickerOpen = false
    const picker = el.querySelector('.css-vars-type-picker')
    if (picker) picker.classList.remove('css-vars-type-picker--open')
  }
  // Close picker on Escape or click-outside
  const onKeyDown = (e) => { if (e.key === 'Escape' && pickerOpen) closePicker() }
  const onClickOutside = (e) => { if (pickerOpen && !e.target.closest('.css-vars-toolbar')) closePicker() }
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('click', onClickOutside)

  // --- Drag handlers (following page-panel.ts) ---
  const handleDragStart = (e, varItem) => {
    e.stopPropagation()
    draggedVar = varItem
    draggedEl = e.target.closest('tr')
    if (e.dataTransfer && draggedEl) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', `${varItem.type}-${varItem.name}`)
      draggedEl.classList.add('css-vars-row--dragging')
    }
  }

  const handleDragEnd = () => {
    if (draggedEl) {
      draggedEl.classList.remove('css-vars-row--dragging')
    }
    draggedVar = null
    draggedEl = null
  }

  const handleDragOver = (e) => {
    if (!draggedVar) return
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetVar) => {
    e.stopPropagation()
    e.preventDefault()

    if (draggedVar && !(draggedVar.type === targetVar.type && draggedVar.name === targetVar.name)) {
      // Build order from current allVars
      const currentOrder = allVars.map(v => ({ type: v.type, name: v.name }))
      const fromIdx = currentOrder.findIndex(o => o.type === draggedVar.type && o.name === draggedVar.name)
      const toIdx = currentOrder.findIndex(o => o.type === targetVar.type && o.name === targetVar.name)

      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const [moved] = currentOrder.splice(fromIdx, 1)
        currentOrder.splice(toIdx, 0, moved)
        setVariableOrder(editor, currentOrder)
        rerender()
      }
    }
  }

  // --- Per-type value cell renderers ---

  const renderColorCell = (varItem, wm, value, hasValue) => {
    const baseValue = varItem.values[''] || ''
    const placeholder = (!hasValue && wm && baseValue) ? baseValue : 'inherit'
    return html`
      <div class="css-vars-value-cell">
        <input type="color"
          class="css-vars-color-input"
          .value=${hasValue ? toHexColor(value) : (baseValue ? toHexColor(baseValue) : '#888888')}
          style=${hasValue ? '' : 'opacity: 0.3'}
          @change=${(e) => onValueChange(varItem, wm, e.target.value)}
        />
        <input type="text"
          class="css-vars-color-text"
          .value=${hasValue ? value : ''}
          placeholder=${placeholder}
          @change=${(e) => onValueChange(varItem, wm, e.target.value)}
        />
      </div>
    `
  }

  const renderSizeCell = (varItem, wm, value, hasValue) => {
    const parsed = parseSizeValue(value)
    const baseValue = varItem.values[''] || ''
    const baseParsed = parseSizeValue(baseValue)
    const placeholder = (!hasValue && wm && baseValue) ? baseParsed.number : '0'
    return html`
      <div class="css-vars-value-cell">
        <input type="number"
          class="css-vars-size-number"
          .value=${hasValue ? parsed.number : ''}
          placeholder=${placeholder}
          step="any"
          @change=${(e) => {
    const unit = el.querySelector(`[data-unit-for="${varItem.type}-${varItem.name}-${wm}"]`)?.value || parsed.unit || 'px'
    onSizeChange(varItem, wm, e.target.value, unit)
  }}
        />
        <select
          class="css-vars-size-unit"
          data-unit-for="${varItem.type}-${varItem.name}-${wm}"
          @change=${(e) => {
    const numInput = e.target.parentNode.querySelector('.css-vars-size-number')
    const num = numInput?.value || parsed.number
    if (num) onSizeChange(varItem, wm, num, e.target.value)
  }}
        >
          ${SIZE_UNITS.map(u => html`<option value=${u} ?selected=${(hasValue ? parsed.unit : 'px') === u}>${u}</option>`)}
        </select>
      </div>
    `
  }

  const renderTypoCell = (varItem, wm, value, hasValue) => {
    const fontOpts = getFontOptions(editor)
    return html`
      <div class="css-vars-value-cell">
        <select
          class="css-vars-font-select"
          @change=${(e) => onValueChange(varItem, wm, e.target.value)}
        >
          <option value="" ?selected=${!hasValue}>—</option>
          ${fontOpts.map(f => {
    const val = f.value || f.id || f
    const label = f.name || f.label || val
    return html`<option value=${val} ?selected=${value === val}>${label}</option>`
  })}
        </select>
      </div>
    `
  }

  const VALUE_RENDERERS = { color: renderColorCell, size: renderSizeCell, typo: renderTypoCell }

  const renderValueCell = (varItem, device) => {
    const wm = device.widthMedia
    const value = varItem.values[wm] || ''
    const hasValue = value !== '' && value !== undefined
    const renderer = VALUE_RENDERERS[varItem.type]
    return renderer ? renderer(varItem, wm, value, hasValue) : html`<span>—</span>`
  }

  // --- Determine which variable types are enabled ---
  const enabledTypes = []
  if (options.enableColors) enabledTypes.push({ type: 'color', label: t('Color'), icon: TYPE_ICONS.color })
  if (options.enableSizes) enabledTypes.push({ type: 'size', label: t('Size'), icon: TYPE_ICONS.size })
  if (options.enableTypography) enabledTypes.push({ type: 'typo', label: t('Font Family'), icon: TYPE_ICONS.typo })

  // Filter variables to only enabled types
  const enabledTypeIds = enabledTypes.map(et => et.type)
  const filteredVars = allVars.filter(v => enabledTypeIds.includes(v.type))

  // Collapse device columns for single-device projects (#7)
  const isSingleDevice = devices.length <= 1

  // --- Render ---
  render(html`
    <div class="css-vars-modal">
      <!-- Toolbar -->
      <div class="css-vars-toolbar">
        <button class="css-vars-add-btn" @click=${togglePicker}>
          + ${t('New variable')}
        </button>
        <div class="css-vars-type-picker">
          ${enabledTypes.map(et => html`
            <button class="css-vars-type-option" @click=${() => { closePicker(); onAdd(et.type) }}>
              <span class="css-vars-type-icon">${et.icon}</span>
              ${et.label}
            </button>
          `)}
        </div>
      </div>

      ${filteredVars.length === 0
    ? html`<div class="css-vars-empty">${t('No variables defined')}</div>`
    : html`
        <!-- Table -->
        <table class="css-vars-table">
          <thead>
            <tr>
              <th class="css-vars-col-handle"></th>
              <th class="css-vars-col-name">${t('Name')}</th>
              ${isSingleDevice
    ? html`<th>${t('Value')}</th>`
    : devices.map(d => html`<th>${d.name}</th>`)
  }
              <th class="css-vars-col-actions"></th>
            </tr>
          </thead>
          <tbody>
            ${map(filteredVars, (varItem) => html`
              <tr
                @dragover=${handleDragOver}
                @drop=${(e) => handleDrop(e, varItem)}
              >
                <td>
                  <div class="css-vars-handle-cell">
                    <span class="css-vars-grip"
                      draggable="true"
                      @dragstart=${(e) => handleDragStart(e, varItem)}
                      @dragend=${handleDragEnd}
                    >\u2847</span>
                    <span class="css-vars-var-type-icon">${TYPE_ICONS[varItem.type] || '?'}</span>
                  </div>
                </td>
                <td>
                  <input type="text"
                    class="css-vars-name-input"
                    .value=${varItem.name}
                    @change=${(e) => onNameChange(varItem, e.target.value)}
                  />
                </td>
                ${devices.map(d => html`<td>${renderValueCell(varItem, d)}</td>`)}
                <td>
                  <div class="css-vars-actions-cell">
                    <button class="css-vars-duplicate-btn" title="${t('Duplicate')}"
                      @click=${() => onDuplicate(varItem)}
                    >\u29C9</button>
                    <button class="css-vars-delete-btn" title="${t('Delete')}"
                      @click=${() => onDelete(varItem)}
                    >\u2715</button>
                  </div>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      `}
    </div>
  `, el)
}
