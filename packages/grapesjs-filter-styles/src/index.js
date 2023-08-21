//function levenshteinDistance(str, arr) {
//  const matrix = [];
//  for (let i = 0; i <= arr.length; i++) {
//    matrix[i] = [i];
//  }
//  for (let j = 0; j <= str.length; j++) {
//    matrix[0][j] = j;
//  }
//  for (let i = 1; i <= arr.length; i++) {
//    for (let j = 1; j <= str.length; j++) {
//      if (arr.charAt(i - 1) === str.charAt(j - 1)) {
//        matrix[i][j] = matrix[i - 1][j - 1];
//      } else {
//        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
//      }
//    }
//  }
//  return matrix[arr.length][str.length];
//}
//
//function fuzzySearch(query, arr, threshold = 20) {
//  return arr
//    .map(item => ({
//      item,
//      distance: levenshteinDistance(query, item.searchable),
//    }))
//    .filter(({item, distance}) => distance <= threshold)
//    .sort((one, two) => one.distance - two.distance)
//}

export default (editor, opts = {}) => {
  editor.on('load', () => {
    const options = {
      ...{
        placeholder: 'Search...',
      }, ...opts
    };

    const prefix = editor.Config.selectorManager.pStylePrefix;
    const id = `${prefix}filter-styles`
    console.log({ prefix })
    const container = document.createElement('div')
    container.innerHTML = `
      <input id="${id}" type="text" class="gjs-field gjs-sm-properties gjs-two-color" placeholder="${options.placeholder}" />
    `
    const tags = editor.getContainer().querySelector(`.${prefix}clm-tags`);
    const wrapper = tags.parentElement.parentElement
    wrapper.insertBefore(container, tags.parentElement.parentElement.lastElementChild);
    const input = wrapper.querySelector(`#${id}`)
    input.onkeyup = () => refresh(editor, input)
    editor.on('component:selected', () => setTimeout(() => refresh(editor, input)))
  })
}

function refresh(editor, input) {
  console.log('refresh', input.value)
  if (input.value) {
    const properties = editor.StyleManager.getSectors().toArray()
      // Filter visible sectors
      .filter(sector => sector.isVisible())
      // Handles composite properties
      .flatMap(sector => sector.getProperties().flatMap(property => (property.getType() === 'composite' ? property.properties.map(subprop => ({
        sector,
        property: subprop,
        parentProperty: property,
      })) : {
        sector,
        property,
      })))
      // Create a searchable field
      .map(({ sector, property }) => ({
        searchable: `${sector.get('name')}\n${property.get('name')}\n${property.get('options')?.map(option => option.id).join(', ') ?? ''}`,
        sector,
        property,
      }))
      // Keep only the matching items
      .filter(item => item.searchable.toLowerCase().includes(input.value.toLowerCase()))

    // Open or close the sectors
    editor.StyleManager.getSectors().toArray()
      .filter(sector => sector.isVisible())
      .forEach(sector => {
        typeof sector.get('wasOpen') === 'undefined' && sector.set('wasOpen', sector.isOpen())
        sector.setOpen(false)
        sector.getProperties()
          .forEach(property => {
            typeof property.get('wasVisible') === 'undefined' && property.set('wasVisible', property.get('visible'))
            property.set('visible', false)
          })
      })
    properties.forEach(item => {
      const prop = item.parentProperty ?? item.property
      if(prop.get('wasVisible')) {
        item.sector.setOpen(true)
        prop.set('visible', true)
      }
    })
  } else {
    // Reset visibility
    editor.StyleManager.getSectors().toArray()
      .filter(sector => sector.isVisible())
      .forEach(sector => {
        typeof sector.get('wasOpen') !== 'undefined' ? sector.setOpen(sector.get('wasOpen')) : sector.setOpen(false)
        sector.set('wasOpen')
        sector.getProperties()
          .forEach(property => {
            if(typeof property.get('wasVisible') !== 'undefined') {
              property.set('visible', property.get('wasVisible'))
              property.set('wasVisible')
            }
          })
      })
  }
}