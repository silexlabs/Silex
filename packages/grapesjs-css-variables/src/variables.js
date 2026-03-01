import { renderModal } from './modal.js'
import { refreshStyleManager } from './style-manager.js'

export const cmdOpenVariables = 'open-css-variables'

const VARIABLE_TYPES = {
  color: 'color',
  size: 'size',
  typo: 'typo',
}

/**
 * Build the full CSS variable name including type prefix
 */
function buildVarName(name, type, prefix) {
  const p = prefix ? `${prefix}` : ''
  return `--${p}${type}-${name}`
}

/**
 * Build a var() reference string
 */
export function buildVarRef(name, type, prefix) {
  return `var(${buildVarName(name, type, prefix)})`
}

/**
 * Parse a CSS variable name to extract type and name
 */
function parseVarName(fullName, prefix) {
  const p = prefix ? `${prefix}` : ''
  for (const type of Object.values(VARIABLE_TYPES)) {
    const pat = `--${p}${type}-`
    if (fullName.startsWith(pat)) {
      return { type, name: fullName.slice(pat.length) }
    }
  }
  return null
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
 * Get all managed variables from the base :root rule (no media query)
 */
export function getVariables(editor, prefix) {
  const rule = getRootRule(editor, '')
  if (!rule) return { colors: [], sizes: [], typos: [] }

  const style = rule.getStyle()
  const colors = []
  const sizes = []
  const typos = []

  for (const [key, value] of Object.entries(style)) {
    const parsed = parseVarName(key, prefix)
    if (!parsed) continue
    const entry = { name: parsed.name, value, fullName: key }
    switch (parsed.type) {
    case VARIABLE_TYPES.color:
      colors.push(entry)
      break
    case VARIABLE_TYPES.size:
      sizes.push(entry)
      break
    case VARIABLE_TYPES.typo:
      typos.push(entry)
      break
    }
  }

  return { colors, sizes, typos }
}

/**
 * Get variables for a specific device/breakpoint
 */
export function getVariablesForDevice(editor, prefix, widthMedia) {
  const rule = getRootRule(editor, widthMedia)
  if (!rule) return {}

  const style = rule.getStyle()
  const result = {}

  for (const [key, value] of Object.entries(style)) {
    const parsed = parseVarName(key, prefix)
    if (!parsed) continue
    result[`${parsed.type}-${parsed.name}`] = value
  }

  return result
}

/**
 * Set or update a variable for a specific breakpoint
 */
export function setVariableForDevice(editor, { name, value, type }, prefix, widthMedia) {
  const varName = buildVarName(name, type, prefix)

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
export function removeVariableForDevice(editor, { name, type }, prefix, widthMedia) {
  const rule = getRootRule(editor, widthMedia)
  if (!rule) return

  const varName = buildVarName(name, type, prefix)
  const style = { ...rule.getStyle() }
  delete style[varName]
  rule.setStyle(style)
}

/**
 * Remove a variable from ALL breakpoints
 */
export function removeVariable(editor, { name, type }, prefix) {
  // Clean up var() references in all component styles
  const ref = buildVarRef(name, type, prefix)
  updateVarReferences(editor, ref, '')

  const devices = getDevices(editor)
  for (const device of devices) {
    removeVariableForDevice(editor, { name, type }, prefix, device.widthMedia)
  }
}

/**
 * Set or update a variable in the base :root rule (legacy compat)
 */
export function setVariable(editor, { name, value, type }, prefix) {
  setVariableForDevice(editor, { name, value, type }, prefix, '')
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
export function renameVariable(editor, { oldName, newName, type }, prefix) {
  const devices = getDevices(editor)
  for (const device of devices) {
    const rule = getRootRule(editor, device.widthMedia)
    if (!rule) continue

    const oldVarName = buildVarName(oldName, type, prefix)
    const newVarName = buildVarName(newName, type, prefix)
    const style = { ...rule.getStyle() }
    const value = style[oldVarName]
    if (value === undefined) continue

    delete style[oldVarName]
    style[newVarName] = value
    rule.setStyle(style)
  }

  // Update var() references in all component styles
  const oldRef = buildVarRef(oldName, type, prefix)
  const newRef = buildVarRef(newName, type, prefix)
  updateVarReferences(editor, oldRef, newRef)

  // Update order array
  const order = editor.getModel().get('cssVarOrder') || []
  const idx = order.findIndex(o => o.type === type && o.name === oldName)
  if (idx !== -1) {
    order[idx] = { type, name: newName }
    editor.getModel().set('cssVarOrder', [...order])
  }
}

/**
 * Get all variables with their per-breakpoint values, sorted by stored order
 */
export function getAllVariablesOrdered(editor, prefix) {
  const devices = getDevices(editor)
  const order = editor.getModel().get('cssVarOrder') || []

  // Collect all variables from the base :root rule
  const baseRule = getRootRule(editor, '')
  const baseStyle = baseRule ? baseRule.getStyle() : {}
  const allVarsMap = new Map()

  for (const [key, value] of Object.entries(baseStyle)) {
    const parsed = parseVarName(key, prefix)
    if (!parsed) continue
    const mapKey = `${parsed.type}-${parsed.name}`
    allVarsMap.set(mapKey, {
      type: parsed.type,
      name: parsed.name,
      values: { '': value },
    })
  }

  // Also check breakpoint rules for variables that might only exist at breakpoints
  for (const device of devices) {
    if (!device.widthMedia) continue
    const rule = getRootRule(editor, device.widthMedia)
    if (!rule) continue
    const style = rule.getStyle()
    for (const [key, value] of Object.entries(style)) {
      const parsed = parseVarName(key, prefix)
      if (!parsed) continue
      const mapKey = `${parsed.type}-${parsed.name}`
      if (!allVarsMap.has(mapKey)) {
        allVarsMap.set(mapKey, {
          type: parsed.type,
          name: parsed.name,
          values: {},
        })
      }
      allVarsMap.get(mapKey).values[device.widthMedia] = value
    }
  }

  // Sort by stored order, unrecognized items go to the end
  const result = []
  const seen = new Set()

  for (const orderItem of order) {
    const mapKey = `${orderItem.type}-${orderItem.name}`
    if (allVarsMap.has(mapKey)) {
      result.push(allVarsMap.get(mapKey))
      seen.add(mapKey)
    }
  }

  // Append any variables not in the order array
  for (const [mapKey, varData] of allVarsMap) {
    if (!seen.has(mapKey)) {
      result.push(varData)
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
    setVariable(editor, preset, options.prefix)
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
