import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'
import { LOGIN_API, USER_STATE_CHECK_API, VALID_CODE, VALID_TOKEN } from './utils'

const posts = [
  {
    userId: 1,
    id: 1,
    title: 'first post title',
    body: 'first post body',
  },
  // ...
]

const notLoggedInResponse = new HttpResponse('Not logged in.', {
  status: 401,
  headers: {
    'Content-Type': 'application/json',
    'url-redirect': 'https://authorization-server.com',
  },
})

export const handlers = [
  ...[http.get, http.post].map(fn => fn(USER_STATE_CHECK_API, ({ request }) => {
    const Authorization = request.headers.get('Authorization')
    if (Authorization !== VALID_TOKEN)
      return notLoggedInResponse

    return HttpResponse.json({ message: 'Already logged in, return data', data: posts })
  })),

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

const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

//  Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())
