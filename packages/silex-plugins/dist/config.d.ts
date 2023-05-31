/// <reference types="node" />
import { Plugin } from './plugin';
import EventEmitter from 'events';
export default function (baseUrl?: string): Config;
export declare class Config extends EventEmitter {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Add one or multiple plugins
     * @param plugin One or more plugin definition object
     * @returns A Config object which merges the objects returned by the plugin(s)
     */
    addPlugin(plugin: Plugin): Promise<this>;
}
