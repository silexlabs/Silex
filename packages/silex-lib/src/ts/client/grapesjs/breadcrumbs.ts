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
      }
      #breadcrumbs-container h3 {
        margin: 0;
      }
      #breadcrumbs-container .breadcrumb {
        margin: 5px;
        font-size: large;
        line-height: 1;
        cursor: pointer;
      }
      #breadcrumbs-container .breadcrumb span {
        text-decoration: underline;
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

  editor.on('component:selected style', () => renderBreadcrumbs())
  function renderBreadcrumbs() {
    let component = editor.getSelected() ?? editor.Pages.getSelected().getMainComponent()

    if(!breadcrumbsContainer) return

    // Clear the breadcrumbs container
    breadcrumbsContainer.innerHTML = ''

    // Traverse up the tree of components, prepending each to the breadcrumbs
    while (component) {
      const breadcrumb = createBreadcrumb(component)
      breadcrumbsContainer.prepend(breadcrumb)
      console.log(component, component.tagName)
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
    breadcrumb.innerHTML = `<span>${component.get('tagName')}${component.getClasses().length ? `.${component.getClasses().join('.')}` : ''}</span>`
    return breadcrumb
  }
}
