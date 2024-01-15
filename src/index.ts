import type { ConfigOptions, LoginOptions, checkUserStateOptions } from './types'
import { delCookie } from './utils'

/**
 * Log the user in with the authorization code.
 */
async function loginWithCode(
  options: LoginOptions,
) {
  const {
    loginAPI,
    code,
    state,
    loginMethod,
    loginHeaders,
    loginSuccessCallback = () => {
      // eslint-disable-next-line no-console
      console.log('login success')
    },
  } = options

  try {
    let response
    if (loginMethod === 'GET') {
      response = await fetch(`${loginAPI}?${new URLSearchParams({
        code,
        state: state ?? '',
      })}`, {
        headers: loginHeaders,
      })
    }
    else {
      response = await fetch(loginAPI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...loginHeaders,
        },
        body: JSON.stringify({
          code,
          state,
        }),
      })
    }

    const { status } = response
    if (status === 200) {
      const loginInfo = await response.json()
      loginSuccessCallback(loginInfo)
      window.location.href = localStorage.getItem('originalUrl') ?? window.location.origin

      return { status: 200, message: 'Login success', data: loginInfo }
    }

    return { status: 401, message: 'Login failed' }
  }
  catch (error) {
    return { status: 500, message: 'Something went wrong when logging in', data: error }
  }
}

/**
 * Check whether the user is logged in or not.
 * If not, the API will redirect the user to the authorization page.
 */
async function checkUserState(
  options: checkUserStateOptions,
) {
  const {
    userStateCheckAPI,
    userStateCheckMethod,
    userStateCheckHeaders,
    token,
    jumpingCallback = () => {
      // eslint-disable-next-line no-console
      console.log('jumping to Authorization page...')
    },
  } = options
  try {
    const response = await fetch(userStateCheckAPI, {
      method: userStateCheckMethod,
      headers: {
        Authorization: token,
        ...userStateCheckHeaders,
      },
    })
    const { status, headers } = response

    // 401 Unauthorized, 302 Found, 200 OK
    // To achieve compatibility with different backend implementations, we need to check the status code.

    if (headers.has('url-redirect') || status === 302 || status === 401) {
      delCookie()
      localStorage.clear()
      localStorage.setItem('originalUrl', window.location.href)
      const urlRedirect = headers.get('url-redirect') ?? ''
      if (!urlRedirect.length)
        throw new Error('The \'url-redirect\' header is empty, please check the backend implementation.')

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
    return { status: 204, message: 'User is logged in', data: await response.json() }
  }
  catch (err) {
    // 500 Internal Server Error
    return { status: 500, message: 'Something went wrong when checking user\'s state', data: err }
  }
}

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
    userStateCheckMethod = 'GET',
    userStateCheckHeaders = {},
    loginAPI,
    loginMethod = 'POST',
    loginHeaders = {},
    jumpingCallback = () => {
      // eslint-disable-next-line no-console
      console.log('jumping to Authorization page...')
    },
    loginSuccessCallback = () => {
      // eslint-disable-next-line no-console
      console.log('login success')
    },
  } = config

  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  if (code) {
    return await loginWithCode({
      loginAPI,
      code,
      state,
      loginMethod,
      loginHeaders,
      loginSuccessCallback,
    })
  }

  return await checkUserState({
    userStateCheckAPI,
    userStateCheckMethod,
    userStateCheckHeaders,
    token,
    jumpingCallback,
  })
}
