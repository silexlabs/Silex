/**
 * @jest-environment jsdom
 */
import grapesjs from "grapesjs"
import { getChildByPersistantId, getComponentByPersistentId, getParentByPersistentId, getPersistantId } from "./state"
import { DataSourceEditor } from "../types"

test('getChildByPersistantId', () => {
  const editor = grapesjs.init({
    container: document.createElement('div'),
    components: `<div id="parent">
      <div id="child1"></div>
      <div id="child2">
        <div id="child3"></div>
      </div>
    </div>`,
  })
  const parent = editor.Components.getById('parent')
  expect(parent).not.toBeNull()
  expect(parent.get('attributes')?.id).toBe('parent')
  const child1 = editor.Components.getById('child1')
  expect(child1).not.toBeNull()
  const child2 = editor.Components.getById('child2')
  expect(child2).not.toBeNull()
  const child3 = editor.Components.getById('child3')
  expect(child3).not.toBeNull()
  parent.set('id-plugin-data-source', 'test-id-parent')
  expect(getPersistantId(parent)).toBe('test-id-parent')
  child3.set('id-plugin-data-source', 'test-id-child3')
  expect(getPersistantId(child3)).toBe('test-id-child3')
  expect(getParentByPersistentId('test-id-parent', child3)).toBe(parent)
  expect(getChildByPersistantId('test-id-child3', parent)).toBe(child3)
  expect(getComponentByPersistentId('test-id-child3', editor as DataSourceEditor)).toBe(child3)
  expect(getComponentByPersistentId('test-id-parent', editor as DataSourceEditor)).toBe(parent)
})