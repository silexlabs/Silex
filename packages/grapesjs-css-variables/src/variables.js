import { renderModal } from './modal.js'
import { refreshStyleManager } from './style-manager.js'
import { TYPE_COLOR, TYPE_SIZE, TYPE_FONT_FAMILY } from './types.js'

export const cmdOpenVariables = 'open-css-variables'

/**
 * Build the full CSS variable name: --{name}
 */
function buildVarName(name) {
  return `--${name}`
}

/**
 * Build a var() reference string
 */
export function buildVarRef(name) {
  return `var(${buildVarName(name)})`
}

/**
 * Get devices from the editor
 */
export function getDevices(editor) {
  return editor.Devices.getDevices().map(d => ({
    id: d.get('id') || d.get('name'),
    name: d.get('name'),
    widthMedia: d.get('widthMedia') || '',
  }))
}

/**
 * Get the :root CSS rule for a specific breakpoint
 * @param {string} widthMedia - '' for base/desktop, or e.g. '768px' for tablet
 */
function getRootRule(editor, widthMedia) {
  if (!widthMedia) {
    return editor.Css.getRule(':root') || null
  }
  // Use the GrapesJS API (consistent with setRule) to find breakpoint rules
  const apiRule = editor.Css.getRule(':root', {
    atRuleType: 'media',
    atRuleParams: `(max-width: ${widthMedia})`,
  })
  if (apiRule) return apiRule
  // Fallback: manual search for rules that may have been created differently
  const rules = editor.Css.getRules()
  return rules.find(r => {
    return r.get('atRuleType') === 'media'
      && r.get('atRuleParams') === `(max-width: ${widthMedia})`
      && (r.get('selectorsAdd') === ':root'
        || (r.get('selectors')?.models || []).some(s =>
          s.getFullName ? s.getFullName() === ':root' : false
        ))
  }) || null
}

/**
 * Get all managed variables from the base :root rule (no media query).
 * Type information comes from cssVarOrder metadata.
 */
export function getVariables(editor) {
  const rule = getRootRule(editor, '')
  if (!rule) return { colors: [], sizes: [], typos: [] }

  const style = rule.getStyle()
  const order = editor.getModel().get('cssVarOrder') || []
  const typeByName = new Map(order.map(o => [o.name, o.type]))

  const colors = []
  const sizes = []
  const typos = []

  for (const [key, value] of Object.entries(style)) {
    if (!key.startsWith('--')) continue
    const name = key.slice(2)
    const type = typeByName.get(name)
    if (!type) continue
    const entry = { name, value, fullName: key }
    switch (type) {
    case TYPE_COLOR:
      colors.push(entry)
      break
    case TYPE_SIZE:
      sizes.push(entry)
      break
    case TYPE_FONT_FAMILY:
      typos.push(entry)
      break
    }
  }

  return { colors, sizes, typos }
}

/**
 * Get variables for a specific device/breakpoint
 */
export function getVariablesForDevice(editor, widthMedia) {
  const rule = getRootRule(editor, widthMedia)
  if (!rule) return {}

  const order = editor.getModel().get('cssVarOrder') || []
  const typeByName = new Map(order.map(o => [o.name, o.type]))

  const style = rule.getStyle()
  const result = {}

  for (const [key, value] of Object.entries(style)) {
    if (!key.startsWith('--')) continue
    const name = key.slice(2)
    const type = typeByName.get(name)
    if (!type) continue
    result[`${type}-${name}`] = value
  }

  return result
}

/**
 * Set or update a variable for a specific breakpoint
 */
export function setVariableForDevice(editor, { name, value }, widthMedia) {
  const varName = buildVarName(name)

  if (!widthMedia) {
    // Base/desktop: use setRule without media query
    let rule = getRootRule(editor, '')
    const style = rule ? { ...rule.getStyle() } : {}
    style[varName] = value
    editor.Css.setRule(':root', style)
  } else {
    // Breakpoint: use setRule with atRuleType/atRuleParams
    let rule = getRootRule(editor, widthMedia)
    const style = rule ? { ...rule.getStyle() } : {}
    style[varName] = value
    editor.Css.setRule(':root', style, {
      atRuleType: 'media',
      atRuleParams: `(max-width: ${widthMedia})`,
    })
  }
}

/**
 * Remove a variable from a specific breakpoint
 */
export function removeVariableForDevice(editor, { name }, widthMedia) {
  const rule = getRootRule(editor, widthMedia)
  if (!rule) return

  const varName = buildVarName(name)
  const style = { ...rule.getStyle() }
  delete style[varName]
  rule.setStyle(style)
}

/**
 * Remove a variable from ALL breakpoints
 */
export function removeVariable(editor, { name }) {
  // Clean up var() references in all component styles
  const ref = buildVarRef(name)
  updateVarReferences(editor, ref, '')

  const devices = getDevices(editor)
  for (const device of devices) {
    removeVariableForDevice(editor, { name }, device.widthMedia)
  }
}

/**
 * Set or update a variable in the base :root rule
 */
export function setVariable(editor, { name, value }) {
  setVariableForDevice(editor, { name, value }, '')
}

/**
 * Scan all CSS rules and replace var() references
 * @param {string} oldRef - e.g. 'var(--color-primary)'
 * @param {string} newRef - replacement ref, or '' to clear
 */
function updateVarReferences(editor, oldRef, newRef) {
  const rules = editor.Css.getRules()
  const ruleList = rules.models || rules
  for (const rule of ruleList) {
    const style = rule.getStyle()
    let changed = false
    const newStyle = {}
    for (const [prop, value] of Object.entries(style)) {
      if (typeof value === 'string' && value.includes(oldRef)) {
        if (newRef) {
          newStyle[prop] = value.replace(oldRef, newRef)
        } else {
          // Removing: clear the property if the whole value was just the var ref
          newStyle[prop] = value === oldRef ? '' : value.replace(oldRef, '')
        }
        changed = true
      } else {
        newStyle[prop] = value
      }
    }
    if (changed) {
      rule.setStyle(newStyle)
    }
  }
}

/**
 * Rename a variable across all breakpoints
 */
export function renameVariable(editor, { oldName, newName }) {
  const devices = getDevices(editor)
  for (const device of devices) {
    const rule = getRootRule(editor, device.widthMedia)
    if (!rule) continue

    const oldVarName = buildVarName(oldName)
    const newVarName = buildVarName(newName)
    const style = { ...rule.getStyle() }
    const value = style[oldVarName]
    if (value === undefined) continue

    delete style[oldVarName]
    style[newVarName] = value
    rule.setStyle(style)
  }

  // Update var() references in all component styles
  const oldRef = buildVarRef(oldName)
  const newRef = buildVarRef(newName)
  updateVarReferences(editor, oldRef, newRef)

  // Update order array
  const order = editor.getModel().get('cssVarOrder') || []
  const idx = order.findIndex(o => o.name === oldName)
  if (idx !== -1) {
    order[idx] = { ...order[idx], name: newName }
    editor.getModel().set('cssVarOrder', [...order])
  }
}

/**
 * Get all variables with their per-breakpoint values, sorted by stored order.
 * Type information comes from cssVarOrder metadata.
 */
export function getAllVariablesOrdered(editor) {
  const devices = getDevices(editor)
  const order = editor.getModel().get('cssVarOrder') || []
  const typeByName = new Map(order.map(o => [o.name, o.type]))

  // Collect values from all :root rules (base + breakpoints)
  const valuesMap = new Map() // name → { widthMedia → value }

  const collectFromRule = (widthMedia) => {
    const rule = getRootRule(editor, widthMedia)
    if (!rule) return
    const style = rule.getStyle()
    for (const [key, value] of Object.entries(style)) {
      if (!key.startsWith('--')) continue
      const name = key.slice(2)
      if (!typeByName.has(name)) continue
      if (!valuesMap.has(name)) valuesMap.set(name, {})
      valuesMap.get(name)[widthMedia] = value
    }
  }

  collectFromRule('')
  for (const device of devices) {
    if (device.widthMedia) collectFromRule(device.widthMedia)
  }

  // Build result sorted by order, then append unordered
  const result = []
  const seen = new Set()

  for (const orderItem of order) {
    if (valuesMap.has(orderItem.name)) {
      result.push({
        type: orderItem.type,
        name: orderItem.name,
        values: valuesMap.get(orderItem.name),
      })
      seen.add(orderItem.name)
    }
  }

  for (const [name, values] of valuesMap) {
    if (!seen.has(name)) {
      result.push({
        type: typeByName.get(name),
        name,
        values,
      })
    }
  }

  return result
}

/**
 * Update the stored variable order
 */
export function setVariableOrder(editor, order) {
  editor.getModel().set('cssVarOrder', [...order])
}

/**
 * Get the current CSS value for a property from the style target.
 * Needed because GrapesJS number-type properties can't parse var() references,
 * so getFullValue() returns empty for those. We read directly from the target style.
 */
export function getTargetStyleValue(editor, property) {
  const propName = property.get ? property.get('property') : ''
  if (!propName) return ''
  const selected = editor.getSelected()
  if (!selected) return ''
  const target = editor.StyleManager.getModelToStyle(selected)
  if (!target) return ''
  const style = target.getStyle()
  return String(style[propName] || '')
}

/**
 * Set a CSS property value directly on the style target.
 * Needed for number-type properties where upValue() can't handle var() references.
 */
export function setTargetStyleValue(editor, property, value) {
  const propName = property.get ? property.get('property') : ''
  if (!propName) return
  const selected = editor.getSelected()
  if (!selected) return
  const target = editor.StyleManager.getModelToStyle(selected)
  if (!target) return
  const style = { ...target.getStyle() }
  if (value) {
    style[propName] = value
  } else {
    delete style[propName]
  }
  target.setStyle(style)
}

/**
 * Apply preset variables if no :root rule exists yet
 */
function applyPresets(editor, options) {
  const rule = getRootRule(editor, '')
  if (rule && Object.keys(rule.getStyle()).length > 0) return

  for (const preset of options.presets) {
    setVariable(editor, preset)
    // Ensure preset is tracked in cssVarOrder
    const order = editor.getModel().get('cssVarOrder') || []
    if (!order.some(o => o.name === preset.name)) {
      order.push({ type: preset.type, name: preset.name })
      editor.getModel().set('cssVarOrder', [...order])
    }
  }
}

let modal
let modalEl = null

/**
 * Main plugin setup
 */
export function variablesPlugin(editor, options) {
  // Register the command to open the CSS variables modal
  editor.Commands.add(cmdOpenVariables, {
    run() {
      modalEl = document.createElement('div')
      modal = editor.Modal.open({
        title: editor.I18n.t('grapesjs-css-variables.CSS Variables'),
        content: '',
        attributes: { class: 'css-variables-dialog' },
      })
        .onceClose(() => {
          editor.stopCommand(cmdOpenVariables)
          modalEl = null
        })
      modal.setContent(modalEl)
      renderModal(modalEl, editor, options)
      return modal
    },
    stop() {
      if (modal) modal.close()
      modalEl = null
    },
  })

  // Debounced refresh helper — refreshes both SM and modal (if open)
  let debouncedRefreshTimeout
  const debouncedRefresh = () => {
    clearTimeout(debouncedRefreshTimeout)
    debouncedRefreshTimeout = setTimeout(() => {
      refreshStyleManager(editor, options)
      if (modalEl) {
        renderModal(modalEl, editor, options)
      }
    }, 50)
  }

  // Persist cssVarOrder in storage
  editor.on('storage:start:store', (data) => {
    data.cssVarOrder = editor.getModel().get('cssVarOrder') || []
  })

  // Refresh on load and restore ordering
  editor.on('storage:end:load', (data) => {
    if (data.cssVarOrder) {
      editor.getModel().set('cssVarOrder', data.cssVarOrder)
    }
    applyPresets(editor, options)
    debouncedRefresh()
  })

  // Refresh when canvas frame loads
  editor.on('canvas:frame:load', () => {
    debouncedRefresh()
  })

  // Refresh on page change
  editor.on('page', () => {
    debouncedRefresh()
  })

  // Refresh on undo/redo so modal and SM stay in sync
  editor.on('undo', debouncedRefresh)
  editor.on('redo', debouncedRefresh)
}
