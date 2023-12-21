import type { ConfigOptions } from './types'
import { delCookie } from './utils'

/**
 * Create OAuth2 flow with config
 */
export default async function oauth2CodeViaBackend(config: ConfigOptions): Promise<{
  status: number
  message: string
  data?: any
}> {
  const {
    token = '',
    userStateCheckAPI,
    loginAPI,
    jumpingCallback = () => {
      // eslint-disable-next-line no-console
      console.log('jumping to Authorization page...')
    },
  } = config

  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  if (code) {
    const response = await fetch(loginAPI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
      }),
    })
    const { status } = response
    if (status === 200) {
      const loginInfo = await response.json()
      window.location.href = localStorage.getItem('originalUrl') ?? ''
      return { status, message: 'Login success', data: loginInfo }
    }

    return { status, message: 'Login failed' }
  }

  const response = await fetch(userStateCheckAPI, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  })
  const { status, headers } = response

  // 401 Unauthorized, 302 Found, 200 OK
  // To achieve compatibility with different backend implementations, we need to check the status code.
  if (status !== 200 && status !== 302 && status !== 401)
    return { status, message: 'Something went wrong when checking user\'s state', data: response.json() }

  if (headers.has('url-redirect') || status === 302 || status === 401) {
    delCookie()
    localStorage.clear()
    localStorage.setItem('originalUrl', window.location.href)
    if (status === 200 || status === 401) {
      jumpingCallback()
      window.location.href = headers.get('url-redirect') ?? ''
    }
    // unified status code to 302, so the end user can easily judge the user's login status.
    return {
      status: 302,
      message: 'Redirecting to Authorization page. If not, please check the header in the response.',
    }
  }

  // 204 No response
  return { status: 204, message: 'User is  logged in' }
}
