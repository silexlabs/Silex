"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const constants_1 = require("../../constants");
const validation_1 = require("../utils/validation");
const connectors_1 = require("../connectors/connectors");
function default_1(config) {
    const router = (0, express_1.Router)();
    router.get(constants_1.API_CONNECTOR_USER, routeUser);
    router.get(constants_1.API_CONNECTOR_LIST, routeListConnectors);
    router.get(constants_1.API_CONNECTOR_LOGIN, routeLogin);
    router.post(constants_1.API_CONNECTOR_LOGIN_CALLBACK, routeLoginSuccess);
    router.get(constants_1.API_CONNECTOR_LOGIN_CALLBACK, routeLoginSuccess);
    router.post(constants_1.API_CONNECTOR_LOGOUT, routeLogout);
    return router;
}
function validateStatus(status, _default = 500) {
    if (!status) {
        console.warn(`Status code is undefined, returning default ${_default}`);
        return _default;
    }
    status = parseInt(status.toString());
    if (status >= 100 && status < 600)
        return status;
    console.warn(`Invalid status code ${status}, returning default ${_default}}`);
    return _default;
}
async function routeUser(req, res) {
    try {
        const config = (0, validation_1.requiredParam)(req.app.get('config'), 'Config object on express js APP');
        const session = (0, validation_1.requiredParam)(req['session'], 'Session object');
        const query = req.query;
        const type = (0, connectors_1.toConnectorEnum)((0, validation_1.requiredParam)(query.type, 'Connector type'));
        const connector = await (0, connectors_1.getConnector)(config, session, type, query.connectorId);
        if (!connector) {
            res
                .status(500)
                .json({
                error: true,
                message: `Connector not found: ${type} ${query.connectorId}`,
            });
            return;
        }
        if (!await connector.isLoggedIn(session)) {
            res
                .status(401)
                .json({
                error: true,
                message: 'Not logged in',
            });
            return;
        }
        const user = await connector.getUser(session);
        res.json(user);
    }
    catch (error) {
        console.error('Error in the user request', error, error.code);
        res.status(validateStatus(error.code ?? error.httpStatusCode, 500)).json({
            error: true,
            message: error.message,
        });
    }
}
async function routeListConnectors(req, res) {
    try {
        const config = (0, validation_1.requiredParam)(req.app.get('config'), 'Config object on express js APP');
        const session = (0, validation_1.requiredParam)(req['session'], 'Session object');
        const query = req.query;
        const type = (0, connectors_1.toConnectorEnum)((0, validation_1.requiredParam)(query.type, 'Connector type'));
        const connectors = config.getConnectors(type);
        try {
            const list = await Promise.all(connectors.map(async (connector) => (0, connectors_1.toConnectorData)(session, connector)));
            res.json(list);
        }
        catch (error) {
            console.error('Error while listing connectors', error);
            res.status(validateStatus(error?.code ?? error?.httpStatusCode, 500)).json({
                error: true,
                message: 'Error while listing connectors: ' + error.message,
            });
        }
    }
    catch (error) {
        console.error('Error in the list connectors request', error);
        res.status(validateStatus(error?.code ?? error?.httpStatusCode, 400)).json({
            error: true,
            message: 'Error in the list connectors request: ' + error.message,
        });
    }
}
async function routeLogin(req, res) {
    try {
        const query = req.query;
        const connectorId = (0, validation_1.requiredParam)(query.connectorId, 'Connector id');
        const config = (0, validation_1.requiredParam)(req.app.get('config'), 'Config object on express js APP');
        const type = (0, connectors_1.toConnectorEnum)((0, validation_1.requiredParam)(query.type, 'Connector type'));
        const connector = await (0, connectors_1.getConnector)(config, req['session'], type, connectorId);
        const session = (0, validation_1.requiredParam)(req['session'], 'Session object');
        if (!connector)
            throw new Error(`Connector not found ${connectorId} ${type}`);
        if (await connector.isLoggedIn(session)) {
            res.redirect(`${config.url}${constants_1.API_PATH}${constants_1.API_CONNECTOR_PATH}${constants_1.API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}`);
            return;
        }
        const oauthUrl = await connector.getOAuthUrl(session);
        if (oauthUrl) {
            res.redirect(oauthUrl);
        }
        else {
            const redirectTo = await connector.getSettingsForm(session, '') ?
                `${config.url}${constants_1.API_PATH}${constants_1.API_CONNECTOR_PATH}${constants_1.API_CONNECTOR_SETTINGS}?connectorId=${connectorId}&type=${type}` :
                `${config.url}${constants_1.API_PATH}${constants_1.API_CONNECTOR_PATH}${constants_1.API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}`;
            res.send(await connector.getLoginForm(session, redirectTo));
        }
    }
    catch (error) {
        console.error('Error in the login request', error);
        res.status(validateStatus(error?.code ?? error?.httpStatusCode, 400)).json({
            error: true,
            message: 'Error in the login request: ' + error.message,
        });
    }
}
async function routeLoginSuccess(req, res) {
    try {
        const query = req.query;
        if (query.error)
            throw new Error(query.error);
        const body = req.body;
        const session = (0, validation_1.requiredParam)(req['session'], 'Session object');
        const connectorId = (0, validation_1.requiredParam)(query.connectorId, 'Connector id');
        const config = (0, validation_1.requiredParam)(req.app.get('config'), 'Config object on express js APP');
        const type = (0, connectors_1.toConnectorEnum)((0, validation_1.requiredParam)(query.type, 'Connector type'));
        const connector = await (0, connectors_1.getConnector)(config, req['session'], type, connectorId);
        if (!connector)
            throw new Error('Connector not found ' + connectorId);
        if (await connector.isLoggedIn(session)) {
            console.info('User already logged in for connector ' + connectorId);
        }
        else {
            await connector.setToken(session, {
                ...query,
                ...body,
            });
        }
        res.send(getEndAuthHtml('Logged in', false, connectorId, connector.getOptions(body)));
    }
    catch (error) {
        res
            .status(validateStatus(error?.code ?? error?.httpStatusCode, 500))
            .send(getEndAuthHtml(error.message, true));
    }
}
async function routeLogout(req, res) {
    try {
        const query = req.query;
        const session = (0, validation_1.requiredParam)(req['session'], 'Session object');
        const config = (0, validation_1.requiredParam)(req.app.get('config'), 'Config object on express js APP');
        const type = (0, connectors_1.toConnectorEnum)((0, validation_1.requiredParam)(query.type, 'Connector type'));
        const connectorId = query.connectorId;
        const connector = await (0, connectors_1.getConnector)(config, session, type, connectorId);
        if (!connector)
            throw new Error(`Connector not found ${connectorId} ${type}`);
        try {
            await connector.logout(session);
            res.json({
                error: false,
                message: 'OK',
            });
        }
        catch (error) {
            console.error('Error while logging out', error);
            res.status(validateStatus(error?.code ?? error?.httpStatusCode, 500)).json({
                error: true,
                message: 'Error while logging out: ' + error.message,
            });
            return;
        }
    }
    catch (error) {
        console.error('Error in the logout request', error);
        res.status(validateStatus(error?.code ?? error?.httpStatusCode, 400)).json({
            error: true,
            message: 'Error in the logout request: ' + error.message,
        });
        return;
    }
}
function getEndAuthHtml(message, error, connectorId, options) {
    const data = {
        type: 'login',
        error,
        message,
        connectorId,
        options,
    };
    return `
    <html>
      <head>
        <script>
          if(window.opener) {
            window.opener.postMessage(${JSON.stringify(data)}, '*')
            window.close()
          } else {
            window.location.href = '/'
          }
        </script>
      </head>
      <body>
        <p>${message}</p>
        <p>Close this window or <a href="/">go back to /</a></p>
      </body>
    </html>
  `;
}
