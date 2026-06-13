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
  'url': ['', 'URL of your server', 'string'],
  'host': ['', 'Sets the host param of the express module "cookie-session".', 'string'],
  'port': [ 'p', 'Port to listen to', 'int'],
  'protocol': ['', 'Sets the protocol param of the express module "cookie-session".', 'string'],
  'server-config': [ 's', 'Path for the server side config file to load at startup', 'file'],
  'client-config': ['c', 'Path to client config file to be served on .silex-client.js', 'file'],
  'fs-root': ['', 'Path to the root folder where to store websites. Used by the default storage connector (fs).', 'string'],
  'fs-hosting-root': ['', 'Path to the root folder where to publish websites. Used by the default hosting connector (fs).', 'string'],
  'session-name': ['', 'Sets the name param of the express module "cookie-session".', 'string'],
  'session-secret': ['', 'Session secret', 'string'],
  'ssl-port': [ false, 'Port to listen to for SSL/HTTPS', 'int'],
  'force-https': [ false, 'Force HTTPS', 'boolean'],
  'ssl-private-key': [ false, 'Path to private key for SSL', 'file'],
  'ssl-certificate': [ false, 'Path to SSL certificate', 'file'],
  'force-https-trust-xfp-header': [ false, 'Sets the trustXFPHeader param of the express module "cookie-session". Use only with --force-https', 'boolean'],
  'cors-url': ['', 'Enable CORS for URL (can be "*")', 'string'],
  'express-json-limit': ['', 'Sets the limit param of the express module "json".', 'string'],
  'express-text-limit': ['', 'Sets the limit param of the express module "text".', 'string'],
  'express-urlencoded-limit': ['', 'Sets the limit param of the express module "urlencoded".', 'string'],
  'debug': [false, 'Debug mode, with live reload, source maps etc.', 'boolean'],
}, {})

if(options['url']) process.env.SILEX_URL = options['url']
if(options['host']) process.env.SILEX_HOST = options['host']
if(options.port) process.env.SILEX_PORT = options.port
if(options['protocol']) process.env.SILEX_PROTOCOL = options['protocol']
if(options['server-config']) process.env.SILEX_SERVER_CONFIG = options['server-config']
if(options['client-config']) process.env.SILEX_CLIENT_CONFIG = options['client-config']
if(options['fs-root']) process.env.SILEX_FS_ROOT = options['fs-root']
if(options['fs-hosting-root']) process.env.SILEX_FS_HOSTING_ROOT = options['fs-hosting-root']
if(options['session-name']) process.env.SILEX_SESSION_NAME = options['session-name']
if(options['session-secret']) process.env.SILEX_SESSION_SECRET = options['session-secret']
if(options['ssl-port']) process.env.SILEX_SSL_PORT = options['ssl-port']
if(options['force-https']) process.env.SILEX_FORCE_HTTPS = options['force-https']
if(options['ssl-private-key']) process.env.SILEX_SSL_PRIVATE_KEY = options['ssl-private-key']
if(options['ssl-certificate']) process.env.SILEX_SSL_CERTIFICATE = options['ssl-certificate']
if(options['force-https-trust-xfp-header']) process.env.SILEX_FORCE_HTTPS_TRUST_XFP_HEADER = options['force-https-trust-xfp-header']
if(options['cors-url']) process.env.SILEX_CORS_URL = options['cors-url']
if(options['express-json-limit']) process.env.SILEX_EXPRESS_JSON_LIMIT = options['express-json-limit']
if(options['express-text-limit']) process.env.SILEX_EXPRESS_TEXT_LIMIT = options['express-text-limit']
if(options['express-urlencoded-limit']) process.env.SILEX_EXPRESS_URLENCODED_LIMIT = options['express-urlencoded-limit']
if(options.debug) process.env.SILEX_DEBUG = options.debug

silex()
