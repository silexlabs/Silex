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

// FIXME: this is for client and server, it is confusing, split in 2 files
import { ConnectorId, PublicationData, WebsiteData, WebsiteId } from '../types'
import { ConnectorFile } from './connectors/connectors'

export enum ServerEvent {
  STARTUP_START = 'startup-start',
  STARTUP_END = 'startup-end',
  PUBLISH_START = 'publish-start',
  PUBLISH_END = 'publish-end',
  WEBSITE_STORE_START = 'store-start',
  WEBSITE_STORE_END = 'store-end',
  WEBSITE_ASSET_STORE_START = 'asset-store-start',
  WEBSITE_ASSET_STORE_END = 'asset-store-end',
}

export type PublishStartEventType = PublicationData
export type PublishEndEventType = Error | null
export type WebsiteStoreStartEventType = { websiteId: WebsiteId, websiteData: WebsiteData, connectorId: ConnectorId}
export type WebsiteStoreEndEventType = Error | null
export type WebsiteAssetStoreStartEventType = { files: ConnectorFile[], websiteId: WebsiteId, connectorId: ConnectorId}
export type WebsiteAssetStoreEndEventType = Error | null
