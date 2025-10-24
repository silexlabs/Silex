import { onFooter } from './footer'

export default function (editor, options) {
  let breadcrumbsContainer
  onFooter(footer => {
    // Initialize the breadcrumbs container
    breadcrumbsContainer = document.createElement('div')
    breadcrumbsContainer.id = 'breadcrumbs-container'
    footer.prepend(breadcrumbsContainer)
    // Add breadcrumbs styles
    const breadcrumbsStyles = document.createElement('style')
    breadcrumbsStyles.innerHTML = `
      #breadcrumbs-container {
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 10px;
        font-size: 12px;
        color: #999;
        overflow-x: auto;
        overflow-y: hidden;
      }
      #breadcrumbs-container h3 {
        font-size: inherit;
        margin: 0;
      }
      #breadcrumbs-container .breadcrumb {
        margin: 0 5px;
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        white-space: nowrap;
      }
      #breadcrumbs-container .breadcrumb::after {
        content: "➔";
        margin-left: 10px;
      }

      #breadcrumbs-container .breadcrumb:last-child::after {
        content: "";
      }
    `
    footer.prepend(breadcrumbsStyles)
    renderBreadcrumbs()
  })
  // Append the breadcrumbs container to the editor's container

  editor.on('component:selected style:target component:drag:end', () => renderBreadcrumbs())
  function renderBreadcrumbs() {
    const selectedPage = editor.Pages?.getSelected()
    let component = editor.getSelected() ?? selectedPage?.getMainComponent()

    if(!breadcrumbsContainer || !component) return

    // Clear the breadcrumbs container
    breadcrumbsContainer.innerHTML = ''

    // Traverse up the tree of components, prepending each to the breadcrumbs
    while (component) {
      const breadcrumb = createBreadcrumb(component)
      breadcrumbsContainer.prepend(breadcrumb)
      component = component.parent()
    }

    // Label
    const label = document.createElement('span')
    label.innerHTML = '<h3>Selection:&nbsp;</h3>'
    breadcrumbsContainer.prepend(label)
  }
  function createBreadcrumb(component) {
    const breadcrumb = document.createElement('span')
    const model = component.model
    breadcrumb.onclick = () => {
      editor.select(component)
    }
    breadcrumb.classList.add('breadcrumb')
    breadcrumb.innerHTML = `<span>${component.getName() ?? component.get('tagName')}</span>`
    return breadcrumb
  }
}
