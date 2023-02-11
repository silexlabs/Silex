"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// node modules
const bodyParser = require("body-parser");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const express = require("express");
const session = require("cookie-session");
const CloudExplorerRouter_1 = require("./router/CloudExplorerRouter");
const PublishRouter_1 = require("./router/PublishRouter");
const SslRouter_1 = require("./router/SslRouter");
const StaticRouter_1 = require("./router/StaticRouter");
const WebsiteRouter_1 = require("./router/WebsiteRouter");
function noCache(req, res, next) {
    res.header('Cache-Control', 'private,no-cache,no-store,must-revalidate,proxy-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
}
function withCache(req, res, next) {
    res.header('Cache-Control', 'public,max-age=86400,immutable'); // 24h
    next();
}
function SilexServer(config) {
    if (config.serverOptions.debug) {
        require('source-map-support').install();
    }
    this.config = config;
    this.app = express();
    // compress gzip when possible
    this.app.use(compression());
    // cookie & session
    this.app.use(bodyParser.json({ limit: '1mb' }));
    this.app.use(bodyParser.text({ limit: '10mb' }));
    this.app.use(cookieParser());
    this.app.use(session({
        name: 'silex-session',
        secret: this.config.serverOptions.sessionSecret,
    }));
    // create the routes for unifile/CloudExplorer
    // and for Silex tasks
    this.staticRouter = StaticRouter_1.default(this.config.staticOptions);
    this.ceRouter = CloudExplorerRouter_1.default(this.config.ceOptions);
    this.websiteRouter = WebsiteRouter_1.default(this.config.serverOptions, this.ceRouter.unifile);
    this.publishRouter = PublishRouter_1.default(this.config, this.ceRouter.unifile);
    this.sslRouter = SslRouter_1.default(this.config.sslOptions, this.app);
    this.unifile = this.ceRouter.unifile; // for access by third party
}
exports.default = SilexServer;
SilexServer.prototype.start = function (cbk) {
    // use routers
    this.app.use(this.config.serverOptions.cePath, this.ceRouter); // CE handles cache headers
    this.app.use(withCache, this.staticRouter);
    this.app.use(noCache, this.websiteRouter);
    this.app.use(noCache, this.publishRouter);
    this.app.use(this.sslRouter);
    // server 'loop'
    this.app.listen(this.config.serverOptions.port, () => {
        console.info(`\nI'm ready, listening to port ${this.config.serverOptions.port}\n`);
        if (cbk) {
            cbk();
        }
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2lsZXhTZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdHMvc2VydmVyL1NpbGV4U2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsZUFBZTtBQUNmLDBDQUF5QztBQUN6QywyQ0FBMEM7QUFDMUMsOENBQTZDO0FBQzdDLG1DQUFrQztBQUNsQywwQ0FBeUM7QUFHekMsc0VBQThEO0FBQzlELDBEQUFrRDtBQUNsRCxrREFBMEM7QUFDMUMsd0RBQWdEO0FBQ2hELDBEQUFrRDtBQUVsRCxTQUFTLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUk7SUFDN0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsNERBQTRELENBQUMsQ0FBQTtJQUN6RixHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUMzQixHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQTtJQUNoQyxJQUFJLEVBQUUsQ0FBQTtBQUNSLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUk7SUFDL0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQSxDQUFDLE1BQU07SUFDcEUsSUFBSSxFQUFFLENBQUE7QUFDUixDQUFDO0FBRUQsU0FBd0IsV0FBVyxDQUFDLE1BQWM7SUFDaEQsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRTtRQUM5QixPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUN4QztJQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0lBRXBCLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUE7SUFFcEIsOEJBQThCO0lBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUE7SUFFM0IsbUJBQW1CO0lBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzdDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzlDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUE7SUFDNUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO1FBQ25CLElBQUksRUFBRSxlQUFlO1FBQ3JCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxhQUFhO0tBQ2hELENBQUMsQ0FBQyxDQUFBO0lBRUgsOENBQThDO0lBQzlDLHNCQUFzQjtJQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLHNCQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQTtJQUMzRCxJQUFJLENBQUMsUUFBUSxHQUFHLDZCQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDMUQsSUFBSSxDQUFDLGFBQWEsR0FBRyx1QkFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDcEYsSUFBSSxDQUFDLGFBQWEsR0FBRyx1QkFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUN0RSxJQUFJLENBQUMsU0FBUyxHQUFHLG1CQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQzVELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUEsQ0FBQyw0QkFBNEI7QUFDbkUsQ0FBQztBQTdCRCw4QkE2QkM7QUFFRCxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxVQUFTLEdBQUc7SUFDeEMsY0FBYztJQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUEsQ0FBQywyQkFBMkI7SUFDekYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUMxQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBQ3pDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7SUFDekMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBRTVCLGdCQUFnQjtJQUNoQixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO1FBQ25ELE9BQU8sQ0FBQyxJQUFJLENBQUMsa0NBQWtDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUE7UUFDbEYsSUFBSSxHQUFHLEVBQUU7WUFBRSxHQUFHLEVBQUUsQ0FBQTtTQUFFO0lBQ3BCLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBIn0=