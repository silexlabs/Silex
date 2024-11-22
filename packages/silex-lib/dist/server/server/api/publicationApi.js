"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicationError = void 0;
exports.getHostingConnector = getHostingConnector;
exports.getStorageConnector = getStorageConnector;
exports.default = default_1;
const express_1 = require("express");
const constants_1 = require("../../constants");
const types_1 = require("../../types");
const connectors_1 = require("../connectors/connectors");
const validation_1 = require("../utils/validation");
const events_1 = require("../events");
const jobs_1 = require("../jobs");
class PublicationError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
exports.PublicationError = PublicationError;
const PROJECT_ROOT = require.main ? require.main.path : process.cwd();
async function getHostingConnector(session, config, connectorId) {
    const hostingConnector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.HOSTING, connectorId);
    if (!hostingConnector) {
        throw new PublicationError('No hosting connector found', 500);
    }
    if (!await hostingConnector.isLoggedIn(session)) {
        throw new PublicationError('Not logged in', 401);
    }
    return hostingConnector;
}
async function getStorageConnector(session, config, connectorId) {
    const storageConnector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.STORAGE, connectorId);
    if (!storageConnector) {
        throw new PublicationError('No storage connector found', 500);
    }
    if (!await storageConnector.isLoggedIn(session)) {
        throw new PublicationError('Not logged in to the storage connector', 401);
    }
    return storageConnector;
}
function default_1(config) {
    const router = (0, express_1.Router)();
    router.get(constants_1.API_PUBLICATION_STATUS, async function (req, res) {
        const query = req.query;
        const jobId = query.jobId;
        const job = jobId && (0, jobs_1.getJob)(jobId);
        if (!job) {
            console.error(`Error: job not found with id ${jobId}`);
            res.status(404).json({
                message: 'Error: job not found.',
            });
            return;
        }
        res.json({
            ...job,
            _timeout: undefined,
        });
    });
    router.post(constants_1.API_PUBLICATION_PUBLISH, async function (req, res) {
        try {
            const query = req.query;
            const body = req.body;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'id in query');
            const storageId = (0, validation_1.requiredParam)(query.storageId, 'storageId in query');
            const hostingId = (0, validation_1.requiredParam)(query.hostingId, 'hostingId in query');
            const session = (0, validation_1.requiredParam)(req['session'], 'session on express request');
            const data = body;
            const { files } = data;
            if (!files) {
                throw new PublicationError('Missing files in body', 400);
            }
            config.emit(events_1.ServerEvent.PUBLISH_START, data);
            const hostingConnector = await getHostingConnector(session, config, hostingId);
            const storage = await getStorageConnector(session, config, storageId);
            const filesList = await Promise.all(files.map(async (file) => {
                const fileWithContent = file;
                const fileWithSrc = file;
                if (!fileWithContent.content && !fileWithSrc.src)
                    throw new PublicationError('Missing content or src in file', 400);
                const src = fileWithSrc.src;
                return {
                    path: file.permalink ?? file.path,
                    content: fileWithContent.content ?? await storage.readAsset(session, websiteId, fileWithSrc.src),
                };
            }));
            res.json({
                url: await hostingConnector.getUrl(session, websiteId),
                job: await hostingConnector.publish(session, websiteId, filesList, jobs_1.jobManager),
            });
        }
        catch (err) {
            console.error('Error publishing the website', err);
            res
                .status(typeof err.code === 'number' ? err.code : 500)
                .json({
                message: `Error publishing the website. ${err.message}`
            });
            config.emit(events_1.ServerEvent.PUBLISH_END, err);
            return;
        }
        config.emit(events_1.ServerEvent.PUBLISH_END);
    });
    return router;
}
