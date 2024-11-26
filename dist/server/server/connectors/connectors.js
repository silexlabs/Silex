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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9zZXJ2ZXIvY29ubmVjdG9ycy9jb25uZWN0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7O0FBNEZILDBDQUlDO0FBS0Qsb0NBY0M7QUFLRCwwQ0FZQztBQUVELDBDQWtCQztBQUVELDBDQXNCQztBQUVELDhDQVNDO0FBekxELG1DQUFpQztBQUVqQyx1Q0FBeUw7QUF3RnpMLFNBQWdCLGVBQWUsQ0FBQyxJQUE0QjtJQUMxRCxNQUFNLE1BQU0sR0FBRyxxQkFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLEVBQWdDLENBQUMsQ0FBQTtJQUN6RixJQUFHLENBQUMsTUFBTTtRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLElBQUkseUJBQXlCLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDM0gsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDO0FBRUQ7O0dBRUc7QUFDSSxLQUFLLFVBQVUsWUFBWSxDQUFzQixNQUFvQixFQUFFLE9BQVksRUFBRSxJQUFtQixFQUFFLFdBQXlCO0lBQ3hJLG1DQUFtQztJQUNuQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBUSxDQUFBO0lBRXBELDJCQUEyQjtJQUMzQixJQUFJLFdBQVc7UUFBRSxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQyxDQUFBO0lBQ3ZHLHFDQUFxQztJQUNyQyxLQUFLLE1BQU0sU0FBUyxJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ25DLElBQUksTUFBTSxTQUFTLENB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