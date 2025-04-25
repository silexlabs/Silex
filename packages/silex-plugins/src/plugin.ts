import { Config, } from './config'

/**
 * Plugin type
 */
export type Plugin = ((config: Config, options?: object) => object) | Promise<(config: Config, options?: object) => object> | string

/**
 *
 * @param config The initial config object
 * @param plugins The plugins to load
 * @returns Merged results objects
 */
export async function loadPlugins(config: Config, plugins: Plugin[], options: object, baseUrl: string = null): Promise<Config> {
  return Promise.all<Config>(plugins
    // Load plugins
    .map(async (plugin: Plugin) => {
      const [construct, name,] = await ( async () => {
        switch(typeof plugin) {
        case 'function': return [plugin as (config: Config) => Config, plugin.toString(),]
        case 'string': return [await loadPlugin<(config: Config, options: object) => Promise<Config>>(plugin, baseUrl), plugin as string,]
        default: throw new Error(`Unknown type for plugin: ${typeof plugin}`)
        }
      })()
      return construct(config, name && options ? options[name] ?? options : options) as Promise<Config>
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
  } catch {
    return urlOrPath
  }
}

/**
 * This is isolated here for unit tests to mock it
 * @param path The absolute path to laod
 * @returns The loaded module
 */
async function dynamicImport<T>(path: string): Promise<T> {
  return import(/* webpackIgnore: true */path)
}
