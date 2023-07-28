import { Request, Response, Router } from 'express'
import { API_CONNECTOR_LIST, API_CONNECTOR_LOGIN_CALLBACK, API_CONNECTOR_USER, API_CONNECTOR_LOGOUT, API_CONNECTOR_LOGIN, API_CONNECTOR_SETTINGS, API_PATH, API_CONNECTOR_PATH } from '../../constants'
import { ServerConfig } from '../config'
import { requiredParam } from '../utils/validation'
import { Connector, getConnector, toConnectorData, toConnectorEnum } from '../connectors/connectors'
import { ApiConnectorListQuery, ApiConnectorListResponse, ApiConnectorLoggedInPostMessage, ApiConnectorLoginQuery, ApiConnectorUserQuery, ApiConnectorUserResponse, ApiConnectorLogoutQuery, ConnectorId, ApiConnectorLoginCbkQuery, ApiConnectorLoginCbkBody, ConnectorOptions, ApiResponseError } from '../../types'

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
function validateStatus(status: number, _default = 500): number {
  if(!status) {
    console.warn(`Status code is undefined, returning default ${_default}`)
    return _default
  }
  // Make sure it is a string
  status = parseInt(status.toString())
  // Check the status code
  if (status >= 100 && status < 600) return status
  // Invalid status code
  console.warn(`Invalid status code ${status}, returning default ${_default}}`)
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
    console.error('Error in the login status request', error)
    res.status(validateStatus(error?.code ?? error?.httpStatusCode, 500)).json({
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
      res.redirect(`${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}`)
      return
    }
    const oauthUrl = await connector.getOAuthUrl(session)
    if (oauthUrl) {
      // Starts the OAuth flow
      res.redirect(oauthUrl)
    } else {
      // Display the login form
      const redirectTo = await connector.getSettingsForm(session, '') ?
        `${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_SETTINGS}?connectorId=${connectorId}&type=${type}` :
        `${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}`
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
//       res.redirect(`${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}&error=Not logged in`)
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
//       res.redirect(`${API_PATH}${API_CONNECTOR_PATH}${API_CONNECTOR_LOGIN_CALLBACK}?connectorId=${connectorId}&type=${type}&error=Not logged in`)
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
    if(query.error) throw new Error(query.error)

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
    res.send(getEndAuthHtml('Logged in', false, connectorId, connector.getOptions(body)))
  } catch (error) {
    res
      .status(validateStatus(error?.code ?? error?.httpStatusCode, 500))
      .send(getEndAuthHtml(error.message, true))
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
function getEndAuthHtml(message: string, error: boolean, connectorId?: ConnectorId, options?: ConnectorOptions): string {
  // Data for postMessage
  const data = {
    type: 'login', // For postMessage
    error,
    message,
    connectorId,
    options,
  } as ApiConnectorLoggedInPostMessage
  // Send the HTML
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
  `
}
