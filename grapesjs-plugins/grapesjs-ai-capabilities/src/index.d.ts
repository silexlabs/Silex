/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import type { Component, Editor } from 'grapesjs'

export interface Capability {
  tool: string
  action: string
  command: string
  description?: string
  prompt?: string
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  title?: string
  tags?: string[]
  version?: string
  readOnly?: boolean
  destructive?: boolean
  idempotent?: boolean
  openWorld?: boolean
}

export interface RegisteredCapability extends Capability {
  id: string
  description: string
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
}

export interface Tool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  readOnly: boolean
  destructive: boolean
  idempotent: boolean
  openWorld: boolean
  actions: Record<string, { command: string, parameters: string[], required: string[], openWorld: boolean, files: string[] }>
}

export const PLUGIN_ID: string
export const EVENT_READY: string
export const MCP_SCHEMA_PROPERTY_NAME: RegExp

export default function aiCapabilities(editor: Editor): void

export function addCapability(def: Capability, options?: { replace?: boolean }): RegisteredCapability
export function describeTool(name: string, description: string): void
export type AddCapability = typeof addCapability
export type DescribeTool = typeof describeTool
export function getCapability(id: string): RegisteredCapability
export function getAllCapabilities(filter?: { tags?: string[] }): RegisteredCapability[]
export function getTools(): Tool[]
export function removeCapability(id: string): boolean
export function hasCapability(id: string): boolean
export function clearCapabilities(): void

export function agentId(editor: Editor, component: Component): string
export function describe(editor: Editor, component: Component): string
export function elementOf(editor: Editor, id?: string): Component
export function created(editor: Editor, components: Component[], parent: Component, options?: { select?: boolean }): { created: { id: string, tag: string, class?: string }[], parent_id: string }
