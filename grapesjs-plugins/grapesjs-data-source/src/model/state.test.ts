/**
 * @jest-environment jsdom
 */
import grapesjs from 'grapesjs'
import { getChildByPersistantId, getComponentByPersistentId, getParentByPersistentId, getPersistantId, getStateIds, setState } from './state'
import { Editor } from 'grapesjs'

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
  expect(getComponentByPersistentId('test-id-child3', editor as Editor)).toBe(child3)
  expect(getComponentByPersistentId('test-id-parent', editor as Editor)).toBe(parent)
})
test('getStateIds', () => {
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
  setState(parent, 'state1', {label: 'State 1', expression: []})
  setState(parent, 'state2', {label: 'State 2', expression: []}, true)
  setState(parent, 'state3', {label: 'State 3', expression: []}, false)
  setState(parent, 'state4', {label: 'State 4', expression: []}, true)

  expect(getStateIds(parent)).toEqual(['state1', 'state2', 'state4'])
  expect(getStateIds(parent, true)).toEqual(['state1', 'state2', 'state4'])
  expect(getStateIds(parent, false)).toEqual(['state3'])
  expect(getStateIds(parent, true, 'state2')).toEqual(['state1'])
  expect(getStateIds(parent, true, 'state4')).toEqual(['state1', 'state2'])
  expect(getStateIds(parent, true, 'does not exist')).toEqual(['state1', 'state2', 'state4'])
})
test('getStateIds with specific index', () => {
  const editor = grapesjs.init({
    container: document.createElement('div'),
    components: '<div id="parent"></div>',
  })
  const parent = editor.Components.getById('parent')
  setState(parent, 'state1', {label: 'State 1', expression: []}, true)
  setState(parent, 'state2', {label: 'State 2', expression: []}, true)
  setState(parent, 'state3', {label: 'State 3', expression: []}, false)
  setState(parent, 'state4', {label: 'State 4', expression: []}, true)
  setState(parent, 'statePos10', {label: 'State Pos 10', expression: []}, true, 10)
  setState(parent, 'statePos0', {label: 'State Pos 0', expression: []}, true, 0)
  setState(parent, 'statePos2', {label: 'State Pos 2', expression: []}, true, 2)
  setState(parent, 'statePos11', {label: 'State Pos 11', expression: []}, true, 11)

  expect(getStateIds(parent)).toEqual(['statePos0', 'state1', 'statePos2', 'state2', 'state4', 'statePos10', 'statePos11'])
  expect(getStateIds(parent, false)).toEqual(['state3'])
})
