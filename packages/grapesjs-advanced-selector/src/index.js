export default (editor, opts = {}) => {
  const options = { ...{
    // default options
  },  ...opts };

  editor.on('load', () => {
    // Get the SelectorManager UI
    const tagsField = editor.Panels.getPanel('views-container')
      ?.view.el.querySelector('#gjs-clm-tags-field')

    if(!tagsField) throw new Error('Selector Manager UI not found')
    
    // Create our own UI
    const newTagsField = document.createElement('div')
    newTagsField.innerHTML = `
      <div class="gjs-clm-tags" style="display: flex;">
        <input id="gjs-clm-tags" type="text" style="flex: 1;" placeholder="Add tags" />
      </div>
    `

    // Replace the original
    tagsField.parentNode.insertBefore(newTagsField, tagsField)
    tagsField.style.display = 'none'
  })
  // TODO Remove
  editor.on('load', () =>
    editor.addComponents(
      `<div style="margin:100px; padding:25px;">
              Content loaded from the plugin
          </div>`,
      { at: 0 }
    ))
};