
// Browse all elements of all pages
export function onAll(editor, cbk) {
  editor.Pages.getAll()
    .forEach(page => {
      page.getMainComponent()
        .onAll(c => cbk(c))
    })
}
