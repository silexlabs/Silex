const fetch = require('node-fetch')
const { ServerEvent } = require('@silexlabs/silex').events
const express = require('express')
const ONBOADRDING_STEPS = require('../onboarding.json')

/**
 * @fileoverview
 * This plugin is used to store user information in brevo
 * It will start an onboarding process the first time the user logs in
 * and the first time the user publishes a website.
 */

const apiUrl = '/api/onboarding'

function getOnboarding(type, oldUser, lang) {
  const steps = ONBOADRDING_STEPS[lang]
  if(!steps) {
    console.warn('No onboarding steps for lang', lang, 'defaulting to en')
    steps = ONBOADRDING_STEPS['en']
  }
  switch(type) {
    case 'STORAGE':
      // User already in brevo
      if(oldUser) return null
      // First time no see
      return steps.STORAGE
    case 'HOSTING':
      // Something went wrong, no user found in brevo
      if(!oldUser?.attributes) return null
      // User already published
      if(oldUser.attributes.HAS_PUBLISHED) return null
      // First time publishing
      return steps.HOSTING
  }
}

async function getUserFromConnector(connectors, session) {
  for(const connector of connectors) {
    if(connector.isLoggedIn(session)) {
      const user = await connector.getUser(session)
      if(user && user.email) {
        return user
      }
    }
  }
  return null
}

async function getUserFromBrevo(email) {
  const response = await fetch(`https://api.brevo.com/v3/contacts/${email}`, {
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    }
  })
  if(response.status < 400) {
    const responseData = await response.json()
    return responseData
  } else if(response.status === 404) {
    return null
  } else {
    console.error('Error while fetching user from brevo', response.statusText, await response.text())
    throw new Error('Error while fetching user from brevo: ' + response.statusText, await response.text())
  }
}

/**
 * @returns true if the user was updated, false if the user was created
 */
async function storeUser(user, type) {
  const headers = {
    'accept': 'application/json',
    'api-key': process.env.BREVO_API_KEY,
    'content-type': 'application/json'
  }
  const data = {
    updateEnabled: true,
    email: user.email,
    attributes: {
      FIRSTNAME: user.name.split(' ')[0],
      LASTNAME: user.name.split(' ')[1],
    },
    listIds: process.env.BREVO_LIST_ID.split(',').map(id => parseInt(id)),
  }
  if(type === 'HOSTING') {
    data.attributes.HAS_PUBLISHED = true
  }

  const response = await fetch(process.env.BREVO_API_URL, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  })

  if(response.status < 400) {
    // If response is empty
    if(response.status === 204) {
      return true
    } else {
      const responseData = await response.json()
      return false
    }
  } else {
    console.error('Error while storing user in brevo', response.statusText, await response.text())
    throw new Error('Error while storing user in brevo: ' + response.statusText, await response.text())
  }
}

module.exports = async function(config, options) {
  console.info('> Silex brevo plugin starting', {options})

  // Check the environment variables
  if(!process.env.BREVO_API_KEY) {
    console.warn('No BREVO_API_KEY env variable => skipping brevo')
    return
  }
  if(!process.env.BREVO_API_URL) {
    throw new Error('No BREVO_API_URL env variable')
  }
  if(!process.env.BREVO_LIST_ID) {
    throw new Error('No BREVO_LIST_ID env variable')
  }

  // Serve the dashboard and the editor
  config.on(ServerEvent.STARTUP_START, ({app}) => {
    const editorRouter = express.Router()
    editorRouter.post(apiUrl, express.json(), async (request, response) => {
      try {
        const lang = request.headers['accept-language']
        // Get all the connectors
        const connectors = config.getConnectors()
        // Find the first connected storage connector
        const user = await getUserFromConnector(connectors, request.session)
        if(user) {
          // Get the user from brevo
          const oldUser = await getUserFromBrevo(user.email)
          // Store the user in brevo
          await storeUser(user, request.body.type)
          // Return the connector info
          response.json({
            success: true,
            onboarding: getOnboarding(request.body.type, oldUser, lang),
          })
        }
      } catch (error) {
        console.error('Error while storing user in brevo', error)
        // Ignore any error as onboarding is not critical
        response.json({success: false})
      }
    })
    app.use(editorRouter)
  })
}
