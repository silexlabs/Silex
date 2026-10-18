import { expect, jest, beforeEach, afterEach, it, describe } from '@jest/globals'
import { ServerConfig } from '~/server/config'
import { ApiError } from '~/common/types'
import GitlabConnector from './GitlabConnector'

const TEMPLATE_PATH = 'silex-templates/silex_devdocs-template'
const TEMPLATE_API_URL = 'https://gitlab.com/api/v4/projects/silex-templates%2Fsilex_devdocs-template'
const TEMPLATE_REPO_URL = 'https://gitlab.com/silex-templates/silex_devdocs-template.git'
const ACCESS_TOKEN = 'dummy-access-token'
const NEW_PROJECT_ID = 42

const fetchMock = jest.fn<typeof fetch>()
const realFetch = global.fetch

const session = {
  gitlab: {
    token: { access_token: ACCESS_TOKEN },
  },
}

function jsonResponse(body: unknown, status = 200, statusText = 'OK'): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'content-type': 'application/json' },
  })
}

function createConnector(domain: string): GitlabConnector {
  return new GitlabConnector({} as ServerConfig, {
    clientId: 'dummy client id',
    clientSecret: 'dummy client secret',
    domain,
  })
}

type Route = [method: string, url: string, response: () => Response]

// Route each mocked request by method and URL (without the query string), so the tests read like the GitLab API
function mockGitlab(routes: Route[]) {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    const route = routes.find(([m, u]) => m === method && url.split('?')[0] === u)
    if (!route) throw new Error(`Unexpected request ${method} ${url}`)
    return route[2]()
  })
}

function requests(): Array<{ method: string, url: string, body?: any }> {
  return fetchMock.mock.calls.map(([input, init]) => ({
    method: init?.method ?? 'GET',
    url: String(input),
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  }))
}

beforeEach(() => {
  global.fetch = fetchMock as typeof fetch
  fetchMock.mockReset()
  // The connector logs every API error, keep the test output readable
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
  global.fetch = realFetch
  jest.restoreAllMocks()
})

describe('GitlabConnector forkWebsite on gitlab.com', () => {
  const DOMAIN = 'https://gitlab.com'
  let connector: GitlabConnector

  beforeEach(() => {
    connector = createConnector(DOMAIN)
  })

  it('forks the project and waits for the fork to finish', async () => {
    mockGitlab([
      ['GET', `${TEMPLATE_API_URL}`, () => jsonResponse({ id: 1, name: 'silex_devdocs-template' })],
      ['POST', `${TEMPLATE_API_URL}/fork`, () => jsonResponse({ id: NEW_PROJECT_ID, import_status: 'scheduled' })],
      ['GET', `${DOMAIN}/api/v4/projects/${NEW_PROJECT_ID}`, () => jsonResponse({ id: NEW_PROJECT_ID, import_status: 'finished' })],
    ])

    await expect(connector.forkWebsite(session, TEMPLATE_PATH)).resolves.toBe(String(NEW_PROJECT_ID))

    const calls = requests()
    expect(calls.map(({ method, url }) => `${method} ${url.split('?')[0]}`)).toEqual([
      `GET ${TEMPLATE_API_URL}`,
      `POST ${TEMPLATE_API_URL}/fork`,
      `GET ${DOMAIN}/api/v4/projects/${NEW_PROJECT_ID}`,
    ])
    // Every call is made with the user's token, on gitlab.com
    calls.forEach(({ url }) => expect(url).toContain(`access_token=${ACCESS_TOKEN}`))
    // The fork request is unchanged
    expect(calls[1].body).toEqual({
      name: expect.stringMatching(/^silex_devdocs-template \d{4}-\d{2}-\d{2} [a-z0-9]*$/),
      path: expect.stringMatching(/^silex_devdocs-template-\d{4}-\d{2}-\d{2}-?[a-z0-9]*$/),
      visibility: 'private',
    })
    expect(calls[1].body).not.toHaveProperty('import_url')
  })
})

describe('GitlabConnector forkWebsite on another GitLab instance', () => {
  const DOMAIN = 'https://framagit.org'
  const CREATE_PROJECT_URL = `${DOMAIN}/api/v4/projects/`
  const NEW_PROJECT_URL = `${DOMAIN}/api/v4/projects/${NEW_PROJECT_ID}`
  let connector: GitlabConnector

  const templateRoute: Route = ['GET', `${TEMPLATE_API_URL}`, () => jsonResponse({
    id: 1,
    name: 'silex_devdocs-template',
    http_url_to_repo: TEMPLATE_REPO_URL,
  })]

  beforeEach(() => {
    connector = createConnector(DOMAIN)
  })

  it('creates the project from the template URL instead of forking', async () => {
    mockGitlab([
      templateRoute,
      ['POST', CREATE_PROJECT_URL, () => jsonResponse({ id: NEW_PROJECT_ID, import_status: 'scheduled' })],
      ['GET', NEW_PROJECT_URL, () => jsonResponse({ id: NEW_PROJECT_ID, import_status: 'finished' })],
    ])

    await expect(connector.forkWebsite(session, TEMPLATE_PATH)).resolves.toBe(String(NEW_PROJECT_ID))

    const calls = requests()
    expect(calls.map(({ method, url }) => `${method} ${url.split('?')[0]}`)).toEqual([
      `GET ${TEMPLATE_API_URL}`,
      `POST ${DOMAIN}/api/v4/projects/`,
      `GET ${DOMAIN}/api/v4/projects/${NEW_PROJECT_ID}`,
    ])
    // The template is read from gitlab.com anonymously, the user's token never leaves their instance
    expect(calls[0].url).not.toContain('access_token')
    expect(calls[1].url).toContain(`access_token=${ACCESS_TOKEN}`)
    expect(calls[2].url).toContain(`access_token=${ACCESS_TOKEN}`)
    // The project is created with the "Repository by URL" import
    expect(calls[1].body).toEqual({
      name: expect.stringMatching(/^silex_devdocs-template \d{4}-\d{2}-\d{2} [a-z0-9]*$/),
      path: expect.stringMatching(/^silex_devdocs-template-\d{4}-\d{2}-\d{2}-?[a-z0-9]*$/),
      visibility: 'private',
      import_url: TEMPLATE_REPO_URL,
    })
    expect(calls.some(({ url }) => url.includes('/fork'))).toBe(false)
  })

  it('reports when the instance has the "Repository by URL" import source disabled', async () => {
    // What GitLab answers when the git import source is disabled
    mockGitlab([
      templateRoute,
      ['POST', CREATE_PROJECT_URL, () => jsonResponse({ message: '403 Forbidden' }, 403, 'Forbidden')],
    ])

    const error = await connector.forkWebsite(session, TEMPLATE_PATH).catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.httpStatusCode).toBe(403)
    expect(error.message).toMatch(`the "Repository by URL" import source is disabled on ${DOMAIN}`)
    expect(error.message).toMatch('Ask the administrator')
    // Nothing to wait for
    expect(requests().filter(({ url }) => url.startsWith(NEW_PROJECT_URL))).toHaveLength(0)
  })
})
