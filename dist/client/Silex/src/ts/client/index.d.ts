/**
 * @fileoverview
 * Defines the entry point of Silex client side application
 *
 */
import { ClientConfig } from './config';
export * from './expose';
/**
 * Expose the config object
 */
export declare let config: ClientConfig;
/**
 * Start Silex, called from host HTML page with window.silex.start()
 */
export declare function start(options?: {}): Promise<void>;
