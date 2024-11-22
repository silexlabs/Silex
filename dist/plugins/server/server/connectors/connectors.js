"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.toConnectorEnum = toConnectorEnum;
exports.getConnector = getConnector;
exports.toConnectorData = toConnectorData;
exports.contentToString = contentToString;
exports.contentToBuffer = contentToBuffer;
exports.contentToReadable = contentToReadable;
const stream_1 = require("stream");
const types_1 = require("../../types");
function toConnectorEnum(type) {
    const result = types_1.ConnectorType[type.toString().toUpperCase()];
    if (!result)
        throw new Error(`Unknown connector type ${type}. It should be one of ${Object.keys(types_1.ConnectorType).join(', ')}`);
    return result;
}
/**
 * Get a connector by id or by type
 */
async function getConnector(config, session, type, connectorId) {
    // Get the connectors for this type
    const connectors = config.getConnectors(type);
    // Find the connector by id
    if (connectorId)
        return connectors.find(s => s.connectorId === connectorId && s.connectorType === type);
    // Find the first logged in connector
    for (const connector of connectors) {
        if (await connector.isLoggedIn(session)) {
            return connector;
        }
    }
    // Defaults to the first connector
    return connectors[0];
}
/**
 * Convert a connector to a ConnectorData object to be sent to the frontend
 */
async function toConnectorData(session, connector) {
    return {
        connectorId: connector.connectorId,
        type: connector.connectorType,
        displayName: connector.displayName,
        icon: connector.icon,
        disableLogout: !!connector.disableLogout,
        isLoggedIn: await connector.isLoggedIn(session),
        oauthUrl: await connector.getOAuthUrl(session),
        color: connector.color,
        background: connector.background,
    };
}
async function contentToString(content) {
    // String
    if (typeof content === 'string')
        return content;
    // Buffer
    if (Buffer.isBuffer(content))
        return content.toString('utf8');
    // Stream
    return new Promise((resolve, reject) => {
        let result = '';
        content.on('data', (chunk) => {
            result += chunk.toString('utf8');
        });
        content.on('error', (err) => {
            reject(err);
        });
        content.on('end', () => {
            resolve(result);
        });
    });
}
async function contentToBuffer(content) {
    // String
    if (typeof content === 'string')
        return Buffer.from(content, 'utf8');
    // Buffer
    if (Buffer.isBuffer(content))
        return content;
    // Stream
    if (content instanceof stream_1.Readable) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            content.on('data', (chunk) => {
                chunks.push(chunk);
            });
            content.on('error', (err) => {
                reject(err);
            });
            content.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });
    }
    // Unknown
    throw new Error('Unknown content type');
}
function contentToReadable(content) {
    // String
    if (typeof content === 'string')
        return stream_1.Readable.from([content]);
    // Buffer
    if (Buffer.isBuffer(content))
        return stream_1.Readable.from([content]);
    // Stream
    if (content instanceof stream_1.Readable)
        return content;
    // Unknown
    throw new Error('Unknown content type');
}
//# sourceMappingURL=connectors.js.map