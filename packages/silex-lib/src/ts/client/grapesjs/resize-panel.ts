export default function(editor) {
  editor.Panels.addPanel({
    id: 'viewsOptions',
    buttons: [{
      id: 'resize',
      // icon for arrow left
      className: 'viewsOptions__size-btn',
      command: 'resize-panel',
      attributes: { title: 'Resize panel' },
    }],
  })
  editor.Commands.add('resize-panel', {
    run: (editor, sender) => {
      document.documentElement.style.setProperty('--viewsPanelWidth', '40%')
    },
    stop: (editor, sender) => {
      document.documentElement.style.setProperty('--viewsPanelWidth', '20%')
    },
  })
}
