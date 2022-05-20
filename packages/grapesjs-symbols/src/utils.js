/**
 * set editor as dirty
 */
export function setDirty(editor) {
  const curr = editor.getDirtyCount() || 0
  editor.getModel().set('changesCount', curr + 1)
}

/**
 * browse all pages and retrieve all website components
 */
export function getAllComponentsFromEditor(editor) {
  const res = []
  editor.Pages.getAll()
    .forEach(page => {
      page.getMainComponent()
        .onAll(c => res.push(c))
    })
  return res
}

