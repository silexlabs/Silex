import { Request, Response, Router } from 'express'
import { API_CONNECTOR_LIST, API_CONNECTOR_LOGIN_CALLBACK, API_CONNECTOR_USER, API_CONNECTOR_LOGOUT, API_CONNECTOR_LOGIN, API_CONNECTOR_SETTINGS, API_PATH, API_CONNECTOR_PATH } from '../../constants'
import { ServerConfig } from '../config'
import { requiredParam } from '../utils/validation'
import { Connector, getConnector, toConnectorData, toConnectorEnum } from '../connectors/connectors'
import { ApiConnectorListQuery, ApiConnectorListResponse, ApiConnectorLoggedInPostMessage, ApiConnectorLoginQuery, ApiConnectorUserQuery, ApiConnectorUserResponse, ApiConnectorLogoutQuery, ConnectorId, ApiConnectorLoginCbkQuery, ApiConnectorLoginCbkBody, ConnectorOptions, ApiResponseError, ConnectorType } from '../../types'

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
export default function(config: ServerConfig) {
  // Create the router
  const router = Router()

  // Connector routes
  router.get(API_CONNECTOR_USER, routeUser)
  router.get(API_CONNECTOR_LIST, routeListConnectors)
  router.get(API_CONNECTOR_LOGIN, routeLogin)
  // router.get(API_CONNECTOR_SETTINGS, routeSettings)
  // router.post(API_CONNECTOR_SETTINGS, routeSettingsPost)
  router.post(API_CONNECTOR_LOGIN_CALLBACK, routeLoginSuccess)
  router.get(API_CONNECTOR_LOGIN_CALLBACK, routeLoginSuccess)
  router.post(API_CONNECTOR_LOGOUT, routeLogout)

  return router
}

/**
 * Method to validate HTTP status codes
 * Returns a suitable error code if it is not valid
 */
function validateStatus(status: number | string, _default = 500): number {
  if(!status) {
    console.warn(`Status code is undefined, returning default ${_default}`)
    return _default
  }
  switch (status) {
  case 'ETIMEDOUT':
  case 'ECONNREFUSED':
  case 'ECONNRESET':
    console.warn(`Connection error ${status}, returning default ${_default}`)
    return _default
  }
  // Make sure it is a number
  const statusNum = parseInt(status.toString())
  // Check the status code
  if (statusNum >= 100 && statusNum < 600) return statusNum
  // Invalid status code
  console.warn(`Invalid status code ${statusNum} (${status.toString()}, ${status}), returning default ${_default}`)
  return _default
}

/**
 * Express route to check if the user is logged in
 * Returns user data and connector data
 */
async function routeUser(req: Request, res: Response) {
  try {
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const session = requiredParam(req['session'], 'Session object')
    const query = req.query as ApiConnectorUserQuery
    const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
    const connector = await getConnector<Connector>(config, session, type, query.connectorId)
    if (!connector) {
      res
        .status(500)
        .json({
          error: true,
          message: `Connector not found: ${type} ${query.connectorId}`,
        } as ApiResponseError)
      return
    }
    if(!await connector.isLoggedIn(session)) {
      res
        .status(401)
        .json({
          error: true,
          message: 'Not logged in',
        } as ApiResponseError)
      return
    }
    // User logged in, return user data
    const user = await connector.getUser(session)
    res.json(user as ApiConnectorUserResponse)
  } catch (error) {
    console.error('Error in the user request', error, error.code)
    res.status(validateStatus(error.code ?? error.httpStatusCode, 500)).json({
      error: true,
      message: error.message,
    } as ApiResponseError)
  }
}

/**
 * Express route to list the connectors
 */
async function routeListConnectors(req: Request, res: Response) {
  try {
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const session = requiredParam(req['session'], 'Session object')
    const query = req.query as ApiConnectorListQuery
    const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
    const connectors = config.getConnectors(type)
    try {
      const list = await Promise.all(connectors.map(async connector => toConnectorData(session, connector)))
      res.json(list as ApiConnectorListResponse)
    } catch (error) {
      console.error('Error while listing connectors', error)
      res.status(validateStatus(error?.code ?? error?.httpStatusCode, 500)).json({
        error: true,
        message: 'Error while listing connectors: ' + error.message,
      } as ApiResponseError)
    }
  } catch (error) {
    console.error('Error in the list connectors request', error)
    res.status(validateStatus(error?.code ?? error?.httpStatusCode, 400)).json({
      error: true,
      message: 'Error in the list connectors request: ' + error.message,
    } as ApiResponseError)
  }
}

/**
 * Route login
 * Display the connector's login form if the connector is basic auth
 *   or redirect to oauth url if the connector is oauth
 *   or redirect to success page if the user is logged in
 */
async function routeLogin(req: Request, res: Response) {
  try {
    const query = req.query as ApiConnectorLoginQuery
    const connectorId = requiredParam(query.connectorId, 'Connector id')
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
    const connector = await getConnector<Connector>(config, req['session'], type, connectorId)
    const session = requiredParam(req['session'], 'Session object')
    if (!connector) throw new Error(`Connector not found ${connectorId} ${type}`)
    // Check if the user is already logged in
    if (await connector.isLoggedIn(session)) {
      res.redirect(`${config.url}${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}`)
      return
    }
    const oauthUrl = await connector.getOAuthUrl(session)
    if (oauthUrl) {
      // Starts the OAuth flow
      res.redirect(oauthUrl)
    } else {
      // Display the login form
      const redirectTo = await connector.getSettingsForm(session, '') ?
        `${config.url}${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_SETTINGS}?connectorId=${connectorId}&type=${type}` :
        `${config.url}${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}`
      res.send(await connector.getLoginForm(session, redirectTo))
    }
  } catch (error) {
    console.error('Error in the login request', error)
    res.status(validateStatus(error?.code ?? error?.httpStatusCode, 400)).json({
      error: true,
      message: 'Error in the login request: ' + error.message,
    } as ApiResponseError)
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
async function routeLoginSuccess(req: Request, res: Response) {
  try {
    const query = req.query as ApiConnectorLoginCbkQuery
    if (query.error) throw new Error(query.error)

    const body = req.body as ApiConnectorLoginCbkBody
    const session = requiredParam(req['session'], 'Session object')

    const connectorId = requiredParam(query.connectorId, 'Connector id')
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
    const connector = await getConnector<Connector>(config, req['session'], type, connectorId)
    if (!connector) throw new Error('Connector not found ' + connectorId)
    // Check if the user is already logged in
    if (await connector.isLoggedIn(session)) {
      console.info('User already logged in for connector ' + connectorId)
    } else {
      // Store the auth info in the session
      // This is useful for storage only
      await connector.setToken(session, {
        ...query,
        ...body,
      })
    }
    // End the auth flow
    res.send(getEndAuthHtml('Logged in', false, connectorId, type, connector.getOptions(body)))
  } catch (error) {
    console.error('Error in the login callback', error, error?.code, error?.httpStatusCode)
    res
      .status(validateStatus(error?.code ?? error?.httpStatusCode, 500))
      .send(getEndAuthHtml(`${error?.message} ${error?.code ?? error?.httpStatusCode}`, true, req.query.connectorId as ConnectorId, req.query.type as ConnectorType))
  }
}

/**
 * Express route to logout from a connector
*/
async function routeLogout(req: Request, res: Response) {
  try {
    const query = req.query as ApiConnectorLogoutQuery
    const session = requiredParam(req['session'], 'Session object')
    // Get the connector
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
    const connectorId = query.connectorId
    const connector = await getConnector<Connector>(config, session, type, connectorId)
    if (!connector) throw new Error(`Connector not found ${connectorId} ${type}`)
    try {
      // Logout
      await connector.logout(session)
      // Return success
      res.json({
        error: false,
        message: 'OK',
      } as ApiResponseError)
    } catch (error) {
      console.error('Error while logging out', error)
      res.status(validateStatus(error?.code ?? error?.httpStatusCode, 500)).json({
        error: true,
        message: 'Error while logging out: ' + error.message,
      } as ApiResponseError)
      return
    }
  } catch (error) {
    console.error('Error in the logout request', error)
    res.status(validateStatus(error?.code ?? error?.httpStatusCode, 400)).json({
      error: true,
      message: 'Error in the logout request: ' + error.message,
    } as ApiResponseError)
    return
  }
}

/**
 * Utility function to send an HTML page to the browser
 * is page will send a postMessage to the parent window and close itself
 */
function getEndAuthHtml(message: string, error: boolean, connectorId: ConnectorId, connectorType: ConnectorType, options?: ConnectorOptions): string {
  // Data for postMessage
  const data = {
    type: 'login', // For postMessage
    error,
    message,
    connectorId,
    connectorType,
    options,
  } as ApiConnectorLoggedInPostMessage
  // Determine status title and heading based on the error
  const status = error ? 'Error' : 'Success'
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
          ${ error ? `
            <p><a data-link-to href="/">click here to continue</a>.</p>
            <a data-link-to href="/" class="button">Retry</a>
            <pre id="error-container" class="error">${message}</pre>
            <script>
              document.getElementById('error-container').style.display = "block";
              fetch("${ API_PATH }${ API_CONNECTOR_PATH }${ API_CONNECTOR_LOGOUT }?connectorId=${ connectorId }&type=${ connectorType }", {
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
  `
}
