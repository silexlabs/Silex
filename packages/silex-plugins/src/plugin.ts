import { Config } from "./config"
/**
 * Plugins types
 */
export type PluginType = string

/**
 * Plugin struct
 */
export interface Plugin {
  type: PluginType[],
  require: string,
  active: boolean,
  hidden: boolean,
  options: Object,
}

/**
 *
 * @param config The initial config object
 * @param plugins The plugins to load
 * @returns Merged results objects
 */
export async function loadPlugins(config: Config, plugins: Plugin[], pluginType: PluginType, baseUrl: string): Promise<Config> {
  return Promise.all<Config>(plugins
    // Keep only the plugins for this context
    .filter(plugin => plugin.type.includes(pluginType))
    // Load plugins
    .map(async (plugin: Plugin, idx) => {
      console.info(`Init plugin ${plugin.require}`, plugin.options)
      const construct = await loadPlugin<(config: Config, options: any) => Promise<Config>>(plugin.require, baseUrl)
      return construct(config, plugin.options) as Promise<Config>
    }))
    // Merge the results
    .then((results: Config[]): Config => {
      return results.reduce((finalConfig: Config, result: Config): Config => {
        return {
          ...finalConfig,
          ...result,
        } as Config
      }, config)
    })
}

/**
 * Load a plugin
 * @param location The path, absolute, relative or online
 * @returns The result of the plugin default function
 */
export async function loadPlugin<T>(location: string, baseUrl: string): Promise<T> {
  const path = new URL(location, baseUrl).toString()
  const imported: any = await dynamicImport(path)
  const result = imported?.default ?? imported
  return result
}

/**
 * This is isolated here for unit tests to mock it
 * @param path The absolute path to laod
 * @returns The loaded module
 */
export async function dynamicImport<T>(path: string): Promise<T> {
  return import(path)
}
