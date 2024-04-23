const apiUrl = '/api/onboarding'

async function hook(type, lang) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': lang,
    },
    body: JSON.stringify({
      type,
    })
  })
  console.log('onboarding hook', response)
  if(response.status < 400) {
    const responseData = await response.json()
    return responseData.onboarding
  } else {
    console.error('Error while fetching user from brevo', response.statusText, response.status)
    return null
  }
}

function notify(editor, onboarding) {
  if(!onboarding) return
  const { title, content } = onboarding
  editor.runCommand("notifications:add", {
    type: 'info',
    message: `
      <marquee
        style="width: calc(100% - 25px);"
      >${title}</marquee>
      <p>${content}</p>
    `,
  })
}

export default async (config) => {
  // After init
  config.on('silex:grapesjs:end', async ({ editor }) => {
    notify(editor, await hook('STORAGE', config.lang))
    editor.on('silex:publish:end', async ({success}) => {
      if(success) {
        notify(editor, await hook('HOSTING', config.lang))
      }
    })
  })
}