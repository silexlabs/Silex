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

import commands from './commands'
import { initializeDataSourceManager, refreshDataSources } from './model/dataSourceManager'
import storage from './storage'
import { COMMAND_REFRESH, DATA_SOURCE_ERROR, DataSourceEditorOptions, IDataSource, IDataSourceOptions } from './types'
import { createDataSource, NOTIFICATION_GROUP } from './utils'
import view from './view'
import { Editor } from 'grapesjs'

/**
 * Export the public API
 */
// Main public API - this is what apps should use
export * from './api'

// Types and interfaces that apps need
export * from './types'

/**
 * GrapeJs plugin entry point
 */
export default (editor: Editor, opts: Partial<DataSourceEditorOptions> = {}) => {
  const options: DataSourceEditorOptions = {
    dataSources: [],
    filters: [],
    ...opts,
    view: {
      el: '.gjs-pn-panel.gjs-pn-views-container',
      ...opts?.view,
    },
    commands: {
      refresh: COMMAND_REFRESH,
      ...opts?.commands,
    },
  }

  const dataSources = options.dataSources
    // Make sure the data sources from the config are readonly
    .map(ds => ({ ...ds, readonly: true }))
    // Create the data sources from config
    .map((ds: IDataSourceOptions) => createDataSource(ds))

  // Connect the data sources (async)
  Promise.all(dataSources
    .map(ds => ds.connect()))
    // .then(() => console.info('Data sources connected'))
    .catch(err => console.error('Error while connecting data sources', err))

  // Initialize the global data source manager
  initializeDataSourceManager(dataSources, editor, options)

  // Register the UI for component properties
  view(editor, options)

  // Save and load data sources
  storage(editor)

  // Register the commands
  commands(editor, options)

  // Use grapesjs-notifications plugin for errors
  editor.on(DATA_SOURCE_ERROR, (msg: string, ds: IDataSource) => editor.runCommand('notifications:add', { type: 'error', message: `Data source \`${ds.id}\` error: ${msg}`, group: NOTIFICATION_GROUP }))

  // Load data after editor is fully loaded
  editor.on('load', () => {
    refreshDataSources()
  })

  // Also refresh data when storage loads (to handle website data loading)
  editor.on('storage:end:load', () => {
    // Use setTimeout to ensure components are fully loaded
    setTimeout(() => {
      refreshDataSources()
    }, 100)
  })
}

/**
 * Version of the plugin
 * This is replaced by the build script
 */
export const version = '__VERSION__'
