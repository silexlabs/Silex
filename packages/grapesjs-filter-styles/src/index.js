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
        #${id}-btn, #${id}-modified-btn {
          position: absolute;
          border: none;
          padding: 0;
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
        #${id}-btn{ 
          right: 0; 
        }
        #${id}-modified-btn { 
          right: 30px; 
          opacity: .25;
        }
        #${id}-btn svg, #${id}-modified-btn svg {
          width: 16px; 
          height: 16px;
          display: block;
          pointer-events: none;
        }
        #${id}-modified-btn.active {
          color: var(--gjs-main-color);
          background-color: var(--gjs-tertiary-color);
          border-color: var(--gjs-tertiary-color);
          box-shadow: 0 0 5px var(--gjs-main-dark-color);
          opacity: 1;
        }
        .empty #${id}-btn {
          cursor: initial;
          opacity: .25;
        }
      </style>

      <button 
        id="${id}-modified-btn" 
        title="Show modified only"
        >
        <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6h-14c-1.1 0-1.4.6-.6 1.4l4.2 4.2c.8.8 1.4 2.3 1.4 3.4v5l4-2v-3.5c0-.8.6-2.1 1.4-2.9l4.2-4.2c.8-.8.5-1.4-.6-1.4z"/>
        </svg>
        </button>
      <button
        id="${id}-btn"
        class="gjs-field gjs-sm-properties gjs-two-color"
        >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12 7 7m5 5 5 5m-5-5 5-5m-5 5-5 5"/>
        </svg>
        </button>
      <input id="${id}" type="text" class="gjs-field gjs-sm-properties gjs-two-color" placeholder="${options.placeholder}" />
    `
    const tags = editor.getContainer().querySelector(`.${prefix}clm-tags`)
    const appendBefore = typeof options.appendBefore === 'string' ? document.querySelector(options.appendBefore) : options.appendBefore
    const appendTo = typeof options.appendTo === 'string' ? document.querySelector(options.appendTo) : options.appendTo
    const wrapper = appendBefore ? appendBefore.parentElement : appendTo ?? tags.parentElement.parentElement
    wrapper.insertBefore(container, appendBefore ?? tags.parentElement.parentElement.lastElementChild)
    
    const input = wrapper.querySelector(`#${id}`)
    const button = wrapper.querySelector(`#${id}-btn`)
    const modBtn = wrapper.querySelector(`#${id}-modified-btn`)

    input.onkeyup = () => refresh(editor, input, wrapper, modBtn)
    
    button.onclick = () => {
      input.value = ''
      refresh(editor, input, wrapper, modBtn)
    }
    
    modBtn.onclick = () => {
      modBtn.classList.toggle('active')
      refresh(editor, input, wrapper, modBtn)
    }
    
    editor.on('component:selected component:styleUpdate style:target', () => {
      resetAll(editor)
      setTimeout(() => refresh(editor, input, wrapper, modBtn))
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
        `.replace(/\s+/g, ' ').trim(),
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
function refresh(editor, input, wrapper, modBtn) {
  const showOnlyModified = modBtn && modBtn.classList.contains('active')

  if (input.value || showOnlyModified) {
    wrapper.classList.remove('empty')

    const properties = getSearchableItems(editor).filter(item => {
      const matchesSearch = item.searchable.toLowerCase().includes(input.value.trim().toLowerCase())
      const isModified = item.property.hasValue({ noParent: true })
      //  text search AND modification status
      return showOnlyModified ? (matchesSearch && isModified) : matchesSearch
    })
    // Reset visibility
    getSectors(editor).forEach(sector => {
      showSector(sector, false)
      sector.getProperties().forEach(property => showProperty(property, false))
    })
    // Show filtered results
    properties.forEach(item => {
      showSector(item.sector, true)
      showProperty(item.property, true)
    })

  } else {
    wrapper.classList.add('empty')
    resetAll(editor)
  }
}
