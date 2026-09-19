/**
 * Guards for MCP css-var:* commands so a missing/conflicting target is an error.
 */

export function formatValidValues(items) {
  return items.length ? items.join(', ') : '(none)'
}

export function getManagedVarNames(order = []) {
  return order.map(o => o.name).filter(Boolean)
}

export function formatVariableList(order = []) {
  if (!order.length) return '(none)'
  return order.map(o => o.type ? `${o.name} (${o.type})` : o.name).join(', ')
}

export function requireExistingVariable(name, order) {
  const names = getManagedVarNames(order)
  if (!names.includes(name)) {
    throw new Error(`CSS variable "${name}" does not exist. Existing variables: ${formatVariableList(order)}. Use css-var:list to see existing variables.`)
  }
}

export function requireRenameTarget(oldName, newName, order) {
  requireExistingVariable(oldName, order)
  const names = getManagedVarNames(order)
  if (names.includes(newName)) {
    throw new Error(`Cannot rename "${oldName}" to "${newName}": a variable named "${newName}" already exists. Existing variables: ${formatVariableList(order)}.`)
  }
}

export function requireCompatibleType(name, canonical, order) {
  const existing = order.find(o => o.name === name)
  if (existing && existing.type !== canonical) {
    throw new Error(`CSS variable "${name}" already exists with type ${existing.type}. The requested type "${canonical}" was not applied. Existing variables: ${formatVariableList(order)}. Use type "${existing.type}" to update its value, or css-var:remove then css-var:set to change type.`)
  }
  return existing || null
}
