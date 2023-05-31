import { Config } from './config';
/**
 * Plugin struct
 */
export interface Plugin {
    require: string;
    options: object;
}
/**
 *
 * @param config The initial config object
 * @param plugins The plugins to load
 * @returns Merged results objects
 */
export declare function loadPlugins(config: Config, plugins: Plugin[], baseUrl?: string): Promise<Config>;
