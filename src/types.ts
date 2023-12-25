export interface ConfigOptions {
  /**
   * The token stored locally in the client. If the token is valid, the login flow will be skipped.
   */
  token?: string

  /**
   * The API used to check whether the user is logged in or not.
   * If not, the API will redirect the user to the authorization page.
   * The method used to check the user state is default to GET.
   */
  userStateCheckAPI: string

  /**
   * The method used to check the user state.
   */
  userStateCheckMethod?: 'GET' | 'POST'

  /**
   * The API used to log the user in with the authorization code.
   * Which will return the access token.
   * The method used to log the user in is default to POST.
   */
  loginAPI: string

  /**
   * The method used to log the user in.
   */
  loginMethod?: 'GET' | 'POST'

  /**
   * The callback function that will be called when the user is redirected to the authorization page.
   * The default function is to log the message to the console.
   */
  jumpingCallback?: () => void

  /**
   * The callback function that will be called when the user is logged in successfully.
   * The default function is to log the message to the console.
   */
  loginSuccessCallback?: () => void
}
