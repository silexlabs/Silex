import { count } from '../visits'

/**
 * @fileoverview
 * TipOfTheDay to display a message at startup
 * Load the data from the "tip-of-the-day" issues on github
 *
 */

/**
 * @param element   container to render the UI
 */
export class TipOfTheDay {
  constructor(public element: HTMLElement) {
    this.init()
  }

  /**
   * Start the process of showing the tip of the day
   */
  init() {
    // start loading
    this.element.classList.add('tip-of-the-day')
    this.element.classList.add('loading')

    // keep track of the visits
    const visits = count()

    // load data
    const oReq = new XMLHttpRequest()
    oReq.open(
        'GET',
        'https://api.github.com/repos/silexlabs/Silex/issues?labels=tip-of-the-day')
    oReq.send()
    oReq.addEventListener('error', (e) => {
      (this.element.querySelector('.container') || this.element).innerHTML =
          'It looks like you are offline. I could not load data from github issues'
      this.element.classList.remove('loading')
    })
    oReq.addEventListener('load', (e) => {
      // get the json response
      const items = JSON.parse(oReq.responseText)

      // loop on the items backward
      const idx = items.length - visits % items.length - 1
      const item = items[idx]
      if (item) {
        // extract the first link from the issue
        const tmp = document.createElement('div')
        tmp.innerHTML = item.body
        const firstLink = tmp.querySelector('a')

        // let firstImage = tmp.querySelector('img');
        // display the content
        const el = document.createElement('a')
        el.target = '_blank'
        el.title = item.title
        el.innerHTML = '<h3>' + item.title + '</h3><p>' +
            this.strip(item.body) + '</p>'
        if (firstLink != null ) {
          el.href = firstLink.href
        }
        (this.element.querySelector('.container') || this.element).appendChild(el)
      }
      this.element.classList.remove('loading')
    })
  }

  /**
   * remove the html from a string
   */
  strip(html) {
    const node = document.createElement('DIV')
    node.innerHTML = html
    return node.textContent || node.innerText || ''
  }
}
