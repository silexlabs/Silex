import { getVariables, buildVarRef, getTargetStyleValue, setTargetStyleValue } from './variables.js'

/**
 * CSS properties targeted for each variable type
 */
const COLOR_PROPERTIES = [
  ['typography', 'color'],
  ['decorations', 'background-color'],
]

const COLOR_SUB_PROPERTIES = [
  'outline-color',
  'text-decoration-color',
  'column-rule-color',
]

const SIZE_PROPERTIES = [
  ['dimension', 'width'],
  ['dimension', 'height'],
  ['dimension', 'min-width'],
  ['dimension', 'max-width'],
  ['dimension', 'min-height'],
  ['dimension', 'max-height'],
  ['general', 'top'],
  ['general', 'right'],
  ['general', 'bottom'],
  ['general', 'left'],
  ['typography', 'font-size'],
  ['typography', 'letter-spacing'],
  ['typography', 'line-height'],
]

const SIZE_SUB_PROPERTIES = [
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
]

const SIZE_EXTRA_PROPERTIES = [
  ['extra', 'column-gap'],
  ['extra', 'row-gap'],
]

const TYPO_FONT_FAMILY = ['typography', 'font-family']

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

  /* ── "+" trigger placed after the label ────────────── */
  .css-vars-sm-trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    margin-left: 4px;
    opacity: 0.3;
    transition: opacity 0.12s;
  }
  .gjs-sm-property:hover .css-vars-sm-trigger,
  .css-vars-sm-trigger:focus-within {
    opacity: 1;
  }
  /* The visible "+" circle */
  .css-vars-sm-trigger__icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--gjs-main-color, #804f7b);
    color: #fff;
    font-size: 10px;
    font-weight: bold;
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
    padding: 2px 4px 2px 6px;
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
  .css-vars-sm-pill__clear {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    padding: 0 2px;
    flex-shrink: 0;
  }
  .css-vars-sm-pill__clear:hover {
    color: #fff;
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
  view.el.querySelectorAll('.css-vars-sm-trigger, .css-vars-sm-pill').forEach(el => el.remove())

  if (variables.length === 0) return

  const fieldEl = view.el.querySelector('.gjs-field')
  if (!fieldEl) return

  // Read the own-target value (the active class/rule's own style)
  const targetValue = getTargetStyleValue(editor, property)
  const fullValue = String(property.getFullValue ? property.getFullValue() : '')

  // Own var: set directly on this target/class
  const ownVarMatch = targetValue.match(/var\([^)]+\)/)
  const ownVarRef = ownVarMatch ? ownVarMatch[0] : ''
  const isOwnVar = !!ownVarRef
  const ownMatchedVar = isOwnVar ? variables.find(v => v.ref === ownVarRef) : null

  // Inherited var: visible via fullValue but not on own target (e.g. from another class)
  const inheritedVarMatch = !isOwnVar ? fullValue.match(/var\([^)]+\)/) : null
  const isInheritedVar = !!inheritedVarMatch

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
    if (ownMatchedVar.type === 'color' && ownMatchedVar.value) {
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

    const clearBtn = document.createElement('button')
    clearBtn.className = 'css-vars-sm-pill__clear'
    clearBtn.textContent = '\u00d7' // ×
    clearBtn.title = 'Remove variable'
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      setTargetStyleValue(editor, property, '')
      // Let the global event handler re-inject (no local setTimeout needed)
    })
    pill.appendChild(clearBtn)

    wrapper.appendChild(pill)
  } else {
    // --- SELECT MODE: "+" trigger appended after the label ---
    const trigger = document.createElement('div')
    trigger.className = 'css-vars-sm-trigger'

    // Visible "+" circle
    const icon = document.createElement('span')
    icon.className = 'css-vars-sm-trigger__icon'
    icon.textContent = '+'
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
 * Inject variable UI on composite sub-properties.
 * Also hooks the composite's clear button so it clears var() values
 * from sub-properties (Bug 6: GrapesJS can't clear var() on number sub-properties).
 */
function injectOnCompositeSubProperties(editor, sectorId, propertyId, subPropertyNames, variables) {
  const prop = editor.StyleManager.getProperty(sectorId, propertyId)
  if (!prop) return
  const subProps = prop.getProperties ? prop.getProperties() : []
  for (const sub of subProps) {
    const propName = sub.get('property')
    if (subPropertyNames.includes(propName)) {
      injectVarUI(editor, sub, variables)
    }
  }

  // Hook the composite's clear button (once) to also clear var() from sub-properties
  if (!prop.__cssVarClearHooked && prop.view && prop.view.el) {
    const clearBtn = prop.view.el.querySelector('[data-clear-style]')
    if (clearBtn) {
      prop.__cssVarClearHooked = true
      clearBtn.addEventListener('click', () => {
        for (const sub of (prop.getProperties ? prop.getProperties() : [])) {
          const pName = sub.get('property')
          if (subPropertyNames.includes(pName)) {
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
 * Build variable option lists from current :root variables
 */
function buildVarOptions(editor, options) {
  const vars = getVariables(editor, options.prefix)

  const colorOptions = vars.colors.map(v => ({
    name: v.name,
    ref: buildVarRef(v.name, 'color', options.prefix),
    type: 'color',
    value: v.value,
  }))

  const sizeOptions = vars.sizes.map(v => ({
    name: v.name,
    ref: buildVarRef(v.name, 'size', options.prefix),
    type: 'size',
    value: v.value,
  }))

  const typoOptions = vars.typos.map(v => ({
    name: v.name,
    ref: buildVarRef(v.name, 'typo', options.prefix),
    type: 'typo',
    value: v.value,
  }))

  return { colorOptions, sizeOptions, typoOptions }
}

/**
 * Inject all variable UIs into the style manager
 */
function injectAllDropdowns(editor, options) {
  const { colorOptions, sizeOptions, typoOptions } = buildVarOptions(editor, options)

  // Color properties
  if (options.enableColors) {
    for (const [sector, prop] of COLOR_PROPERTIES) {
      const property = editor.StyleManager.getProperty(sector, prop)
      if (property) injectVarUI(editor, property, colorOptions)
    }
    // Color sub-properties in composites
    injectOnCompositeSubProperties(editor, 'decorations', 'outline', COLOR_SUB_PROPERTIES, colorOptions)
    injectOnCompositeSubProperties(editor, 'typography', 'text-decoration', COLOR_SUB_PROPERTIES, colorOptions)
    injectOnCompositeSubProperties(editor, 'extra', 'column-rule', COLOR_SUB_PROPERTIES, colorOptions)
  }

  // Size properties
  if (options.enableSizes) {
    for (const [sector, prop] of SIZE_PROPERTIES) {
      const property = editor.StyleManager.getProperty(sector, prop)
      if (property) injectVarUI(editor, property, sizeOptions)
    }
    for (const [sector, prop] of SIZE_EXTRA_PROPERTIES) {
      const property = editor.StyleManager.getProperty(sector, prop)
      if (property) injectVarUI(editor, property, sizeOptions)
    }
    // Size sub-properties in composites
    injectOnCompositeSubProperties(editor, 'dimension', 'margin', SIZE_SUB_PROPERTIES, sizeOptions)
    injectOnCompositeSubProperties(editor, 'dimension', 'padding', SIZE_SUB_PROPERTIES, sizeOptions)
    injectOnCompositeSubProperties(editor, 'decorations', 'border-radius', SIZE_SUB_PROPERTIES, sizeOptions)
  }

  // Typography: font-family only (font-weight is numeric, not suited for font-family variables)
  if (options.enableTypography) {
    const fontFamilyProp = editor.StyleManager.getProperty(...TYPO_FONT_FAMILY)
    if (fontFamilyProp) {
      injectVarUI(editor, fontFamilyProp, typoOptions)
    }
  }
}

/**
 * Refresh all style manager variable UIs
 */
export function refreshStyleManager(editor, options) {
  requestAnimationFrame(() => {
    injectAllDropdowns(editor, options)
  })
}

/**
 * Set up event listeners to inject variable UIs when the style manager updates
 */
export function setupStyleManager(editor, options) {
  let debounceTimeout
  const inject = () => {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        injectAllDropdowns(editor, options)
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
