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

// Served with the dashboard rather than from a CDN: the pages that load it can call the commands of the app.
// The desktop bridge loads it in the dashboard and in the editor, once the user agreed.
import {
  addBreadcrumb,
  browserTracingIntegration,
  captureException,
  init,
  setTag,
  setUser,
  startInactiveSpan,
} from '@sentry/browser'

Object.assign(window, {
  Sentry: { addBreadcrumb, browserTracingIntegration, captureException, init, setTag, setUser, startInactiveSpan },
})
