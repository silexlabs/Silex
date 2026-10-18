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
 * Open Graph keys as `og:title` / `og:description` / `og:image`. This renames
 * the MCP-facing underscore names in both directions. All other keys
 * (including CMS ones like `eleventyPermalink`) pass through untouched.
 * A `Map` keeps keys like `constructor` safe. Returns a new object.
 */
const OG_KEY_ALIASES = new Map([
  ['og_title', 'og:title'],
  ['og:title', 'og_title'],
  ['og_description', 'og:description'],
  ['og:description', 'og_description'],
  ['og_image', 'og:image'],
  ['og:image', 'og_image'],
])

export function renameOgSettingsKeys(settings: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(settings).map(([key, value]): [string, unknown] => [
    OG_KEY_ALIASES.get(key) ?? key,
    value,
  ]))
}
