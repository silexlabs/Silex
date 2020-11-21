/**
 * @fileoverview helpers to dispatch common actions on the store - this file is cross platform
 * TODO: move this file to a cross platform package (e.g. in src/ts/helpers/)
 */

import { PageState } from '../page-store/types'
import { getUi, updateUi } from './index'
import { store } from '../store/index'
import { Dialog } from './types'

export const openPage = (item: PageState, ui = getUi(), dispatch = store.dispatch) => updateUi({
  ...ui,
  currentPageId: item.id,
}, dispatch)

export const addDialog = (dialog: Dialog, ui = getUi(), dispatch = store.dispatch) => updateUi({
  ...ui,
  dialogs: ui.dialogs.concat(dialog),
}, dispatch)

export const removeDialog = (dialog: Dialog, ui = getUi(), dispatch = store.dispatch) => updateUi({
  ...ui,
  dialogs: ui.dialogs.filter(d => d.id !== dialog.id || d.type !== dialog.type),
}, dispatch)

// 1 dialog only can be open at a time for a given type
export const openDialog = (dialog: Dialog, ui = getUi(), dispatch = store.dispatch) => updateUi({
  ...ui,
  dialogs: ui.dialogs.map(d => d.type === dialog.type && d.visible !== (d.id === dialog.id) ? {
    ...d,
    visible: d.id === dialog.id,
  } : d),
}, dispatch)

