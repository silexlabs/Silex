/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Editor } from 'grapesjs'
import { t } from '../../i18n'
import { upgradeToPageItem } from './page-item'
import { upgradeToPagesFolder } from './pages-folder'

export const migrations = [
  { builderVersion: '3.10.0', upgrade: upgradeToPageItem },
  { builderVersion: '3.10.0', upgrade: upgradeToPagesFolder },
]

export function versionFlowTexts(editor: Editor) {
  return {
    title: t(editor, 'Silex {version}'),
    whatsNewTitle: t(editor, 'What\'s new in Silex {version}'),
    updateMessage: t(editor, 'This website was made with an older version of Silex. Silex needs to update it:'),
    update: t(editor, 'Update and save my website'),
    leave: t(editor, 'Leave without updating'),
    ok: t(editor, 'OK'),
    errorTitle: t(editor, 'Update failed'),
    errorMessage: t(editor, 'Silex could not update this website. Nothing is saved yet. If you edit the website, Silex saves your changes as usual and tries the update again next time you open it. Please report the problem.'),
    errorDetails: t(editor, 'Technical details'),
    report: t(editor, 'Report the problem'),
    continueAnyway: t(editor, 'Continue anyway'),
    // GitHub issues are in English
    reportTitle: 'Website update failed in Silex {version}',
  }
}
