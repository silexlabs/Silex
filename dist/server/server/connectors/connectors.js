"use strict";
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
async function getConnector(config, session, type, connectorId) {
    const connectors = config.getConnectors(type);
    if (connectorId)
        return connectors.find(s => s.connectorId === connectorId && s.connectorType === type);
    for (const connector of connectors) {
        if (await connector.isLoggedIn(session)) {
            return connector;
        }
    }
    return connectors[0];
}
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
    if (typeof content === 'string')
        return content;
    if (Buffer.isBuffer(content))
        return content.toString('utf8');
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
    if (typeof content === 'string')
        return Buffer.from(content, 'utf8');
    if (Buffer.isBuffer(content))
        return content;
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
    throw new Error('Unknown content type');
}
function contentToReadable(content) {
    if (typeof content === 'string')
        return stream_1.Readable.from([content]);
    if (Buffer.isBuffer(content))
        return stream_1.Readable.from([content]);
    if (content instanceof stream_1.Readable)
        return content;
    throw new Error('Unknown content type');
}
