const fetch = require('node-fetch')
const { ServerEvent } = require('@silexlabs/silex').events
const express = require('express')
const ONBOADRDING_STEPS = require('../onboarding.json')

/**
 * @fileoverview
 * This plugin is used to store user information in db
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
      // User already in db
      if(oldUser) return null
      // First time no see
      return steps.STORAGE
    case 'HOSTING':
      // Something went wrong, no user found in db
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

const nocoUrl = process.env.NOCO_URL
const nocoTableName = process.env.NOCO_TABLE
const nocoApiKey = process.env.NOCO_API_KEY

async function loadUserFromDatabase(email) {
  try {
    const limit = 1
    const where = `where=(email,eq,${encodeURIComponent(email)})`
    const url = `${nocoUrl}/api/v2/tables/${nocoTableName}/records?${where}&limit=${limit}`

    const response = await fetch(url, {
      "headers": {
        "xc-token": `${ nocoApiKey }`,
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      },
      "method": "GET",
    })

    if (response.status < 400) {
      const responseData = await response.json();
      if (responseData.list && responseData.list.length > 0) {
        return responseData.list[0]; // Return the first user if found
      } else {
        return null; // Return null if no user is found
      }
    } else {
      const errorText = await response.text();
      console.error('Error while fetching user from NocoDB', response.status, response.statusText, errorText);
      throw new Error(`Error while fetching user from NocoDB: ${ response.statusText } - ${ errorText }`);
    }
  } catch (error) {
    console.error('Error in loadUserFromDatabase:', error);
    throw error;
  }
}

function getCurrentDateForMySQL() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = today.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * @returns true if the user was updated, false if the user was created
 */
async function saveUserToDatabase(user, type, lang, rgpdAllowFeedback, rgpdAllowNewsletter) {
  const headers = {
    'accept': 'application/json',
    'xc-token': process.env.NOCO_API_KEY,
    'content-type': 'application/json',
  };

  // Check if the user already exists
  const existingUser = await loadUserFromDatabase(user.email);
  const [first_name, last_name] = user.name.split(' ');

  if (existingUser) {
    const updated = getCurrentDateForMySQL()
    // Update the existing user
    const updateData = {
      Id: existingUser.Id,
      name: user.name,
      last_name,
      first_name,
      updated,
      lang,
      rgpdAllowFeedback,
      rgpdAllowNewsletter,
      ...(type === 'HOSTING' && !existingUser.date_first_published && { date_first_published: updated }), // Conditional attribute
    };

    const response = await fetch(`${process.env.NOCO_URL}/api/v2/tables/${process.env.NOCO_TABLE}/records/`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({
        ...updateData,
      }),
    });

    if (response.status < 400) {
      return true;
    } else {
      console.error('Error while updating user in NocoDB', response.statusText, await response.text());
      throw new Error('Error while updating user in NocoDB: ' + response.statusText);
    }
  } else {
    const updated = getCurrentDateForMySQL()
    // Create a new user
    const createData = {
      email: user.email,
      name: user.name,
      last_name,
      first_name,
      updated,
      lang,
      rgpdAllowFeedback,
      rgpdAllowNewsletter,
      ...(type === 'HOSTING' && { date_first_published: updated }), // Conditional attribute
    };

    const response = await fetch(`${process.env.NOCO_URL}/api/v2/tables/${process.env.NOCO_TABLE}/records`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(createData),
    });

    if (response.status < 400) {
      return false;
    } else {
      console.error('Error while creating user in NocoDB', response.statusText, await response.text());
      throw new Error('Error while creating user in NocoDB: ' + response.statusText);
    }
  }
}


module.exports = async function(config, options) {
  console.info('> Silex onboarding plugin starting', {options})

  // Check the environment variables
  if(!['NOCO_URL', 'NOCO_API_KEY', 'NOCO_TABLE'].every(env => process.env[env])) {
    console.warn('Missing NOCODB env variables => NOCODB off')
    return
  }

  // Serve the dashboard and the editor
  config.on(ServerEvent.STARTUP_START, ({app}) => {
    const editorRouter = express.Router()
    editorRouter.post(apiUrl, express.json(), async (request, response) => {
      try {
        const { rgpdAllowFeedback, rgpdAllowNewsletter } = request.body
        console.log('Onboarding request', {rgpdAllowFeedback, rgpdAllowNewsletter})
        // Removed this check as we need to be able to update someone who now refuses RGPD
        // if(!rgpdAllowFeedback && !rgpdAllowNewsletter) {
        //   console.warn('User did not accept RGPD')
        //   return response.json({success: false})
        // }

        // Get all the connectors
        const connectors = config.getConnectors()
        // Find the first connected storage connector
        const user = await getUserFromConnector(connectors, request.session)
        if(user) {
          // Get the user from db
          const oldUser = await loadUserFromDatabase(user.email)
          // Store the user in db
          await saveUserToDatabase(user, request.body.type, request.body.lang, rgpdAllowFeedback, rgpdAllowNewsletter)
          // Return the connector info
          response.json({
            success: true,
            onboarding: getOnboarding(request.body.type, oldUser, request.body.lang),
          })
        }
      } catch (error) {
        console.error('Error while storing user in db', error)
        // Ignore any error as onboarding is not critical
        response.json({success: false})
      }
    })
    app.use(editorRouter)
  })
}
