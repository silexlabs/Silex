import { Editor } from 'grapesjs'

/**
 * Remap `body` selectors to the wrapper in the canvas iframe.
 *
 * Iframe DOM: <body> → <div.wrapper> → [page components]. So `body > .x` and
 * friends can't match user components from the iframe body — they live under
 * the wrapper div. We add `.silex-page-body` to the wrapper (DOM-only) and
 * rewrite every CssRule's selector text from `body` to `.silex-page-body`
 * before it's injected, via the official `css:mount:before` event.
 *
 * The CssComposer model is untouched — publication still outputs `body`.
 */

export const BODY_CANVAS_CLASS = 'silex-page-body'

// Matches the `body` tag selector at start or after a combinator/comma/space,
// only when not followed by an identifier char. So `body.test`, `body > .x`,
// `body, h1` all match; `bodyguard`, `.oss-body`, `#somebody` are left alone.
export const BODY_TAG_SELECTOR_RE = /(^|[,\s>+~])body(?![a-zA-Z0-9_-])/g

export default function bodyRemapPlugin(editor: Editor) {
  const addClass = () => editor.getWrapper()?.view?.el?.classList.add(BODY_CANVAS_CLASS)

  // Re-apply on every event that may rebuild the wrapper's className.
  // component:update:classes fires whenever any component (incl. wrapper) classes change.
  editor.on('canvas:frame:load page component:update:classes selector:custom', addClass)

  editor.on('css:mount:before', (mountProps: { css: string }) => {
    if (!mountProps?.css || mountProps.css.includes(BODY_CANVAS_CLASS)) return
    mountProps.css = mountProps.css.replace(BODY_TAG_SELECTOR_RE, `$1.${BODY_CANVAS_CLASS}`)
  })
}
