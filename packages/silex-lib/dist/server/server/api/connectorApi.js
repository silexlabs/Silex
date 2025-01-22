"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const constants_1 = require("../../constants");
const validation_1 = require("../utils/validation");
const connectors_1 = require("../connectors/connectors");
/**
 * @fileoverview The connector API adds routes to handle the connectors and the methods they implement, this includes authentication and user data.
 *
 * About authentication
 *
 * There are 2 types of connectors, for storage of website data and for publication to a hosting service. The authentication process is the same for both types of connectors
 *
 * Here is a typical authentication flow, which can be for a storage or a publication connector:
 *
 * 1. Client app calls the `user` route which returns a 401 as there is no auth in the session
 * 1. Client app lists all connectors (either for publication or storage) and display a button for each connector
 * 1. The user clicks a button, it opens a page with either the connector's `getOAuthUrl` for OAuth connectors (A) or the login route for basic auth connectors (B). This can be done in a popup (C) or as a redirect in the client app window (D)
 * 1. OAuth (A): the page displays the OAuth page which ends up going back to the callback page
 * 1. Basic auth (B): the page displays the login form `connector.getLoginForm()` which ends up going back to the callback page
 * 1. The callback page stores the auth data in the session (for storage), or in the website publication settings (for publication)
 * 1. Popup (C): The callback page will post a message to the parent window which closes the popup and goes on with the flow
 * 1. Redirect (D): The callback page will redirect to the client app
 * 1. The client side will call the `user` route again, which will return the user data
 *
 */
/**
 * Add routes to the express app
 */
function default_1(config) {
    // Create the router
    const router = (0, express_1.Router)();
    // Connector routes
    router.get(constants_1.API_CONNECTOR_USER, routeUser);
    router.get(constants_1.API_CONNECTOR_LIST, routeListConnectors);
    router.get(constants_1.API_CONNECTOR_LOGIN, routeLogin);
    // router.get(API_CONNECTOR_SETTINGS, routeSettings)
    // router.post(API_CONNECTOR_SETTINGS, routeSettingsPost)
    router.post(constants_1.API_CONNECTOR_LOGIN_CALLBACK, routeLoginSuccess);
    router.get(constants_1.API_CONNECTOR_LOGIN_CALLBACK, routeLoginSuccess);
    router.post(constants_1.API_CONNECTOR_LOGOUT, routeLogout);
    return router;
}
/**
 * Method to validate HTTP status codes
 * Returns a suitable error code if it is not valid
 */
function validateStatus(status, _default = 500) {
    if (!status) {
        console.warn(`Status code is undefined, returning default ${_default}`);
        return _default;
    }
    // Make sure it is a string
    status = parseInt(status.toString());
    // Check the status code
    if (status >= 100 && status < 600)
        return status;
    // Invalid status code
    console.warn(`Invalid status code ${status}, returning default ${_default}}`);
    return _default;
}
/**
 * Express route to check if the user is logged in
 * Returns user data and connector data
 */
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
        // User logged in, return user data
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
/**
 * Express route to list the connectors
 */
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
/**
 * Route login
 * Display the connector's login form if the connector is basic auth
 *   or redirect to oauth url if the connector is oauth
 *   or redirect to success page if the user is logged in
 */
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
        // Check if the user is already logged in
        if (await connector.isLoggedIn(session)) {
            res.redirect(`${config.url}${constants_1.API_PATH}${constants_1.API_CONNECTOR_PATH}${constants_1.API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}`);
            return;
        }
        const oauthUrl = await connector.getOAuthUrl(session);
        if (oauthUrl) {
            // Starts the OAuth flow
            res.redirect(oauthUrl);
        }
        else {
            // Display the login form
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
// /**
//  * Route connector settings
//  * Display the connector's settings form or redirect to login page if the user is not logged in
//  */
// function routeSettings(req: Request, res: Response) {
//   try {
//     const query = req.query as ApiConnectorSettingsQuery
//
//     const connectorId = requiredParam(query.connectorId, 'Connector id')
//     const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
//     const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
//     const connector = await getConnector<Connector>(config, req['session'], type, connectorId)
//     const session = requiredParam(req['session'], 'Session object')
//     if (!connector) throw new Error(`Connector not found ${connectorId} ${type}`)
//     // Check if the user is already logged in
//     if (!await connector.isLoggedIn(session)) {
//       res.redirect(`${config.url}${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}&error=Not logged in`)
//       return
//     }
//     // Display the login form
//     res.send(await connector.getSettingsForm(session, ``) as ApiConnectorSettingsResponse)
//   } catch (error) {
//     console.error('Error in the login request', error)
//     res.status(error?.code ?? error?.httpStatusCode ?? 400).json({
//       error: true,
//       message: 'Error in the login request: ' + error.message,
//     } as ApiError)
//   }
// }
//
// /**
//  * Route connector settings post
//  * Save the connector's settings in the website meta file
//  */
// function routeSettingsPost(req: Request, res: Response) {
//   try {
//     const query = req.query as ApiConnectorSettingsPostQuery
//
//     const connectorId = requiredParam(query.connectorId, 'Connector id')
//     const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
//     const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
//     const connector = await getConnector<Connector>(config, req['session'], type, connectorId)
//     const session = requiredParam(req['session'], 'Session object')
//     const body = req.body as ApiConnectorSettingsPostBody
//     if (!connector) throw new Error(`Connector not found ${connectorId} ${type}`)
//     // Check if the user is already logged in
//     if (!await connector.isLoggedIn(session)) {
//       res.redirect(`${config.url}${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}&error=Not logged in`)
//       return
//     }
//     // Save the settings
//     await connector.setWebsiteMeta(session, websiteId, body)
//   } catch (error) {
//     console.error('Error in the login request', error)
//     res.status(error?.code ?? error?.httpStatusCode ?? 400).json({
//       error: true,
//       message: 'Error in the login request: ' + error.message,
//     } as ApiResponseError)
//   }
// }
/**
 * Express route to serve as redirect after a successful login
 * The returned HTML will postMessage data and close the popup window
 */
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
        // Check if the user is already logged in
        if (await connector.isLoggedIn(session)) {
            console.info('User already logged in for connector ' + connectorId);
        }
        else {
            // Store the auth info in the session
            // This is useful for storage only
            await connector.setToken(session, {
                ...query,
                ...body,
            });
        }
        // End the auth flow
        res.send(getEndAuthHtml('Logged in', false, connectorId, type, connector.getOptions(body)));
    }
    catch (error) {
        res
            .status(validateStatus(error?.code ?? error?.httpStatusCode, 500))
            .send(getEndAuthHtml(error.message, true, req.query.connectorId, req.query.type));
    }
}
/**
 * Express route to logout from a connector
*/
async function routeLogout(req, res) {
    try {
        const query = req.query;
        const session = (0, validation_1.requiredParam)(req['session'], 'Session object');
        // Get the connector
        const config = (0, validation_1.requiredParam)(req.app.get('config'), 'Config object on express js APP');
        const type = (0, connectors_1.toConnectorEnum)((0, validation_1.requiredParam)(query.type, 'Connector type'));
        const connectorId = query.connectorId;
        const connector = await (0, connectors_1.getConnector)(config, session, type, connectorId);
        if (!connector)
            throw new Error(`Connector not found ${connectorId} ${type}`);
        try {
            // Logout
            await connector.logout(session);
            // Return success
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
/**
 * Utility function to send an HTML page to the browser
 * is page will send a postMessage to the parent window and close itself
 */
function getEndAuthHtml(message, error, connectorId, connectorType, options) {
    // Data for postMessage
    const data = {
        type: 'login', // For postMessage
        error,
        message,
        connectorId,
        connectorType,
        options,
    };
    // Determine status title and heading based on the error
    const status = error ? 'Error' : 'Success';
    // Return the HTML template
    return `
    <!DOCTYPE html><html lang="en">
      <head>
        <title>Authentication ${status}</title>
        <style>
          :root {
            --primaryColor: #333333;
            --secondaryColor: #ddd;
            --tertiaryColor: #8873FE;
            --quaternaryColor: #A291FF;
            --darkerPrimaryColor: #292929;
            --lighterPrimaryColor: #575757;
          }

          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 50px;
            color: var(--primaryColor);
            background-color: var(--secondaryColor);
          }

          h1 {
            color: var(--tertiaryColor);
          }

          p {
            font-size: 18px;
          }

          a {
            color: var(--tertiaryColor);
            text-decoration: none;
          }

          a:hover {
            text-decoration: underline;
          }

          .container {
            max-width: 600px;
            margin: auto;
          }

          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 16px;
            color: var(--secondaryColor);
            background-color: var(--tertiaryColor);
            border: none;
            border-radius: 5px;
            text-decoration: none;
            cursor: pointer;
          }

          .button:hover {
            background-color: var(--quaternaryColor); /* Slightly lighter shade of tertiary color */
          }

          .error {
            display: none;
            margin-top: 20px;
            padding: 15px;
            border: 1px solid var(--tertiaryColor);
            border-radius: 5px;
            text-wrap: wrap;
          }

        </style>
      </head>
      <body>
        <div class="container">
          <div id="message">
            <h1>Authentication ${status}</h1>
            <p>${error ? '' : message}</p>
          </div>
          ${error ? `
            <p><a data-link-to href="/">click here to continue</a>.</p>
            <a data-link-to href="/" class="button">Retry</a>
            <pre id="error-container" class="error">${message}</pre>
            <script>
              document.getElementById('error-container').style.display = "block";
              fetch("${constants_1.API_PATH}${constants_1.API_CONNECTOR_PATH}${constants_1.API_CONNECTOR_LOGOUT}?connectorId=${connectorId}&type=${connectorType}", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  credentials: 'include', // sends the cookies with the request
                },
              })
              if(window.opener && window.opener !== window) {
                const linksTo = document.querySelectorAll('[data-link-to]');
                linksTo.forEach(link => {
                  link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const data = ${JSON.stringify(data)};
                    window.opener.postMessage(data, '*');
                    window.close();
                  });
                });
              }
            </script>
          ` : `
            <p>If this window doesn’t close automatically, <a href="/">click here to return to the homepage</a>.</p>
            <a href="/" class="button">Go to Homepage</a>
            <pre id="error-container" class="error"></pre>
            <script>
              const data = ${JSON.stringify(data)};
              const errorContainer = document.getElementById('error-container');
              const messageContainer = document.getElementById('message');

              // Check if the window was opened programmatically and is valid
              if (window.opener && window.opener !== window) {
                try {
                  // Send a postMessage to the opener
                  window.opener.postMessage(data, '*');
                  // Attempt to close the window
                  window.close();
                } catch (e) {
                  // Display error message if closing fails
                  errorContainer.innerText = "Unable to close the window. Please close it manually.";
                  errorContainer.style.display = "block";
                }
              } else {
                messageContainer.innerHTML = '<h1>Redirecting, please wait...</h1>';
                window.location.href = '/'
              }
            </script>
          `}
        </div>
      </body>
    </html>
  `;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdG9yQXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9hcGkvY29ubmVjdG9yQXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBOEJBLDRCQWVDO0FBN0NELHFDQUFtRDtBQUNuRCwrQ0FBdU07QUFFdk0sb0RBQW1EO0FBQ25ELHlEQUFvRztBQUdwRzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNIOztHQUVHO0FBQ0gsbUJBQXdCLE1BQW9CO0lBQzFDLG9CQUFvQjtJQUNwQixNQUFNLE1BQU0sR0FBRyxJQUFBLGdCQUFNLEdBQUUsQ0FBQTtJQUV2QixtQkFBbUI7SUFDbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyw4QkFBa0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtJQUN6QyxNQUFNLENBQUMsR0FBRyxDQUFDLDhCQUFrQixFQUFFLG1CQUFtQixDQUFDLENBQUE7SUFDbkQsTUFBTSxDQUFDLEdBQUcsQ0FBQywrQkFBbUIsRUFBRSxVQUFVLENBQUMsQ0FBQTtJQUMzQyxvREFBb0Q7SUFDcEQseURBQXlEO0lBQ3pELE1BQU0sQ0FBQyxJQUFJLENBQUMsd0NBQTRCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQTtJQUM1RCxNQUFNLENBQUMsR0FBRyxDQUFDLHdDQUE0QixFQUFFLGlCQUFpQixDQUFDLENBQUE7SUFDM0QsTUFBTSxDQUFDLElBQUksQ0FBQyxnQ0FBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUU5QyxPQUFPLE1BQU0sQ0FBQTtBQUNmLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGNBQWMsQ0FBQyxNQUFjLEVBQUUsUUFBUSxHQUFHLEdBQUc7SUFDcEQsSUFBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQywrQ0FBK0MsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUN2RSxPQUFPLFFBQVEsQ0FBQTtJQUNqQixDQUFDO0lBQ0QsMkJBQTJCO0lBQzNC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