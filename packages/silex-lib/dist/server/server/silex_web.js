#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const ServerConfig_1 = require("./ServerConfig");
const SilexServer_1 = require("./SilexServer");
const config = new ServerConfig_1.Config();
// here you can change config,
// e.g. use config.publishRouterOptions.enableHostingGhPages
const silex = new SilexServer_1.default(config);
// here you can change routers,
// e.g. add unifile services `silex.unifile.use(unifileConnector)`
// and use `silex.app.get(...)` to add callbacks
// silex.publishRouter.addHostingProvider(...)
// @see https://github.com/silexlabs/Silex/wiki/Silex-Developer-Guide#add-unifile-services-eg-for-hosting-companies
silex.start(() => {
    // server started
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lsZXhfd2ViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9zaWxleF93ZWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUdBLFlBQVksQ0FBQTs7QUFFWix1Q0FBb0M7QUFDcEMsaURBQXVDO0FBQ3ZDLCtDQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLHFCQUFNLEVBQUUsQ0FBQTtBQUMzQiw4QkFBOEI7QUFDOUIsNERBQTREO0FBQzVELE1BQU0sS0FBSyxHQUFHLElBQUkscUJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNyQywrQkFBK0I7QUFDL0Isa0VBQWtFO0FBQ2xFLGdEQUFnRDtBQUNoRCw4Q0FBOEM7QUFDOUMsbUhBQW1IO0FBRW5ILEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFO0lBQ2YsaUJBQWlCO0FBQ25CLENBQUMsQ0FBQyxDQUFBIn0=