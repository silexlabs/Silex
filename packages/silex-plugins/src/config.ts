import { Plugin, loadPlugins } from './plugin'
import EventEmitter from 'events'

export default function( baseUrl: string = null) {
  return new Config(baseUrl)
}

export class Config extends EventEmitter {
  constructor(private baseUrl: string = null) {
    super()
  }

  /**
   * Add one or multiple plugins
   * @param plugin One or more plugin definition object
   * @returns A Config object which merges the objects returned by the plugin(s)
   */
  public async addPlugin(plugin: Plugin) {
    const result = await loadPlugins(this, [].concat(plugin as any), this.baseUrl)
    Object.assign(this, result)
    return this
  }
}
