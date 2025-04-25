export default (editor, opts = {}) => {
  editor.on('load', () => {
    const options = {
      placeholder: 'Search...',
      appendTo: null,
      appendBefore: null,
      ...opts
    }

    const prefix = editor.Config.selectorManager.pStylePrefix
    const id = `${prefix}filter-styles`
    const container = document.createElement('div')
    container.innerHTML = `
      <style>
        #${id}-btn {
          position: absolute;
          right: 0;
          border: none;
          padding: 5px;
          margin: 5px;
          line-height: 1;
          border-radius: 50%;
          width: 25px;
          height: 25px;
          border: 1px solid;
          z-index: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: opacity .15s ease;
          cursor: pointer;
          opacity: .75;
        }
        .empty #${id}-btn {
          cursor: initial;
          opacity: .25;
        }
      </style>

      <button
        id="${id}-btn"
        class="gjs-field gjs-sm-properties gjs-two-color"
        >X</button>
      <input id="${id}" type="text" class="gjs-field gjs-sm-properties gjs-two-color" placeholder="${options.placeholder}" />
    `
    const tags = editor.getContainer().querySelector(`.${prefix}clm-tags`)
    const appendBefore = typeof options.appendBefore === 'string' ? document.querySelector(options.appendBefore) : options.appendBefore
    const appendTo = typeof options.appendTo === 'string' ? document.querySelector(options.appendTo) : options.appendTo
    const wrapper = appendBefore ? appendBefore.parentElement : appendTo ?? tags.parentElement.parentElement
    wrapper.insertBefore(container, appendBefore ?? tags.parentElement.parentElement.lastElementChild)
    const input = wrapper.querySelector(`#${id}`)
    input.onkeyup = () => refresh(editor, input, wrapper)
    const button = wrapper.querySelector(`#${id}-btn`)
    button.onclick = () => {
      input.value = ''
      refresh(editor, input, wrapper)
    }
    editor.on('component:selected component:styleUpdate style:target', () => {
      resetAll(editor)
      setTimeout(() => refresh(editor, input, wrapper))
    })
  })
}

/**
 * Resets all sectors (and therefore all properties).
 * @param editor The editor.
 */
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

/**
 * A data structure containing the sectors whose visibility is altered.
 * @type {WeakMap<WeakKey, any>}
 */
const changedSectors = new WeakMap()

/**
 * Sets the visibility of a sector.
 * @param sector The sector to show/hide.
 * @param visible A boolean used to determine the sector's visibility.
 */
function showSector(sector, visible) {
  if(!changedSectors.has(sector)) {
    changedSectors.set(sector, {
      sector,
      initial: sector.isOpen(),
    })
  }
  sector.setOpen(visible)
}

/**
 * Reverts the visibility state of the sector specified as a parameter.
 * @param sector The sector to reset.
 */
function resetSector(sector) {
  const item = changedSectors.get(sector)
  item?.sector.setOpen(item?.initial)
  changedSectors.delete(sector)
}

/**
 * A data structure containing the properties whose visibility is altered.
 * @type {WeakMap<WeakKey, any>}
 */
const changedProperties = new WeakMap()

/**
 * Sets the visibility of a property.
 * @param property The property to show/hide.
 * @param visible A boolean used to determine the property's visibility.
 */
function showProperty(property, visible) {
  if(!changedProperties.has(property)) {
    changedProperties.set(property, {
      property,
      initial: property.get('visible'),
    })
  }
  property.set('visible', visible)
}

/**
 * Reverts the visibility state of the property specified as a parameter.
 * @param property The property to reset.
 */
function resetProperty(property) {
  const item = changedProperties.get(property)
  item?.property.set('visible', item?.initial)
  changedProperties.delete(property)
}

/**
 * Returns currently visible sectors.
 * @param editor The editor.
 * @returns {T[]} An array containing the visible sectors.
 */
function getSectors(editor) {
  return editor.StyleManager.getSectors().toArray()
    // Filter visible sectors
    .filter(sector => sector.isVisible())
}

/**
 * Returns searchable properties. Used by the ``refresh()`` function to filter properties.
 * @param editor The editor.
 * @returns {{property: *, sector: *, searchable: string}[]} An array containing the searchable properties.
 */
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

/**
 * The main function of the plugin. Refreshes the properties while applying a filter on their names
 * according to a text input.
 * @param editor The editor.
 * @param input The text input.
 * @param wrapper The wrapper element.
 */
function refresh(editor, input, wrapper) {
  if (input.value) {
    // Display
    wrapper.classList.remove('empty')

    // Get searchable items
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
    wrapper.classList.add('empty')
    resetAll(editor)
  }
}
