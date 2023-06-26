#!/usr/bin/env node

/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import silex from './index'
import { parse } from 'cli'

const options = parse({
  config: [ 'c', 'Path for the server side config file to load at startup', 'file'],
  port: [ 'p', 'Port to listen to', 'int'],
  debug: [false, 'Debug mode, with live reload, source maps etc.', 'boolean'],
  'ssl-port': [ false, 'Port to listen to for SSL/HTTPS', 'int'],
  'force-https': [ false, 'Force HTTPS', 'boolean'],
  'ssl-private-key': [ false, 'Path to private key for SSL', 'file'],
  'ssl-certificate': [ false, 'Path to SSL certificate', 'file'],
  'force-https-trust-xfp-header': [ false, 'Sets the trustXFPHeader param of the express module "cookie-session". Use only with --force-https', 'boolean'],
  'session-secret': ['s', 'Session secret', 'string'],
  'cors-url': ['', 'Enable CORS for URL (can be "*")', 'string'],
  'client-config': ['', 'Path to client config file to be served on .silex-client.js', 'string'],
  'fs-root': ['', 'Path to the root folder where to store websites. Used by the default backend (fs).', 'string'],
}, {})

if(options.config) process.env.CONFIG = options.config
if(options.port) process.env.PORT = options.port
if(options.debug) process.env.SILEX_DEBUG = options.debug
if(options['ssl-port']) process.env.SSL_PORT = options['ssl-port']
if(options['force-https']) process.env.SILEX_FORCE_HTTPS = options['force-https']
if(options['ssl-private-key']) process.env.SILEX_SSL_PRIVATE_KEY = options['ssl-private-key']
if(options['ssl-certificate']) process.env.SILEX_SSL_CERTIFICATE = options['ssl-certificate']
if(options['force-https-trust-xfp-header']) process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER = options['force-https-trust-xfp-header']
if(options['session-secret']) process.env.SILEX_SESSION_SECRET = options['session-secret']
if(options['cors-url']) process.env.SILEX_CORS_URL = options['cors-url']
if(options['client-config']) process.env.SILEX_CLIENT_CONFIG = options['client-config']
if(options['fs-root']) process.env.FS_ROOT = options['fs-root']

silex()
