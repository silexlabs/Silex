import grapesjs from 'grapesjs/dist/grapes.min.js'

function applyStyle(el, style) {
  Object.keys(style).forEach(key => {
    el.style[key] = style[key]
  })
}

export const loadingPlugin = grapesjs.plugins.add('loading-bar', (editor, options = {}) => {
  const defaultOpts = {
    appendTo: document.body,
    start: true,
    style: {
      padding: '4px',
      backgroundColor: 'white',
      opacity: .6,
      position: 'fixed',
      zIndex: 10,
      transition: 'width 0.2s ease-out',
      pointerEvents: 'none',
    },
    visibleStyle: {
      visibility: 'visible',
      width: '100%',
    },
    hiddenStyle: {
      visibility: 'hidden',
      width: '0%',
    }
  }

  const opts = Object.assign(defaultOpts, options)

  // Create element
  const loadingEl = document.createElement('div')
  editor.on('load', () => {
    const container = typeof opts.appendTo === 'string' ? document.querySelector(opts.appendTo) : opts.appendTo
    if(opts.start) container.insertBefore(loadingEl, container.firstChild)
    else container.appendChild(loadingEl)
  })

  // Style
  applyStyle(loadingEl, opts.style)

  // Loading visibility
  loadingEl.style.visibility = 'hidden'
  editor.on('storage:start', () => {
    applyStyle(loadingEl, opts.visibleStyle)
  })
  editor.on('storage:end', () => {
    applyStyle(loadingEl, opts.hiddenStyle)
  })
})

