import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import oauth2FlowViaBackend from '../src'
import {
  AUTHORIZATION_SERVER,
  LOGIN_API,
  RAMDOM_STATE,
  USER_STATE_CHECK_API,
  USER_STATE_CHECK_API_WITH_EMPTY_REDIRECT,
  VALID_CODE,
  VALID_TOKEN,
} from './mock/utils'

const originalWindowLocation = window.location
const HOME_URL = 'http://localhost:3000'
const ORIGINAL_URL = 'http://localhost:3000/some-path'

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    value: new URL(window.location.href),
  })
  window.location.href = ORIGINAL_URL
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    value: originalWindowLocation,
  })
})

describe('user not logged in', () => {
  describe.each([
    { method: 'GET' },
    { method: 'POST' },
  ])('userStateCheckMethod is $method', ({ method }) => {
    it('should redirect to authorization server wihout token', async () => {
      const result = await oauth2FlowViaBackend({
        userStateCheckAPI: USER_STATE_CHECK_API,
        userStateCheckMethod: method as 'GET' | 'POST',
        loginAPI: LOGIN_API,
      })

      expect(result.status).toEqual(302)
      expect(window.location.href).toEqual(AUTHORIZATION_SERVER)
    })

    it('should redirect to authorization server with invalid token', async () => {
      const result = await oauth2FlowViaBackend({
        token: 'invalid-token',
        userStateCheckAPI: USER_STATE_CHECK_API,
        loginAPI: LOGIN_API,
      })

      expect(result.status).toEqual(302)
      expect(window.location.href).toEqual(AUTHORIZATION_SERVER)
    })

    it('should return 500 and catched error when userStateCheck request failed', async () => {
      const result = await oauth2FlowViaBackend({
        userStateCheckAPI: 'invalid-url',
        userStateCheckMethod: method as 'GET' | 'POST',
        loginAPI: LOGIN_API,
      })

      expect(result.status).toEqual(500)
    })

    it('should call jumpingCallback when user is redirected to authorization server\'s login page', async () => {
      const mockJumpingCallback = vi.fn()
      const result = await oauth2FlowViaBackend({
        userStateCheckAPI: USER_STATE_CHECK_API,
        jumpingCallback: mockJumpingCallback,
        loginAPI: LOGIN_API,
      })

      expect(result.status).toEqual(302)
      expect(mockJumpingCallback).toHaveBeenCalledOnce()
      expect(window.location.href).toEqual(AUTHORIZATION_SERVER)
    })

    it('should get 500 when userStateCheckAPI\'s response dont not have valid url-redirect header[special implement for my project]', async () => {
      const result = await oauth2FlowViaBackend({
        userStateCheckAPI: USER_STATE_CHECK_API_WITH_EMPTY_REDIRECT,
        userStateCheckMethod: method as 'GET' | 'POST',
        loginAPI: LOGIN_API,
      })

      expect(result.status).toEqual(500)
    })
  })

  describe.each([
    { method: 'GET' },
    { method: 'POST' },
  ])('loginMethod is $method', ({ method }) => {
    it('should log in successfully and jump back to original location with valid redirect URL\'s code and state from authorization server', async () => {
      window.location.href = `${HOME_URL}?code=${VALID_CODE}&state=${RAMDOM_STATE}`
      const result = await oauth2FlowViaBackend({
        userStateCheckAPI: USER_STATE_CHECK_API,
        loginAPI: LOGIN_API,
        loginMethod: method as 'GET' | 'POST',
      })

      expect(result.status).toEqual(200)
      expect(result.data.token).toEqual(VALID_TOKEN)
      expect(window.location.href).toEqual(ORIGINAL_URL)
    })

    it('should call loginSuccessCallback when user is logged in successfully', async () => {
      const mockLoginSuccessCallback = vi.fn()
      window.location.href = `${HOME_URL}?code=${VALID_CODE}&state=${RAMDOM_STATE}`
      const result = await oauth2FlowViaBackend({
        userStateCheckAPI: USER_STATE_CHECK_API,
        loginAPI: LOGIN_API,
        loginMethod: method as 'GET' | 'POST',
        loginSuccessCallback: mockLoginSuccessCallback,
      })

      expect(result.status).toEqual(200)
      expect(mockLoginSuccessCallback).toHaveBeenCalledOnce()
    })

    it('should log in failed with invalid redirect URL\'s code and state from authorization server', async () => {
      const initialUrl = `${HOME_URL}/?code=invalid-code&state=${RAMDOM_STATE}`
      window.location.href = initialUrl
      const result = await oauth2FlowViaBackend({
        userStateCheckAPI: USER_STATE_CHECK_API,
        loginAPI: LOGIN_API,
        loginMethod: method as 'GET' | 'POST',
      })

      expect(result.status).toEqual(401)
      expect(window.location.href).toEqual(initialUrl)
    })

    it('should return 500 and catched error when login request failed', async () => {
      window.location.href = `${HOME_URL}/?code=${VALID_CODE}&state=${RAMDOM_STATE}`
      const result = await oauth2FlowViaBackend({
        userStateCheckAPI: USER_STATE_CHECK_API,
        loginAPI: 'invalid-url',
        loginMethod: method as 'GET' | 'POST',
      })

      expect(result.status).toEqual(500)
    })
  })
})

describe('user logged in', () => {
  describe.each([
    { method: 'GET' },
    { method: 'POST' },
  ])('userStateCheckMethod is $method', ({ method }) => {
    it('should return data with valid token', async () => {
      const result = await oauth2FlowViaBackend({
        token: VALID_TOKEN,
        userStateCheckAPI: USER_STATE_CHECK_API,
        userStateCheckMethod: method as 'GET' | 'POST',
        loginAPI: LOGIN_API,
      })

      expect(result.status).toEqual(204)
      expect(result.data).not.toBeUndefined()
    })
  })
})
