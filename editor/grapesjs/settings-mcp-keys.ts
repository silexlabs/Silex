/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 */

/**
 * MCP clients reject ':' in schema property names. Settings still store the
 * Open Graph keys as `og:title` / `og:description` / `og:image`. These helpers
 * map the MCP-facing underscore names used by settings:get / settings:set.
 */
export const MCP_OG_SETTINGS_KEYS = {
  og_title: 'og:title',
  og_description: 'og:description',
  og_image: 'og:image',
} as const

export const SETTINGS_MCP_VALID_KEYS =
  'title, description, favicon, lang, head, og_title, og_description, og_image'

function cloneSettings(settings: Record<string, unknown>): Record<string, unknown> {
  return { ...settings }
}

/** Map incoming MCP keys (`og_title`) to stored Silex keys (`og:title`). */
export function toSilexSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const out = cloneSettings(settings)
  for (const [mcpKey, silexKey] of Object.entries(MCP_OG_SETTINGS_KEYS)) {
    if (Object.prototype.hasOwnProperty.call(out, mcpKey)) {
      out[silexKey] = out[mcpKey]
      delete out[mcpKey]
    }
  }
  return out
}

/** Map stored Silex keys (`og:title`) to MCP keys (`og_title`) for settings:get. */
export function toMcpSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const out = cloneSettings(settings)
  for (const [mcpKey, silexKey] of Object.entries(MCP_OG_SETTINGS_KEYS)) {
    if (Object.prototype.hasOwnProperty.call(out, silexKey)) {
      out[mcpKey] = out[silexKey]
      delete out[silexKey]
    }
  }
  return out
}

/** Merge MCP settings into stored settings and drop leftover `og_*` keys. */
export function mergeSilexSettings(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...current, ...toSilexSettings(incoming) }
  for (const mcpKey of Object.keys(MCP_OG_SETTINGS_KEYS)) {
    delete next[mcpKey]
  }
  return next
}
