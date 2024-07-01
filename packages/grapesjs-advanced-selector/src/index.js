export default (editor, opts = {}) => {
  const options = { ...{
    
    // default options
  },  ...opts };

  
  
  

  // TODO Remove
  editor.on('load', () =>
    editor.addComponents(
        `<div style="margin:100px; padding:25px;">
            Content loaded from the plugin
        </div>`,
        { at: 0 }
    ))
};