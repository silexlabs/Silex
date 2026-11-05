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

import type { Component, Editor, Page } from 'grapesjs'
import type { ClientConfig } from '../../config'
import { ClientEvent } from '../../events'
import { ClientSideFileType, type PublicationData, type SiteGenerator, type WebsiteSettings } from '~/common/types'
import { setSettingsOf } from '../settings'
import { linkToPermalink } from './permalink'

// What a static site generator needs at publication, the rest of the CMS is the same for all of them
export interface PublicationTarget {
  renderComponent?(component: Component, toHtml: () => string): string | undefined
  transformPath?(path: string, type: ClientSideFileType): string | undefined
  onPage?(data: { page: Page, siteSettings: WebsiteSettings, pageSettings: WebsiteSettings }): void
  onData?(data: PublicationData): void
  onEnd?(): void
}

export default function (editor: Editor, config: ClientConfig, targets: Record<SiteGenerator, PublicationTarget>) {
  // Kept after the publication: a second click on publish ends with an error while the first one still renders
  let target: PublicationTarget | undefined
  let unsaved: SiteGenerator | null = null

  editor.on(ClientEvent.PUBLISH_START, ({ siteSettings }: { siteSettings: WebsiteSettings }) => {
    const generator = siteSettings.generator ?? config.generator
    target = targets[generator]
    if (!siteSettings.generator) {
      siteSettings.generator = generator
      unsaved = generator
    }
  })
  config.addPublicationTransformers({
    renderComponent: (component: Component, toHtml: () => string) => target?.renderComponent?.(component, toHtml),
    transformPath: (path: string, type: ClientSideFileType) => target?.transformPath?.(path, type) ?? path,
    transformPermalink: (link: string, type: ClientSideFileType) => type === ClientSideFileType.HTML ? linkToPermalink(editor, link) : link,
  })
  editor.on(ClientEvent.PUBLISH_PAGE, data => target?.onPage?.(data))
  editor.on(ClientEvent.PUBLISH_DATA, ({ data }: { data: PublicationData }) => target?.onData?.(data))
  editor.on(ClientEvent.PUBLISH_END, ({ success }: { success: boolean }) => {
    target?.onEnd?.()
    // The website keeps the generator its repository and CI were made for, whatever the default becomes
    if (success && unsaved) setSettingsOf(editor, editor.getModel(), { generator: unsaved })
    unsaved = null
  })
}
