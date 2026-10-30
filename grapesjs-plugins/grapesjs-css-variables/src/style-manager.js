import { getVariables, buildVarRef, getTargetStyleValue, setTargetStyleValue } from './variables.js'
import { TYPE_COLOR, TYPE_SIZE, TYPE_FONT_FAMILY } from './types.js'

/**
 * CSS properties targeted for each variable type.
 *
 * Each entry describes where the pencil control is injected:
 * - top-level property: `{ sector, property, type }`
 * - sub-property of a composite (or a future stack): `{ sector, property, subProperty, type }`
 *
 * The parent `property` is always part of the key. This is what disambiguates
 * sub-properties with the same name living in different parents, e.g.
 * `border-color` under `border` vs `border-top` vs `border-right` vs `border-left`.
 *
 * The default list covers the standard GrapesJS properties so the plugin stays
 * usable on its own. Host apps (e.g. Silex in `editor/grapesjs/css-props.ts`)
 * declare their own properties where they create them via
 * {@link addVariableProperty} / {@link removeVariableProperty}.
 *
 * @typedef {object} VariablePropertyTarget
 * @property {string} sector - Style Manager sector id (e.g. `'typography'`)
 * @property {string} property - Property id (composite id when `subProperty` is set)
 * @property {string} [subProperty] - Sub-property id inside the composite
 * @property {string} type - `'color'` | `'size'` | `'font-family'` (aliases `'font'`, `'typo'`, `'typography'` accepted on write)
 */
const DEFAULT_VARIABLE_PROPERTIES = [
  // Colors - top-level
  { sector: 'typography', property: 'color', type: TYPE_COLOR },
  { sector: 'decorations', property: 'background-color', type: TYPE_COLOR },
  // Colors - composite sub-properties (parent disambiguates)
  { sector: 'decorations', property: 'outline', subProperty: 'outline-color', type: TYPE_COLOR },
  { sector: 'typography', property: 'text-decoration', subProperty: 'text-decoration-color', type: TYPE_COLOR },
  { sector: 'extra', property: 'column-rule', subProperty: 'column-rule-color', type: TYPE_COLOR },

  // Sizes - top-level
  { sector: 'dimension', property: 'width', type: TYPE_SIZE },
  { sector: 'dimension', property: 'height', type: TYPE_SIZE },
  { sector: 'dimension', property: 'min-width', type: TYPE_SIZE },
  { sector: 'dimension', property: 'max-width', type: TYPE_SIZE },
  { sector: 'dimension', property: 'min-height', type: TYPE_SIZE },
  { sector: 'dimension', property: 'max-height', type: TYPE_SIZE },
  { sector: 'general', property: 'top', type: TYPE_SIZE },
  { sector: 'general', property: 'right', type: TYPE_SIZE },
  { sector: 'general', property: 'bottom', type: TYPE_SIZE },
  { sector: 'general', property: 'left', type: TYPE_SIZE },
  { sector: 'typography', property: 'font-size', type: TYPE_SIZE },
  { sector: 'typography', property: 'letter-spacing', type: TYPE_SIZE },
  { sector: 'typography', property: 'line-height', type: TYPE_SIZE },
  { sector: 'extra', property: 'column-gap', type: TYPE_SIZE },
  { sector: 'extra', property: 'row-gap', type: TYPE_SIZE },

  // Sizes - composite sub-properties
  { sector: 'dimension', property: 'margin', subProperty: 'margin-top', type: TYPE_SIZE },
  { sector: 'dimension', property: 'margin', subProperty: 'margin-right', type: TYPE_SIZE },
  { sector: 'dimension', property: 'margin', subProperty: 'margin-bottom', type: TYPE_SIZE },
  { sector: 'dimension', property: 'margin', subProperty: 'margin-left', type: TYPE_SIZE },
  { sector: 'dimension', property: 'padding', subProperty: 'padding-top', type: TYPE_SIZE },
  { sector: 'dimension', property: 'padding', subProperty: 'padding-right', type: TYPE_SIZE },
  { sector: 'dimension', property: 'padding', subProperty: 'padding-bottom', type: TYPE_SIZE },
  { sector: 'dimension', property: 'padding', subProperty: 'padding-left', type: TYPE_SIZE },
  { sector: 'decorations', property: 'border-radius', subProperty: 'border-top-left-radius', type: TYPE_SIZE },
  { sector: 'decorations', property: 'border-radius', subProperty: 'border-top-right-radius', type: TYPE_SIZE },
  { sector: 'decorations', property: 'border-radius', subProperty: 'border-bottom-right-radius', type: TYPE_SIZE },
  { sector: 'decorations', property: 'border-radius', subProperty: 'border-bottom-left-radius', type: TYPE_SIZE },

  // Typography - font-family only (font-weight is numeric, not suited for font-family variables)
  { sector: 'typography', property: 'font-family', type: TYPE_FONT_FAMILY },
]

// Aliases accepted on write, same as in capabilities.js
const VARIABLE_TYPE_ALIASES = {
  font: TYPE_FONT_FAMILY,
  typo: TYPE_FONT_FAMILY,
  typography: TYPE_FONT_FAMILY,
}

/** Normalize a variable type to its canonical name, or null when unknown. */
function normalizeVariableType(type) {
  if (type === TYPE_COLOR || type === TYPE_SIZE || type === TYPE_FONT_FAMILY) return type
  return VARIABLE_TYPE_ALIASES[type] || null
}

// Per-editor state so several editors (and tests) stay isolated
const registryByEditor = new WeakMap()
const optionsByEditor = new WeakMap()

function getRegistry(editor) {
  if (!registryByEditor.has(editor)) {
    registryByEditor.set(editor, DEFAULT_VARIABLE_PROPERTIES.map(entry => ({ ...entry })))
  }
  return registryByEditor.get(editor)
}

function getStoredOptions(editor) {
  return optionsByEditor.get(editor) || { enableColors: true, enableSizes: true, enableTypography: true }
}

function sameTarget(a, b) {
  return a.sector === b.sector
    && a.property === b.property
    && (a.subProperty || '') === (b.subProperty || '')
    && a.type === b.type
}

/**
 * List the variable-enabled properties for this editor (a copy).
 */
export function getVariableProperties(editor) {
  return getRegistry(editor).map(entry => ({ ...entry }))
}

/**
 * Enable variables (pencil control) on a Style Manager property.
 * Idempotent: adding the same target twice keeps a single entry.
 * Triggers a refresh so the control appears without waiting for the next selection change.
 */
export function addVariableProperty(editor, descriptor = {}) {
  const { sector, property, subProperty } = descriptor
  const type = normalizeVariableType(descriptor.type)
  if (!sector || typeof sector !== 'string') {
    throw new Error('addVariableProperty requires `sector` (string). Example: {sector: "typography", property: "text-underline-offset", type: "size"}')
  }
  if (!property || typeof property !== 'string') {
    throw new Error('addVariableProperty requires `property` (string). Example: {sector: "typography", property: "text-underline-offset", type: "size"}')
  }
  if (subProperty !== undefined && typeof subProperty !== 'string') {
    throw new Error('addVariableProperty `subProperty` must be a string when given. Example: {sector: "extra", property: "transform-origin", subProperty: "transform-origin-x", type: "size"}')
  }
  if (!type) {
    throw new Error(`addVariableProperty: invalid type "${descriptor.type}". Must be one of: color, size, font-family (aliases: font, typo, typography)`)
  }
  const registry = getRegistry(editor)
  const entry = subProperty ? { sector, property, subProperty, type } : { sector, property, type }
  if (!registry.some(existing => sameTarget(existing, entry))) {
    registry.push(entry)
  }
  refreshStyleManager(editor)
  return { ...entry }
}

/**
 * Disable variables on a Style Manager property.
 * `type` is optional: when omitted, all types registered on that target are removed.
 * `subProperty` is optional: when omitted, only the top-level entry is removed
 * (sub-properties of that parent are kept - pass each one explicitly to remove them).
 * Returns the number of removed entries and refreshes the Style Manager.
 */
export function removeVariableProperty(editor, descriptor = {}) {
  const { sector, property, subProperty } = descriptor
  if (!sector || typeof sector !== 'string') {
    throw new Error('removeVariableProperty requires `sector` (string).')
  }
  if (!property || typeof property !== 'string') {
    throw new Error('removeVariableProperty requires `property` (string).')
  }
  let type = null
  if (descriptor.type !== undefined) {
    type = normalizeVariableType(descriptor.type)
    if (!type) {
      throw new Error(`removeVariableProperty: invalid type "${descriptor.type}". Must be one of: color, size, font-family (aliases: font, typo, typography)`)
    }
  }
  const registry = getRegistry(editor)
  let removed = 0
  for (let i = registry.length - 1; i >= 0; i--) {
    const entry = registry[i]
    const matchTarget = entry.sector === sector
      && entry.property === property
      && (subProperty === undefined || (entry.subProperty || '') === subProperty)
      && (subProperty !== undefined || !entry.subProperty)
    if (matchTarget && (type === null || entry.type === type)) {
      registry.splice(i, 1)
      removed++
    }
  }
  refreshStyleManager(editor)
  return removed
}

/**
 * Styles for the variable UI in the Style Manager (Webflow-style)
 *
 * UX flow:
 *   1. "+" button appears after the property label
 *   2. Click "+" → native <select> dropdown opens with variable options
 *   3. Pick a variable → input is replaced by a purple pill with the name + × clear
 */
const smStyles = document.createElement('style')
smStyles.textContent = `
  /* ── Wrapper ───────────────────────────────────────── */
  .css-vars-sm-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
  }
  .css-vars-sm-wrapper .gjs-field {
    flex: 1;
  }

  /* ── pencil trigger placed after the label ────────────── */
  .css-vars-sm-trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    margin-left: 4px;
    opacity: 0.4;
    transition: opacity 0.15s;
    vertical-align: middle;
    cursor: pointer;
  }
  .css-vars-sm-trigger:hover {
    opacity: 1;
  }
  /* The visible pencil icon */
  .css-vars-sm-trigger__icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 0;
    background: transparent;
    color: inherit;
    font-size: 11px;
    font-weight: normal;
    line-height: 1;
    pointer-events: none;
  }
  /* The transparent native <select> overlaying the circle */
  .css-vars-sm-trigger__select {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    border: none;
    background: transparent;
    font-size: 0;
    z-index: 1;
  }
  .css-vars-sm-trigger__select option {
    color: #ddd;
    background: #3b3b3b;
    font-size: 12px;
  }

  /* ── Variable pill ─────────────────────────────────── */
  .css-vars-sm-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--gjs-main-color, #804f7b);
    color: #fff;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 11px;
    line-height: 1.4;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    flex: 1;
  }
  .css-vars-sm-pill__swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    border: 1px solid rgba(255,255,255,0.4);
    flex-shrink: 0;
  }
  .css-vars-sm-pill__name {
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  /* ── Clear button next to label ─────────────────────── */
  .css-vars-sm-clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    margin-left: 4px;
    border-radius: 0;
    background: transparent;
    color: inherit;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: normal;
    line-height: 1;
    opacity: 0.4;
    transition: opacity 0.15s;
    vertical-align: middle;
  }
  .css-vars-sm-clear:hover {
    opacity: 1;
  }
  .css-vars-sm-clear:hover {
    opacity: 1;
  }

  /* ── State: variable applied → hide field, hide trigger */
  .css-vars-sm-wrapper--has-var .gjs-field {
    display: none;
  }
  .css-vars-sm-wrapper--has-var .css-vars-sm-trigger {
    display: none;
  }
`
document.head.appendChild(smStyles)

/**
 * Inject variable UI onto a single property
 */
function injectVarUI(editor, property, variables) {
  const view = property.view
  if (!view || !view.el) return

  // Clean up previous injection
  const oldWrapper = view.el.querySelector('.css-vars-sm-wrapper')
  if (oldWrapper) {
    const field = oldWrapper.querySelector('.gjs-field')
    if (field) oldWrapper.parentNode.insertBefore(field, oldWrapper)
    oldWrapper.remove()
  }
  // Clean up orphaned elements from previous injections
  view.el.querySelectorAll('.css-vars-sm-trigger, .css-vars-sm-pill, .css-vars-sm-clear').forEach(el => el.remove())

  if (variables.length === 0) return

  const fieldEl = view.el.querySelector('.gjs-field')
  if (!fieldEl) return

  // Read the own-target value (the active class/rule's own style)
  const targetValue = getTargetStyleValue(editor, property)
  // Own var: set directly on this target/class
  const ownVarMatch = targetValue.match(/var\([^)]+\)/)
  const ownVarRef = ownVarMatch ? ownVarMatch[0] : ''
  const isOwnVar = !!ownVarRef
  const ownMatchedVar = isOwnVar ? variables.find(v => v.ref === ownVarRef) : null

  // Create wrapper
  const wrapper = document.createElement('div')
  wrapper.className = 'css-vars-sm-wrapper'
  // Only show pill when var is on the own target (not inherited from another class)
  if (isOwnVar && ownMatchedVar) wrapper.classList.add('css-vars-sm-wrapper--has-var')

  // Move field into wrapper
  fieldEl.parentNode.insertBefore(wrapper, fieldEl)
  wrapper.appendChild(fieldEl)

  // Find the label element to append the "+" trigger after it
  const labelEl = view.el.querySelector('.gjs-sm-label .gjs-sm-icon') || view.el.querySelector('.gjs-sm-label')

  if (isOwnVar && ownMatchedVar) {
    // --- PILL MODE: variable is applied on this target ---
    const pill = document.createElement('div')
    pill.className = 'css-vars-sm-pill'

    // Color swatch for color-type variables
    if (ownMatchedVar.type === TYPE_COLOR && ownMatchedVar.value) {
      const swatch = document.createElement('span')
      swatch.className = 'css-vars-sm-pill__swatch'
      swatch.style.background = ownMatchedVar.value
      pill.appendChild(swatch)
    }

    const nameSpan = document.createElement('span')
    nameSpan.className = 'css-vars-sm-pill__name'
    nameSpan.textContent = ownMatchedVar.name
    nameSpan.title = ownVarRef
    pill.appendChild(nameSpan)

    wrapper.appendChild(pill)

    // Clear button placed after the label (like the "+" trigger)
    const clearBtn = document.createElement('button')
    clearBtn.className = 'css-vars-sm-clear'
    clearBtn.textContent = '\u00d7' // ×
    clearBtn.title = 'Remove variable'
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      setTargetStyleValue(editor, property, '')
    })
    if (labelEl) {
      labelEl.appendChild(clearBtn)
    } else {
      wrapper.appendChild(clearBtn)
    }
  } else {
    // --- SELECT MODE: "+" trigger appended after the label ---
    const trigger = document.createElement('div')
    trigger.className = 'css-vars-sm-trigger'

    // Visible pencil icon
    const icon = document.createElement('span')
    icon.className = 'css-vars-sm-trigger__icon'
    icon.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>'
    trigger.appendChild(icon)

    // Transparent native <select> overlaying the circle
    const select = document.createElement('select')
    select.className = 'css-vars-sm-trigger__select'
    select.title = 'Use variable'

    const emptyOpt = document.createElement('option')
    emptyOpt.value = ''
    emptyOpt.textContent = '\u2014' // —
    emptyOpt.selected = true
    select.appendChild(emptyOpt)

    for (const v of variables) {
      const opt = document.createElement('option')
      opt.value = v.ref
      opt.textContent = v.name
      select.appendChild(opt)
    }

    select.addEventListener('change', (e) => {
      e.stopPropagation()
      const ref = e.target.value
      if (ref) {
        setTargetStyleValue(editor, property, ref)
      }
      // Let the global event handler re-inject (no local setTimeout needed)
    })

    trigger.appendChild(select)

    // Place trigger after the label text, or fall back to inside the wrapper
    if (labelEl) {
      labelEl.appendChild(trigger)
    } else {
      wrapper.appendChild(trigger)
    }
  }
}

/**
 * Build variable option lists from current :root variables
 */
function buildVarOptions(editor) {
  const vars = getVariables(editor)

  const colorOptions = vars.colors.map(v => ({
    name: v.name,
    ref: buildVarRef(v.name),
    type: TYPE_COLOR,
    value: v.value,
  }))

  const sizeOptions = vars.sizes.map(v => ({
    name: v.name,
    ref: buildVarRef(v.name),
    type: TYPE_SIZE,
    value: v.value,
  }))

  const typoOptions = vars.typos.map(v => ({
    name: v.name,
    ref: buildVarRef(v.name),
    type: TYPE_FONT_FAMILY,
    value: v.value,
  }))

  return { colorOptions, sizeOptions, typoOptions }
}

/**
 * Inject variable UI on a single composite sub-property.
 * The parent composite is looked up by sector + property, so sub-properties
 * with the same name in different parents (e.g. `border-color` under
 * `border` vs `border-top`) never get mixed up.
 */
function injectOnSingleSubProperty(editor, sectorId, propertyId, subPropertyName, variables) {
  const prop = editor.StyleManager.getProperty(sectorId, propertyId)
  if (!prop) return
  const subProps = prop.getProperties ? prop.getProperties() : []
  for (const sub of subProps) {
    const propName = sub.get('property')
    if (propName === subPropertyName) {
      injectVarUI(editor, sub, variables)
    }
  }

  // Hook the composite's clear button (once per parent) to also clear var()
  // from sub-properties (GrapesJS can't clear var() on number sub-properties).
  // Tracked as a set so several sub-properties of the same parent share one hook.
  if (!prop.__cssVarClearHookedSubs) prop.__cssVarClearHookedSubs = new Set()
  prop.__cssVarClearHookedSubs.add(subPropertyName)
  if (!prop.__cssVarClearHooked && prop.view && prop.view.el) {
    const clearBtn = prop.view.el.querySelector('[data-clear-style]')
    if (clearBtn) {
      prop.__cssVarClearHooked = true
      clearBtn.addEventListener('click', () => {
        const hooked = prop.__cssVarClearHookedSubs || new Set([subPropertyName])
        for (const sub of (prop.getProperties ? prop.getProperties() : [])) {
          const pName = sub.get('property')
          if (hooked.has(pName)) {
            const val = getTargetStyleValue(editor, sub)
            if (val && val.includes('var(')) {
              setTargetStyleValue(editor, sub, '')
            }
          }
        }
      })
    }
  }
}

/**
 * Inject variable UI on composite sub-properties.
 * Kept for backwards compatibility, delegates to the single-sub helper.
 * Also hooks the composite's clear button so it clears var() values
 * from sub-properties (Bug 6: GrapesJS can't clear var() on number sub-properties).
 */
function injectOnCompositeSubProperties(editor, sectorId, propertyId, subPropertyNames, variables) {
  for (const name of subPropertyNames) {
    injectOnSingleSubProperty(editor, sectorId, propertyId, name, variables)
  }
}

function isTypeEnabled(options, type) {
  if (type === TYPE_COLOR) return options.enableColors !== false
  if (type === TYPE_SIZE) return options.enableSizes !== false
  return options.enableTypography !== false
}

/**
 * Inject all variable UIs into the style manager, from the per-editor registry.
 * Unknown sectors/properties (e.g. registered before their plugin loads) are skipped.
 */
function injectAllDropdowns(editor, options) {
  const opts = options || getStoredOptions(editor)
  const { colorOptions, sizeOptions, typoOptions } = buildVarOptions(editor)
  const optionsByType = {
    [TYPE_COLOR]: colorOptions,
    [TYPE_SIZE]: sizeOptions,
    [TYPE_FONT_FAMILY]: typoOptions,
  }

  for (const entry of getRegistry(editor)) {
    if (!isTypeEnabled(opts, entry.type)) continue
    const variables = optionsByType[entry.type]
    if (!variables) continue
    if (!entry.subProperty) {
      const property = editor.StyleManager.getProperty(entry.sector, entry.property)
      if (property) injectVarUI(editor, property, variables)
    } else {
      injectOnSingleSubProperty(editor, entry.sector, entry.property, entry.subProperty, variables)
    }
  }
}

/**
 * Refresh all style manager variable UIs
 */
export function refreshStyleManager(editor, options) {
  const opts = options || getStoredOptions(editor)
  // requestAnimationFrame is unavailable in some test envs (node) - inject synchronously there
  if (typeof requestAnimationFrame === 'undefined') {
    injectAllDropdowns(editor, opts)
    return
  }
  requestAnimationFrame(() => {
    injectAllDropdowns(editor, opts)
  })
}

/**
 * Set up event listeners to inject variable UIs when the style manager updates.
 * Attaches `editor.CssVariables` so any plugin (e.g. Silex `css-props.ts`)
 * can add or remove variable-enabled properties at runtime.
 * `options.properties` (array of targets) is merged into the defaults on init.
 */
export function setupStyleManager(editor, options = {}) {
  optionsByEditor.set(editor, options)
  // Init registry with defaults
  getRegistry(editor)
  // Merge initial extra targets (standalone usage without a host app)
  if (Array.isArray(options.properties)) {
    for (const descriptor of options.properties) {
      try {
        // Push without refresh: the Style Manager is not ready yet during init
        const type = normalizeVariableType(descriptor.type)
        if (!descriptor.sector || !descriptor.property || !type) continue
        const registry = getRegistry(editor)
        const entry = descriptor.subProperty
          ? { sector: descriptor.sector, property: descriptor.property, subProperty: descriptor.subProperty, type }
          : { sector: descriptor.sector, property: descriptor.property, type }
        if (!registry.some(existing => sameTarget(existing, entry))) {
          registry.push(entry)
        }
      } catch (e) {
        console.warn('[grapesjs-css-variables] ignoring invalid options.properties entry', descriptor, e)
      }
    }
  }

  // Public API, callable from anywhere with access to the editor
  editor.CssVariables = {
    addVariableProperty: (descriptor) => addVariableProperty(editor, descriptor),
    removeVariableProperty: (descriptor) => removeVariableProperty(editor, descriptor),
    getVariableProperties: () => getVariableProperties(editor),
    refreshStyleManager: (opts) => refreshStyleManager(editor, opts || getStoredOptions(editor)),
  }

  let debounceTimeout
  const inject = () => {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => {
      const opts = getStoredOptions(editor)
      if (typeof requestAnimationFrame === 'undefined') {
        injectAllDropdowns(editor, opts)
        return
      }
      requestAnimationFrame(() => {
        injectAllDropdowns(editor, opts)
      })
    }, 60)
  }

  editor.on('component:selected', inject)
  editor.on('style:target', inject)
  editor.on('style:sector:update', inject)
  editor.on('style:property:update', inject)
  editor.on('undo', inject)
  editor.on('redo', inject)

  editor.on('load', () => {
    setTimeout(inject, 200)
  })
}
