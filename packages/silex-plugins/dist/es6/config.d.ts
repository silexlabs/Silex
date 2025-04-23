import { Plugin } from './plugin';
import EventEmitter from 'component-emitter';
export default function (baseUrl?: string): Config;
export declare class Config extends EventEmitter {
    baseUrl: string;
    constructor(baseUrl?: string);
    /**
     * Add one or multiple plugins
     * @param plugin One or more plugin definition object
     * @param options An object containing the plugin options or each plugin options in `options[pluginName]`
     * @returns A Config object which merges the objects returned by the plugin(s)
     */
    addPlugin(plugin: Plugin | Plugin[], options: object): Promise<this>;
}
