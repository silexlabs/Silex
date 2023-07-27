// Styles are in: src/scss/footer.scss
let _onFooter = []
let footer
export default function (editor, options) {
  const panel = editor.Panels.addPanel({
    id: 'footer',
    visible: true,
    buttons: [{
      id: 'myNewButton',
      className: 'someClass',
      command: 'someCommand',
      attributes: { title: 'Some title' },
      active: false,

    }],
  })
  setTimeout(() => {
    footer = panel.view?.el
    _onFooter.forEach(cbk => cbk(footer))
    _onFooter = []
  })
}

export function onFooter(fn) {
  if(footer) fn(footer)
  else _onFooter.push(fn)
}
