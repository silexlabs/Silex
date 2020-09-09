import { Constants } from '../../constants'
import { ElementType } from './types'
import { createDomElement } from './dom'

let nextId = 0
const getRandomId = () => 'testId' + (nextId++)

beforeAll(() => {
  document.write(`<html><head></head><body></body></html>`)
})

function testDomElement(id): HTMLDivElement {
  const domEl = document.body.querySelector('.' + id) as HTMLDivElement
  expect(domEl).not.toBeNull()
  expect(domEl.getAttribute(Constants.ELEMENT_ID_ATTR_NAME)).toBe(id)
  expect(domEl.classList).toContain(Constants.EDITABLE_CLASS_NAME)
  return domEl
}

test('element creation', () => {
  let id = getRandomId()
  createDomElement({
    doc: document,
    id,
    type: ElementType.CONTAINER,
    isSectionContent: false,
    parent: document.body,
  })
  const container: HTMLDivElement = testDomElement(id)
  id = getRandomId()
  createDomElement({
    doc: document,
    id,
    type: ElementType.TEXT,
    isSectionContent: false,
    parent: container,
  })
  const textBox: HTMLDivElement = testDomElement(id)
  expect(textBox.parentElement).toBe(container)
  id = getRandomId()
  createDomElement({
    doc: document,
    id,
    type: ElementType.HTML,
    isSectionContent: false,
    parent: container,
  })
  const htmlBox = testDomElement(id)
  expect(htmlBox.parentElement).toBe(container)
  id = getRandomId()
  createDomElement({
    doc: document,
    id,
    type: ElementType.IMAGE,
    isSectionContent: false,
    parent: container,
  })
  const image = testDomElement(id)
  expect(image.parentElement).toBe(container)
  id = getRandomId()
  createDomElement({
    doc: document,
    id,
    type: ElementType.SECTION,
    isSectionContent: false,
    parent: document.body,
  })
  const section: HTMLDivElement = testDomElement(id)
  expect(section.parentElement).toBe(document.body)
  try {
    id = getRandomId()
    createDomElement({
      doc: document,
      id,
      type: ElementType.SECTION,
      isSectionContent: false,
      parent: container,
    })
    fail('should throw an error')
  } catch (e) {
    expect(e).not.toBeNull()
  }
})

