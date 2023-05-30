import { Plugin, PluginType, loadPlugins } from './plugin'

export default function(pluginType: PluginType, baseUrl: string) {
  return new Config(pluginType, baseUrl)
}

export class Config {
  constructor(private pluginType: PluginType, private baseUrl) {}
  /**
   * Add one or multiple plugins
   * @param plugin One or more plugin definition object
   * @returns A Config object which merges the objects returned by the plugin(s)
   */
  public async addPlugin(plugin: Plugin) {
    const result = await loadPlugins(this, [].concat(plugin as any), this.pluginType, this.baseUrl)
    Object.assign(this, result)
    return this
  }
}
