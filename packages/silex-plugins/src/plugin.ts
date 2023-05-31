import { Config, } from './config'
/**
 * Plugin struct
 */
export interface Plugin {
  require: string,
  options: object,
}

/**
 *
 * @param config The initial config object
 * @param plugins The plugins to load
 * @returns Merged results objects
 */
export async function loadPlugins(config: Config, plugins: Plugin[], baseUrl: string = null): Promise<Config> {
  return Promise.all<Config>(plugins
    // Load plugins
    .map(async (plugin: Plugin) => {
      const construct = await loadPlugin<(config: Config, options: object) => Promise<Config>>(plugin.require, baseUrl)
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
async function loadPlugin<T>(location: string, baseUrl: string): Promise<T> {
  const path = getLocation(location, baseUrl)
  const imported: {default?: () => void} = await dynamicImport(path)
  const result = imported?.default ?? imported
  return result as T
}

function getLocation(urlOrPath: string, baseUrl: string = null): string {
  try {
    return new URL(urlOrPath, baseUrl).toString()
  } catch(e) {
    return urlOrPath
  }
}

/**
 * This is isolated here for unit tests to mock it
 * @param path The absolute path to laod
 * @returns The loaded module
 */
async function dynamicImport<T>(path: string): Promise<T> {
  return import(path)
}
