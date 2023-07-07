import { Response, Router } from 'express'
import { API_CONNECTOR_LIST, API_CONNECTOR_LOGIN_CALLBACK, API_CONNECTOR_USER, API_CONNECTOR_LOGOUT } from '../../constants'
import { ServerConfig } from '../config'
import { requiredParam } from '../utils/validation'
import { Connector, getConnector, toConnectorData, toConnectorEnum } from '../connectors/connectors'
import { ApiConnectorListQuery, ApiConnectorListResponse, ApiConnectorLoggedInPostMessage, ApiConnectorLoginQuery, ApiConnectorUserQuery, ApiConnectorUserResponse, ApiConnectorLogoutQuery, ApiError, ConnectorId, ConnectorType } from '../../types'

/**
 * Add routes to the express app
 */
export default function(config: ServerConfig) {
  // Create the router
  const router = Router()

  // Connector routes
  router.get(API_CONNECTOR_USER, routeUser)
  router.get(API_CONNECTOR_LIST, routeListConnectors)
  router.post(API_CONNECTOR_LOGOUT, routeLogout)
  router.get(API_CONNECTOR_LOGIN_CALLBACK, routeLoginSuccess)

  return router
}

/**
 * Express route to check if the user is logged in
 * Returns user data and connector data
 */
async function routeUser(req, res) {
  console.log('routeUser', req, res)
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
          message: 'No connector found',
        } as ApiError)
      return
    }
    if(!await connector.isLoggedIn(session)) {
      res
        .status(401)
        .json({
          error: true,
          message: 'Not logged in',
        } as ApiError)
      return
    }
    const user = await connector.getUserData(session)
    res.json(user as ApiConnectorUserResponse)
  } catch (error) {
    console.error('Error in the login status request', error)
    res.status(error?.code ?? 500).json({
      error: true,
      message: error.message,
    } as ApiError)
  }
}

/**
 * Express route to list the connectors
 */
async function routeListConnectors(req, res) {
  try {
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const query = req.query as ApiConnectorListQuery
    const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
    const connectors = config.getConnectors<Connector>(type)
    try {
      const list = await Promise.all(connectors.map(async connector => toConnectorData(req['session'], connector)))
      res.json(list as ApiConnectorListResponse)
    } catch (error) {
      console.error('Error while listing connectors', error)
      res.status(error?.code ?? 500).json({
        error: true,
        message: 'Error while listing connectors: ' + error.message,
      } as ApiError)
    }
  } catch (error) {
    console.error('Error in the list connectors request', error)
    res.status(error?.code ?? 400).json({
      error: true,
      message: 'Error in the list connectors request: ' + error.message,
    } as ApiError)
  }
}

/**
 * Utility function to send an HTML page to the browser
 * is page will send a postMessage to the parent window and close itself
 */
function sendHtml(res: Response, message: string, connectorId?: ConnectorId, error?: Error, defaultErrorCode?: number) {
  error && console.error('Error while logging in', error)
  // Data for postMessage
  const data = {
    type: 'login', // For postMessage
    error: error ? true : false,
    message,
    connectorId,
  } as ApiConnectorLoggedInPostMessage
  // HTTP status code
  const status = error ? error['code'] ?? defaultErrorCode ?? 500 : 200
  // Send the HTML
  res
    .status(status)
    .send(`
        <html>
          <head>
            <script>
              window.opener.postMessage(${JSON.stringify(data)}, '*')
              window.close()
            </script>
          </head>
          <body>
            <p>${message}</p>
            <p>Close this window</p>
          </body>
        </html>
      `)
}

/**
 * Express route to serve as redirect after a successful login
 * The returned HTML will postMessage data and close the popup window
 */
async function routeLoginSuccess(req, res) {
  try {
    const query = req.query as ApiConnectorLoginQuery
    if(query.error) throw new Error(query.error)

    const connectorId = requiredParam(query.connectorId, 'Connector id')
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
    const connector = await getConnector<Connector>(config, req['session'], type, connectorId)
    if (!connector) throw new Error('Connector not found ' + connectorId)
    try {
      sendHtml(res, 'Logged in', connectorId)
    } catch (error) {
      sendHtml(res, 'Error while logging in', undefined, error, 500)
    }
  } catch (error) {
    sendHtml(res, 'Error in the request ' + error.message, undefined, error, 400)
  }
}

/**
 * Express route to logout from a connector
 */
async function routeLogout(req, res) {
  try {
    const query = req.query as ApiConnectorLogoutQuery
    // Get the connector
    const config = requiredParam(req.app.get('config') as ServerConfig, 'Config object on express js APP')
    const type = toConnectorEnum(requiredParam(query.type, 'Connector type'))
    const connectorId = query.connectorId
    const connector = await getConnector<Connector>(config, req['session'], type, connectorId)
    if (!connector) throw new Error(`Connector not found ${connectorId} ${type}`)
    try {
      // Logout
      await connector.logout(req['session'])
      // Return success
      res.json({
        error: false,
        message: 'OK',
      } as ApiError)
    } catch (error) {
      console.error('Error while logging out', error)
      res.status(error?.code ?? 500).json({
        error: true,
        message: 'Error while logging out: ' + error.message,
      } as ApiError)
      return
    }
  } catch (error) {
    console.error('Error in the logout request', error)
    res.status(error?.code ?? 400).json({
      error: true,
      message: 'Error in the logout request: ' + error.message,
    } as ApiError)
    return
  }
}
