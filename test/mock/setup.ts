import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'
import { LOGIN_API, USER_STATE_CHECK_API, USER_STATE_CHECK_API_WITH_EMPTY_REDIRECT, VALID_CODE, VALID_TOKEN } from './utils'

const posts = [
  {
    userId: 1,
    id: 1,
    title: 'first post title',
    body: 'first post body',
  },
  // ...
]

export const handlers = [
  ...['get', 'post'].map((method) => {
    const fn = method === 'get' ? http.get : http.post

    return fn(LOGIN_API, async ({ request }) => {
      let code: string | null
      let state: string | null
      if (method === 'get') {
        const url = new URL(request.url)
        code = url.searchParams.get('code')
        state = url.searchParams.get('state')
      }
      else {
        const body = await request.json() as { code?: string, state?: string }
        code = body?.code ?? null
        state = body?.state ?? null
      }

      if (code === VALID_CODE) {
        return HttpResponse.json({
          token: VALID_TOKEN,
          state,
          message: 'Login success',
        })
      }

      // 401 Unauthorized
      return HttpResponse.json({ message: 'Login failed' }, { status: 401 })
    })
  }),
]

function getNotLoggedInResponse(api: string): HttpResponse {
  return new HttpResponse('Not logged in.', {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'url-redirect': api === USER_STATE_CHECK_API ? 'https://authorization-server.com' : '',
    },
  })
}

for (const api of [USER_STATE_CHECK_API, USER_STATE_CHECK_API_WITH_EMPTY_REDIRECT]) {
  handlers.push(...[http.get, http.post].map(fn => fn(api, ({ request }) => {
    const Authorization = request.headers.get('Authorization')
    if (Authorization !== VALID_TOKEN)
      return getNotLoggedInResponse(api)

    return HttpResponse.json({ message: 'Already logged in, return data', data: posts })
  })))
}

const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

//  Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())
