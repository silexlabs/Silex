import { Component, Editor } from 'grapesjs'

/**
 * Attributes that can contain references to element IDs.
 * These should be updated when IDs are made unique.
 */
const ID_REFERENCE_ATTRIBUTES = [
  'for',                    // <label for="...">
  'aria-labelledby',        // ARIA: labels
  'aria-describedby',       // ARIA: descriptions
  'aria-controls',          // ARIA: controls
  'aria-owns',              // ARIA: ownership
  'aria-activedescendant',  // ARIA: active descendant
  'aria-flowto',            // ARIA: flow
  'aria-errormessage',      // ARIA: error message
  'list',                   // <input list="..."> for datalist
  'form',                   // <input form="..."> for form association
  'headers',                // <td headers="..."> for table headers
]

/**
 * Attributes that contain ID references prefixed with #
 */
const HASH_ID_ATTRIBUTES = [
  'href',           // <a href="#id">
  'data-target',    // Bootstrap 4: data-target="#id"
  'data-bs-target', // Bootstrap 5: data-bs-target="#id"
]

/**
 * Helper to get all components under a root component in depth-first order.
 */
function flattenComponents(root: Component): Component[] {
  const components: Component[] = []
  root.onAll((c: Component) => components.push(c))
  return components
}

/**
 * Build a map from main symbol component IDs to instance component IDs
 * Uses component order to correlate since both have the same structure
 */
function buildIdMap(mainSymbol: Component, instance: Component): Map<string, string> {
  const idMap = new Map<string, string>()
  const mainComponents = flattenComponents(mainSymbol)
  const instanceComponents = flattenComponents(instance)
  const n = Math.min(mainComponents.length, instanceComponents.length)

  for (let i = 0; i < n; i++) {
    const mainId = mainComponents[i].getAttributes().id
    const instanceId = instanceComponents[i].getAttributes().id
    if (mainId && instanceId) {
      idMap.set(mainId, instanceId)
    }
  }
  return idMap
}

type IdReference = { index: number, attr: string, isHash: boolean }

/**
 * Collect all ID reference values from the main symbol.
 * Returns a map of: referenced ID -> list of {component index, attribute name, isHash}
 */
function collectIdReferences(mainSymbol: Component): Map<string, IdReference[]> {
  const refs = new Map<string, IdReference[]>()
  flattenComponents(mainSymbol).forEach((component, index) => {
    const attrs = component.getAttributes()

    // Check direct ID references
    for (const attr of ID_REFERENCE_ATTRIBUTES) {
      const value = attrs[attr]
      if (typeof value === 'string' && value) {
        const ids = value.split(/\s+/)
        ids.forEach(id => {
          if (!refs.has(id)) refs.set(id, [])
          refs.get(id)!.push({ index, attr, isHash: false })
        })
      }
    }

    // Check hash-prefixed ID references
    for (const attr of HASH_ID_ATTRIBUTES) {
      const value = attrs[attr]
      if (typeof value === 'string' && value.startsWith('#')) {
        const id = value.substring(1)
        if (!refs.has(id)) refs.set(id, [])
        refs.get(id)!.push({ index, attr, isHash: true })
      }
    }
  })

  return refs
}

/**
 * Update ID references in a symbol instance to match the new unique IDs.
 *
 * This function:
 * 1. Gets the main symbol for this instance
 * 2. Builds a map of main symbol IDs -> instance IDs
 * 3. Finds all ID references in the main symbol (for, aria-*, href="#...", etc.)
 * 4. Updates those references in the instance to use the new IDs
 *
 * @param editor - The GrapesJS editor instance
 * @param instance - The root component of the symbol instance
 */
export function makeInstanceIdsUnique(editor: Editor, instance: Component): void {
  const symbolInfo = editor.Components.getSymbolInfo(instance)
  if (!symbolInfo?.main) return
  const mainSymbol = symbolInfo.main

  const idMap = buildIdMap(mainSymbol, instance)
  if (idMap.size === 0) return

  const refs = collectIdReferences(mainSymbol)
  const instanceComponents = flattenComponents(instance)

  refs.forEach((refList, referencedId) => {
    // Prefer exact match, fallback to prefix match (e.g., for GrapesJS suffixes)
    let newId: string | undefined
    idMap.forEach((instanceId, mainId) => {
      if (mainId === referencedId || mainId.startsWith(referencedId + '-')) {
        newId = instanceId
      }
    })
    if (!newId) return

    refList.forEach(ref => {
      const component = instanceComponents[ref.index]
      if (!component) return

      const attrs = component.getAttributes()
      const currentValue = attrs[ref.attr]

      let newValue: string
      if (ref.isHash) {
        newValue = `#${newId}`
      } else if (typeof currentValue === 'string' && currentValue.includes(' ')) {
        // Handle space-separated list of IDs
        newValue = currentValue
          .split(/\s+/)
          .map(id => id === referencedId ? newId! : id)
          .join(' ')
      } else {
        newValue = newId!
      }

      // Temporarily add symbol override for attributes, then set attribute, then restore overrides
      const overrides = component.getSymbolOverride() || []
      const overridesArray = Array.isArray(overrides) ? overrides : []
      const hasAttrOverride = overridesArray.includes('attributes')
      if (!hasAttrOverride) component.setSymbolOverride([...overridesArray, 'attributes'])
      component.setAttributes({ [ref.attr]: newValue })
      if (!hasAttrOverride) component.setSymbolOverride(overrides)
    })
  })
}
