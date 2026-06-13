const apiUrl = '/api/onboarding'

async function hook(type, lang, rgpdAllowFeedback, rgpdAllowNewsletter) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': lang,
    },
    body: JSON.stringify({
      type,
      lang,
      rgpdAllowFeedback,
      rgpdAllowNewsletter,
    })
  })
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
  const { rgpdAllowFeedback, rgpdAllowNewsletter } = getRgpdValues()
  config.on('silex:grapesjs:end', async ({ editor }) => {
    notify(editor, await hook('STORAGE', config.lang, rgpdAllowFeedback, rgpdAllowNewsletter))
    editor.on('silex:publish:end', async ({success}) => {
      if(success) {
        notify(editor, await hook('HOSTING', config.lang, rgpdAllowFeedback, rgpdAllowNewsletter))
      }
    })
  })
}

function getRgpdValues() {
  try {
    const rgpdAllowFeedback = localStorage.getItem('feedback') ?? 'false'
    const rgpdAllowNewsletter = localStorage.getItem('nl') ?? 'false'
    return {
      rgpdAllowFeedback: rgpdAllowFeedback === 'true',
      rgpdAllowNewsletter: rgpdAllowNewsletter === 'true',
    }
  } catch(e) {
    return {
      rgpdAllowFeedback: false,
      rgpdAllowNewsletter: false,
    }
  }
}
