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
/**
 * @fileoverview Publication plugin for Silex
 * Adds a publication API to Silex server
 */
/**
 * Error thrown by the publication API
 * @param message error message
 * @param code http status code
 */
class PublicationError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
exports.PublicationError = PublicationError;
const PROJECT_ROOT = require.main ? require.main.path : process.cwd();
/**
 * Get the desired connector
 * Can be the default connector or a specific one
 */
async function getHostingConnector(session, config, connectorId) {
    const hostingConnector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.HOSTING, connectorId); //  ?? config.getHostingConnectors()[0]
    if (!hostingConnector) {
        throw new PublicationError('No hosting connector found', 500);
    }
    if (!await hostingConnector.isLoggedIn(session)) {
        throw new PublicationError('Not logged in', 401);
    }
    return hostingConnector;
}
async function getStorageConnector(session, config, connectorId) {
    const storageConnector = await (0, connectors_1.getConnector)(config, session, types_1.ConnectorType.STORAGE, connectorId); //  ?? config.getStorageConnectors()[0]
    if (!storageConnector) {
        throw new PublicationError('No storage connector found', 500);
    }
    if (!await storageConnector.isLoggedIn(session)) {
        throw new PublicationError('Not logged in to the storage connector', 401);
    }
    return storageConnector;
}
function default_1(config) {
    // Create a new router
    const router = (0, express_1.Router)();
    // Get publication status
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
    // Publish website
    router.post(constants_1.API_PUBLICATION_PUBLISH, async function (req, res) {
        try {
            const query = req.query;
            const body = req.body;
            const websiteId = (0, validation_1.requiredParam)(query.websiteId, 'id in query');
            const storageId = (0, validation_1.requiredParam)(query.storageId, 'storageId in query');
            const hostingId = (0, validation_1.requiredParam)(query.hostingId, 'hostingId in query');
            const session = (0, validation_1.requiredParam)(req['session'], 'session on express request');
            // Check params
            const data = body;
            const { files } = data;
            if (!files) {
                throw new PublicationError('Missing files in body', 400);
            }
            // Hook for plugins
            config.emit(events_1.ServerEvent.PUBLISH_START, data);
            // Get hosting connector and make sure the user is logged in
            const hostingConnector = await getHostingConnector(session, config, hostingId);
            // Get storage connector which holds the assets
            const storage = await getStorageConnector(session, config, storageId);
            // Load the content if necessary
            const filesList = await Promise.all(files.map(async (file) => {
                const fileWithContent = file;
                const fileWithSrc = file;
                if (!fileWithContent.content && !fileWithSrc.src)
                    throw new PublicationError('Missing content or src in file', 400);
                const src = fileWithSrc.src;
                return {
                    // Destination
                    path: file.permalink ?? file.path,
                    // Content
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
            // Hook for plugins
            config.emit(events_1.ServerEvent.PUBLISH_END, err);
            return;
        }
        // Hook for plugins
        config.emit(events_1.ServerEvent.PUBLISH_END);
    });
    return router;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGljYXRpb25BcGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvc2VydmVyL2FwaS9wdWJsaWNhdGlvbkFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7OztHQWVHOzs7QUFpQ0gsa0RBWUM7QUFFRCxrREFZQztBQUVELDRCQWtGQztBQTdJRCxxQ0FBZ0M7QUFDaEMsK0NBQXlHO0FBQ3pHLHVDQUEyUztBQUMzUyx5REFBMEc7QUFFMUcsb0RBQW1EO0FBQ25ELHNDQUFtRjtBQUNuRixrQ0FBNEM7QUFFNUM7OztHQUdHO0FBRUg7Ozs7R0FJRztBQUNILE1BQWEsZ0JBQWlCLFNBQVEsS0FBSztJQUNMO0lBQXBDLFlBQVksT0FBZSxFQUFTLElBQVk7UUFDOUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRG9CLFNBQUksR0FBSixJQUFJLENBQVE7SUFFaEQsQ0FBQztDQUNGO0FBSkQsNENBSUM7QUFFRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBRXJFOzs7R0FHRztBQUNJLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxPQUFZLEVBQUUsTUFBb0IsRUFBRSxXQUFvQjtJQUNoRyxNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBQSx5QkFBWSxFQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUscUJBQWEsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUEsQ0FBQyx1Q0FBdUM7SUFFeEksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDdEIsTUFBTSxJQUFJLGdCQUFnQixDQUFDLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQy9ELENBQUM7SUFFRCxJQUFJLENBQUMsTUFBTSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNoRCxNQUFNLElBQUksZ0JBQWdCLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2xELENBQUM7SUFFRCxPQUFPLGdCQUFvQyxDQUFBO0FBQzdDLENBQUM7QUFFTSxLQUFLLFVBQVUsbUJBQW1CLENBQUMsT0FBWSxFQUFFLE1BQW9CLEVBQUUsV0FBb0I7SUFDaEcsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLElBQUEseUJBQVksRUFBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLHFCQUFhLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFBLENBQUMsdUNBQXVDO0lBRXhJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUMvRCxDQUFDO0lBRUQsSUFBSSxDQUFDLE1BQU0sZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDaEQsTUFBTSxJQUFJLGdCQUFnQixDQUFDLHdDQUF3QyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQzNFLENBQUM7SUFFRCxPQUFPLGdCQUFvQyxDQUFBO0FBQzdDLENBQUM7QUFFRCxtQkFBeUIsTUFBb0I7SUFDM0Msc0JBQXNCO0lBQ3RCLE1BQU0sTUFBTSxHQUFHLElBQUEsZ0JBQU0sR0FBRSxDQUFBO0lBRXZCLHlCQUF5QjtJQUN6QixNQUFNLENBQUMsR0FBRyxDQUFDLGtDQUFzQixFQUFFLEtBQUssV0FBVyxHQUFHLEVBQUUsR0FBRztRQUN6RCxNQUFNLEtBQUssR0FBOEIsR0FBRyxDQUFDLEtBQVksQ0FBQTtRQUN6RCxNQUFNLEtBQUssR0FBVSxLQUFLLENBQUMsS0FBZSxDQUFBO1FBQzFDLE1BQU0sR0FBRyxHQUFHLEtBQUssSUFBSSxJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQTtRQUNsQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxLQUFLLEVBQUUsQ0FBQyxDQUFBO1lBQ3RELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNuQixPQUFPLEVBQUUsdUJBQXVCO2FBQ2pDLENBQUMsQ0FBQTtZQUNGLE9BQU07UUFDUixDQUFDO1FBQ0QsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLEdBQUcsR0FBRztZQUNOLFFBQVEsRUFBRSxTQUFTO1NBQ1ksQ0FBQyxDQUFBO0lBQ3BDLENBQUMsQ0FBQyxDQUFBO0lBRUYsa0JBQWtCO0lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUNBQXVCLEVBQUUsS0FBSyxXQUFXLEdBQUcsRUFBRSxHQUFHO1FBQzNELElBQUksQ0FBQztZQUNILE1BQU0sS0FBSyxHQUErQixHQUFHLENBQUMsS0FBWSxDQUFBO1lBQzFELE1BQU0sSUFBSSxHQUE4QixHQUFHLENBQUMsSUFBSSxDQUFBO1lBQ2hELE1BQU0sU0FBUyxHQUFHLElBQUEsMEJBQWEsRUFBWSxLQUFLLENBQUMsU0FBbUIsRUFBRSxhQUFhLENBQUMsQ0FBQTtZQUNwRixNQUFNLFNBQVMsR0FBRyxJQUFBLDBCQUFhLEVBQWMsS0FBSyxDQUFDLFNBQW1CLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtZQUM3RixNQUFNLFNBQVMsR0FBRyxJQUFBLDBCQUFhLEVBQWMsS0FBSyxDQUFDLFNBQW1CLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtZQUM3RixNQUFNLE9BQU8sR0FBRyxJQUFBLDBCQUFhLEVBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLDRCQUE0QixDQUFDLENBQUE7WUFFM0UsZUFBZTtZQUNmLE1BQU0sSUFBSSxHQUFHLElBQXVCLENBQUE7WUFDcEMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUN0QixJQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxJQUFJLGdCQUFnQixDQUFDLHVCQUF1QixFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQzFELENBQUM7WUFFRCxtQkFBbUI7WUFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBVyxDQUFDLGFBQWEsRUFBRSxJQUE2QixDQUFDLENBQUE7WUFFckUsNERBQTREO1lBQzVELE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBRTlFLCtDQUErQztZQUMvQyxNQUFNLE9BQU8sR0FBRyxNQUFNLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUE7WUFFckUsZ0NBQWdDO1lBQ2hDLE1BQU0sU0FBUyxHQUFvQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBb0IsRUFBRSxFQUFFO2dCQUM1RixNQUFNLGVBQWUsR0FBRyxJQUFpQyxDQUFBO2dCQUN6RCxNQUFNLFdBQVcsR0FBRyxJQUE2QixDQUFBO2dCQUNqRCxJQUFHLENBQUMsZUFBZSxDQUFDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHO29CQUFFLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDbEgsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQTtnQkFDM0IsT0FBTztvQkFDTCxjQUFjO29CQUNkLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJO29CQUNqQyxVQUFVO29CQUNWLE9BQU8sRUFBRSxlQUFlLENBQUMsT0FBTyxJQUFJLE1BQU0sT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUM7aUJBQ2pHLENBQUE7WUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRUgsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDUCxHQUFHLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQztnQkFDdEQsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLGlCQUFVLENBQUM7YUFDOUMsQ0FBQyxDQUFBO1FBQ3JDLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUNsRCxHQUFHO2lCQUNBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7aUJBQ3JELElBQUksQ0FBQztnQkFDSixPQUFPLEVBQUUsaUNBQWlDLEdBQUcsQ0FBQyxPQUFPLEVBQUU7YUFDeEQsQ0FBQyxDQUFBO1lBQ0osbUJBQW1CO1lBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQVcsQ0FBQyxXQUFXLEVBQUUsR0FBMEIsQ0FBQyxDQUFBO1lBQ2hFLE9BQU07UUFDUixDQUFDO1FBQ0QsbUJBQW1CO1FBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtJQUN0QyxDQUFDLENBQUMsQ0FBQTtJQUVGLE9BQU8sTUFBTSxDQUFBO0FBQ2YsQ0FBQyJ9