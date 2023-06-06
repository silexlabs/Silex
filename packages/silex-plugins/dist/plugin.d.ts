import { Config } from './config';
/**
 * Plugin type
 */
export type Plugin = ((config: Config) => Config) | string;
/**
 *
 * @param config The initial config object
 * @param plugins The plugins to load
 * @returns Merged results objects
 */
export declare function loadPlugins(config: Config, plugins: Plugin[], options: object, baseUrl?: string): Promise<Config>;
