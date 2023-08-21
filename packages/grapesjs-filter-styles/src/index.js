export default (editor, opts = {}) => {
  editor.on('load', () => {
    const options = {
      ...{
        placeholder: 'Search...',
      }, ...opts
    };

    const prefix = editor.Config.selectorManager.pStylePrefix;
    const id = `${prefix}filter-styles`
    const container = document.createElement('div')
    container.innerHTML = `
      <input id="${id}" type="text" class="gjs-field gjs-sm-properties gjs-two-color" placeholder="${options.placeholder}" />
    `
    const tags = editor.getContainer().querySelector(`.${prefix}clm-tags`);
    const wrapper = tags.parentElement.parentElement
    wrapper.insertBefore(container, tags.parentElement.parentElement.lastElementChild);
    const input = wrapper.querySelector(`#${id}`)
    input.onkeyup = () => refresh(editor, input)
    editor.on('component:selected', () => {
      resetAll(editor)
      setTimeout(() => refresh(editor, input))
    })
  })
}

// Reset all sectors
function resetAll(editor) {
  getSectors(editor)
    .forEach(sector => {
      resetSector(sector)
      sector.getProperties()
        .forEach(property => {
          resetProperty(property)
        })
    })
}

// Sectors
const changedSectors = new WeakMap()
function showSector(sector, visible) {
  if(!changedSectors.has(sector)) {
    changedSectors.set(sector, {
      sector,
      initial: sector.isOpen(),
    })
  }
  sector.setOpen(visible)
}
function resetSector(sector) {
  const item = changedSectors.get(sector)
  item?.sector.setOpen(item?.initial)
  changedSectors.delete(sector)
}

// Properties
const changedProperties = new WeakMap()
function showProperty(property, visible) {
  if(!changedProperties.has(property)) {
    changedProperties.set(property, {
      property,
      initial: property.get('visible'),
    })
  }
  property.set('visible', visible)
}
function resetProperty(property) {
  const item = changedProperties.get(property)
  item?.property.set('visible', item?.initial)
  changedProperties.delete(property)
}

// Filters
function getSectors(editor) {
  return editor.StyleManager.getSectors().toArray()
    // Filter visible sectors
    .filter(sector => sector.isVisible())
}
function getSearchableItems(editor) {
  return getSectors(editor)
    // Handles composite properties
    .flatMap(sector => sector.getProperties().flatMap(property => (property.getType() === 'composite' ? property.properties.map(subprop => ({
      sector,
      property,
      subprop,
    })) : {
      sector,
      property,
    })))
    // Create a searchable field
    .map(({ sector, property, subprop }) => ({
      searchable: `
        ${sector.get('name')}
        ${property.get('name')}
        ${property.get('options')?.map(option => option.id).join(', ') ?? ''}
        ${subprop?.get('name') ?? ''}
        ${subprop?.get('options')?.map(option => option.id).join(', ') ?? ''}
      `,
      sector,
      property,
    }))
}

// Main action
function refresh(editor, input) {
  if (input.value) {
    const properties = getSearchableItems(editor)
      // Keep only the matching items
      .filter(item => item.searchable.toLowerCase().includes(input.value.toLowerCase()))

    // Close and hide all sectors and properties
    getSectors(editor)
      .forEach(sector => {
        showSector(sector, false)
        sector.getProperties()
        .forEach(property => showProperty(property, false))
      })
    // Show the one we are searching for
    properties.forEach(item => {
      showSector(item.sector, true)
      showProperty(item.property, true)
    })
  } else {
    resetAll(editor)
  }
}
