/**
 * set editor as dirty
 */
export function setDirty(editor) {
  const curr = editor.getDirtyCount() || 0
  editor.getModel().set('changesCount', curr + 1)
}

