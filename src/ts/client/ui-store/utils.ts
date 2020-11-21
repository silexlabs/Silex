/**
 * @fileoverview Utilities to manupulate ui data
 *
 */

import { getUi } from './index'

export function isDialogVisible(id, type, ui = getUi()) {
  return ui.dialogs
    .find(d => d.id === id && d.type === type)?.visible === true
}

export function getVisibleDialogs(type = null, ui = getUi()) {
  return ui.dialogs
    .filter(d => d.visible && (type === null || d.type === type))
}

