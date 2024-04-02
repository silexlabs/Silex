const apiUrl = '/api/onboarding'

async function hook(type) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  if(editor.Notification) {
    const {title, content} = onboarding
    editor.Notification.add({
      type: 'info',
      title,
      content,
    })
  } else {
    console.warn('Notification not available', onboarding)
  }
}

export default async (config) => {
  // After init
  config.on('silex:grapesjs:end', async ({ editor }) => {
    notify(editor, await hook('STORAGE'))
    editor.on('silex:publish:end', async ({success}) => {
      if(success) {
        notify(editor, await hook('HOSTING'))
      }
    })
  })
}