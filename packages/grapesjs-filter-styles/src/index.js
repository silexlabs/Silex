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
        #${id}-container {
          position: relative;
          display: flex;
          align-items: center;
          margin: 6px 5px;
        }
        #${id}-icon {
          position: absolute;
          left: 10px;
          pointer-events: none;
          opacity: 0.4;
          display: flex;
          align-items: center;
        }
        #${id} {
          width: 100%;
          border-radius: 9999px;
          padding: 15px 12px 15px 30px;
          font-size: 11px;
          border: 1px solid var(--gjs-border-color, #262626);
          background: var(--gjs-primary-darker, #111);
          color: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        #${id}:focus {
          border-color: var(--gjs-tertiary-color, #8873FE);
        }
        #${id}-btn, #${id}-modified-btn {
          position: absolute;
          border: none;
          padding: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          opacity: 0;
          transition: opacity .15s ease;
          font-size: 14px;
          line-height: 1;
          display: flex;
          align-items: center;
        }
        #${id}-btn {
          right: 10px;
        }
        #${id}-modified-btn {
          right: 32px;
        }
        #${id}-modified-btn svg {
          width: 14px;
          height: 14px;
          display: block;
          pointer-events: none;
        }
        #${id}-container #${id}-modified-btn {
          opacity: .4;
        }
        #${id}-container:not(.empty) #${id}-btn {
          opacity: .5;
        }
        #${id}-btn:hover, #${id}-modified-btn:hover {
          opacity: 1;
        }
        #${id}-modified-btn.active {
          color: var(--gjs-tertiary-color, #8873FE);
          opacity: 1;
        }
      </style>

      <div id="${id}-container" class="empty">
        <span id="${id}-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input id="${id}" type="text" placeholder="${options.placeholder}" />
        <button id="${id}-modified-btn" title="Show modified only">
          <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6h-14c-1.1 0-1.4.6-.6 1.4l4.2 4.2c.8.8 1.4 2.3 1.4 3.4v5l4-2v-3.5c0-.8.6-2.1 1.4-2.9l4.2-4.2c.8-.8.5-1.4-.6-1.4z"/>
          </svg>
        </button>
        <button id="${id}-btn">&times;</button>
      </div>
    `
    const tags = editor.getContainer().querySelector(`.${prefix}clm-tags`)
    const appendBefore = typeof options.appendBefore === 'string' ? document.querySelector(options.appendBefore) : options.appendBefore
    const appendTo = typeof options.appendTo === 'string' ? document.querySelector(options.appendTo) : options.appendTo
    const wrapper = appendBefore ? appendBefore.parentElement : appendTo ?? tags.parentElement.parentElement
    wrapper.insertBefore(container, appendBefore ?? tags.parentElement.parentElement.lastElementChild)

    const searchContainer = wrapper.querySelector(`#${id}-container`)
    const input = wrapper.querySelector(`#${id}`)
    const button = wrapper.querySelector(`#${id}-btn`)
    const modBtn = wrapper.querySelector(`#${id}-modified-btn`)

    input.onkeyup = () => {
      searchContainer.classList.toggle('empty', !input.value)
      refresh(editor, input, searchContainer, modBtn)
    }

    button.onclick = () => {
      input.value = ''
      searchContainer.classList.add('empty')
      refresh(editor, input, searchContainer, modBtn)
    }

    modBtn.onclick = () => {
      modBtn.classList.toggle('active')
      refresh(editor, input, searchContainer, modBtn)
    }

    editor.on('component:selected component:styleUpdate style:target', () => {
      resetAll(editor)
      setTimeout(() => refresh(editor, input, searchContainer, modBtn))
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
 * @param container The search container element (carries the `empty` class).
 * @param modBtn The "show modified only" toggle button.
 */
function refresh(editor, input, container, modBtn) {
  const showOnlyModified = modBtn && modBtn.classList.contains('active')

  if (input.value || showOnlyModified) {
    container.classList.remove('empty')

    const properties = getSearchableItems(editor).filter(item => {
      const matchesSearch = item.searchable.toLowerCase().includes(input.value.trim().toLowerCase())
      const isModified = item.property.hasValue({ noParent: true })
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
    container.classList.add('empty')
    resetAll(editor)
  }
}
