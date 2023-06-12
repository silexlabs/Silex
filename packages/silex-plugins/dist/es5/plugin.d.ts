import { Config } from './config';
/**
 * Plugin type
 */
export type Plugin = ((config: Config, options?: object) => object) | Promise<(config: Config, options?: object) => object> | string;
/**
 *
 * @param config The initial config object
 * @param plugins The plugins to load
 * @returns Merged results objects
 */
export declare function loadPlugins(config: Config, plugins: Plugin[], options: object, baseUrl?: string): Promise<Config>;
