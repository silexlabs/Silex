"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const HostingGhPages_1 = require("../hosting-provider/HostingGhPages");
const HostingUnifile_1 = require("../hosting-provider/HostingUnifile");
const PublishJob_1 = require("../publication/PublishJob");
const hostingProviders = [];
const router = express.Router();
function PublishRouter(config, unifile) {
    const { port, rootUrl, enableHostingGhPages, enableHostingUnifile, skipHostingSelection } = config.publisherOptions;
    if (enableHostingUnifile) {
        const hostingUnifile = new HostingUnifile_1.default(unifile, config);
        addHostingProvider(hostingUnifile);
    }
    if (enableHostingGhPages) {
        const hostingGhPages = new HostingGhPages_1.default(unifile, config);
        addHostingProvider(hostingGhPages);
    }
    // **
    // publication tasks
    router.post('/tasks/publish', (req, res) => {
        if (!req.body.provider || !req.body.provider.name) {
            res.status(400).send({
                message: 'Error in the request, hosting provider required',
            });
        }
        else {
            PublishJob_1.default.create(req.body, unifile, req.session, req.cookies, rootUrl, getHostingProvider(req.session.unifile, req.body.provider.name), config);
            res.end();
        }
    });
    router.get('/tasks/publishState', (req, res) => {
        const publishJob = PublishJob_1.default.get(req.session.publicationId);
        if (publishJob) {
            if (publishJob.error) {
                res.status(500);
            }
            res.send({
                message: publishJob.getStatus(),
                stop: publishJob.isStopped(),
            });
        }
        else {
            res.status(404).send({
                message: 'No pending publication.',
                stop: true,
            });
        }
    });
    router.get('/hosting/', (req, res) => {
        const session = !!req.session && !!req.session.unifile ? req.session.unifile : {};
        const hosting = {
            providers: hostingProviders.map((hostingProvider) => hostingProvider.getOptions(session)),
            skipHostingSelection,
        };
        res.json(hosting);
    });
    // vhosts
    router.get('/hosting/:hostingProviderName/vhost', (req, res) => {
        const hostingProvider = getHostingProviderFromReq(req);
        const hostingProviderInfo = hostingProvider.getOptions(req.session.unifile);
        hostingProvider.getVhosts(req.session.unifile)
            .then((vhosts) => {
            res.json(vhosts);
        })
            .catch((err) => {
            res.status(400).send({
                message: `Error from hosting provider "${hostingProviderInfo.displayName}": ${err.message}`,
                err,
            });
        });
    });
    router.get('/hosting/:hostingProviderName/vhost/:name', (req, res) => {
        const hostingProvider = getHostingProviderFromReq(req);
        hostingProvider.getVhostData(req.session.unifile, req.params.name)
            .then((result) => {
            res.json(result);
        })
            .catch((err) => {
            res.json({
                domain: '',
                msg: err,
            });
        });
    });
    router.post('/hosting/:hostingProviderName/vhost/:name', (req, res) => {
        const hostingProvider = getHostingProviderFromReq(req);
        const data = {
            domain: req.body.domain,
        };
        hostingProvider.setVhostData(req.session.unifile, req.params.name, data)
            .then((result) => {
            res.json(result);
        })
            .catch((err) => {
            console.error('Error when trying to attach a domain', req.params.name, data, err);
            res.status(400).send({
                message: `Error when trying to attach a domain to "${req.params.name}". Error details: ${err.message}`,
                err,
            });
        });
    });
    router.delete('/hosting/:hostingProviderName/vhost/:name', (req, res) => {
        const hostingProvider = getHostingProviderFromReq(req);
        hostingProvider.setVhostData(req.session.unifile, req.params.name, null)
            .then((result) => {
            res.json(result);
        })
            .catch((err) => {
            console.error('Error when trying to delete a domain', req.params.name, err);
            res.status(400).send({
                message: `Error when trying to remove domain from "${req.params.name}". Error details: ${err.message}`,
                err,
            });
        });
    });
    router.addHostingProvider = (hostingProvider) => addHostingProvider(hostingProvider);
    return router;
}
exports.default = PublishRouter;
function addHostingProvider(hostingProvider) {
    console.log('> Adding hosting provider', hostingProvider.getOptions({}).displayName);
    hostingProviders.push(hostingProvider);
}
function getHostingProviderFromReq(req) {
    const hostingProviderName = req.params.hostingProviderName;
    const hostingProvider = getHostingProvider(req.session.unifile, hostingProviderName);
    if (!hostingProvider) {
        throw new Error(('Could not find the hosting provider ' + hostingProviderName));
    }
    return hostingProvider;
}
function getHostingProvider(session, hostingProviderName) {
    return hostingProviders.find((hostingProvider) => hostingProvider.getOptions(session).name === hostingProviderName);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHVibGlzaFJvdXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9zZXJ2ZXIvcm91dGVyL1B1Ymxpc2hSb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxtQ0FBa0M7QUFNbEMsdUVBQStEO0FBQy9ELHVFQUErRDtBQUMvRCwwREFBa0Q7QUFJbEQsTUFBTSxnQkFBZ0IsR0FBc0IsRUFBRSxDQUFBO0FBQzlDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQTtBQVMvQixTQUF3QixhQUFhLENBQUMsTUFBYyxFQUFFLE9BQU87SUFDM0QsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUE7SUFFbkgsSUFBSSxvQkFBb0IsRUFBRTtRQUN4QixNQUFNLGNBQWMsR0FBRyxJQUFJLHdCQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQzFELGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFBO0tBQ25DO0lBRUQsSUFBSSxvQkFBb0IsRUFBRTtRQUN4QixNQUFNLGNBQWMsR0FBRyxJQUFJLHdCQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQzFELGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFBO0tBQ25DO0lBRUQsS0FBSztJQUNMLG9CQUFvQjtJQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsR0FBb0IsRUFBRSxHQUFxQixFQUFFLEVBQUU7UUFDNUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO1lBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNuQixP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