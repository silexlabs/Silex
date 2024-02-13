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

import { ClientSideFile, ClientSideFileType, ClientSideFileWithContent } from '../types'
import { cmdGetHtml } from '@silexlabs/grapesjs-fonts'

/**
 * @fileoverview Make sure custom script blocks include script tags when published
 */

export default async function (config) {
  config.addPublicationTransformers({
    transformFile(file: ClientSideFile): ClientSideFile {
      const fileWithContent = file as ClientSideFileWithContent
      if(fileWithContent.type === ClientSideFileType.HTML && fileWithContent.content) {
        const htmlLinks = config.getEditor().runCommand(cmdGetHtml)
        fileWithContent.content = fileWithContent.content.replace(/<\/head>/, `${htmlLinks}</head>`)
      }
      return file
    },
  })
}
