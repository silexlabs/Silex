import { PageData } from '../flux/page-store'
import { createPage, removePage, renamePage, openPage } from '../dom/page-dom'
import { getPages, updatePage, subscribePages } from '../api';

const unsub = subscribePages(onChange)

let stoped = true
export function startPageObserver() {
  console.log('startPageObserver')
  stoped = false
}
export function stopPageObserver() {
  console.log('stoptPageObserver')
  stoped = true
}

function onChange(prev, current) {
  if(!stoped && current !== prev) {
    console.log('Pages state changed', prev, current)

    // added pages
    current
      .filter(page => !prev.find(p => p.name === page.name))
      .forEach(page => onAddPage(page))

    // removed
    prev
      .filter(page => !current.find(p => p.name === page.name))
      .forEach(page => onDeletePage(page))

    // updated
    current
      .filter(page => {
        const prevPage = prev.find(p => p.name === page.name)
        return !!prevPage && prevPage !== page
      })
      .forEach(page => onUpdatePage(prev.find(p => p.name === page.name)
, page))
  }
}

function onAddPage(page: PageData) {
  console.log('Adding a page to the DOM')
  const newPage = createPage(page.name, page.displayName)
  updatePage(page, newPage)
}

function onDeletePage(page: PageData) {
  console.log('Removing page to the DOM')
  removePage(page)
}

function onUpdatePage(oldPage: PageData, page: PageData) {
  console.log('Updating page to the DOM')
  const newPage = renamePage(oldPage, page.name, page.displayName)
  if(!oldPage.isOpen && page.isOpen) {
    openPage(page)
  }
}

