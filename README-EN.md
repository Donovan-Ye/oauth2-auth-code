# oauth2-code-via-backend

> 以下是英文文档，中文文档请参考 [README.md](./README.md)
---

Encapsulating the **opinioned non-standard** flow of OAuth2 authorization code grant for front-end projects, which communicate with the authorization server indirectly via backend APIs.

## What is the OAuth 2.0 Authorization Code Grant?

<img src="https://images.ctfassets.net/cdy7uua7fh8z/2nbNztohyR7uMcZmnUt0VU/2c017d2a2a2cdd80f097554d33ff72dd/auth-sequence-auth-code.png"/>

More details please refer to [okta Developer](https://developer.okta.com/blog/2018/04/10/oauth-authorization-code-grant-type).

## Non-standard flow

As we can see from the above article, the authorization code grant flow is a type of Oauth2 protocol. The standard flow is that the client (browser) communicates with the authorization server directly. The simple steps are as follows:
1. The client (browser) redirects the user to the authorization server: 
    ```
    https://authorization-server.com/auth
      ?response_type=code
      &client_id=29352915982374239857
      &redirect_uri=https%3A%2F%2Fexample-app.com%2Fcallback
      &scope=create+delete
      &state=xcoiv98y2kd22vusuye3kch
    ```
2. The user authenticates and authorizes the client.
3. The authorization server redirects the user back to the client with an authorization code:
    ```
    https://example-app.com/redirect
      ?code=g0ZGZmNjVmOWIjNTk2NTk2YTJkM
      &state=xcoiv98y2kd22vusuye3kch
    ```
4. The client requests an access token from the authorization server's token endpoint by passing the authorization code received in the previous step, also with other parameters like client_id, client_secret, redirect_uri, etc. Refer to above article for more details.

But in this case, the client communicates with the authorization server indirectly via backend APIs. The steps are as follows:
1. The client (browser) check the login state via a backend API, if the user is not logged in, the backend API will redirect the user to the authorization server automatically via 302 redirect(or via spesific field in header, which is url-redirect in this project.).
2. The user authenticates and authorizes the client (same as step 2 in standard flow).
3. The authorization server redirects the user back to the client with an authorization code (same as step 3 in standard flow).
4. The client (browser) sends the authorization code to the login backend API, and the backend API requests an access token from the authorization server's token endpoint by passing the authorization code received in the previous step.

## Why do we need this?

This is a special use case in my work. The redirect logic is ecapsulated in the backend API, and the client (browser) just need to send the authorization code to the backend API. The backend API will handle the rest of the flow. 

**So, this project is pretty much like an opinioned version of Oauth2 authorization code grant flow, which is suitable for my use case. If you have the same use case, you can use this project directly.**


## Usage

### Install

```bash
npm install oauth2-code-via-backend
```

### Usage

```js
import { OAuth2CodeViaBackend } from 'oauth2-code-via-backend'

// Using env variables to distinguish between development and production environment
const apiPrefix = import.meta.env.MODE === 'development'
  ? import.meta.env.VITE_DEV_URL
  : import.meta.env.VITE_PROD_URL

const result = await oauth2CodeViaBackend({
  // The token stored locally in the client. If the token is valid, the login flow will be skipped.
  token: localStorage.getItem('token'),
  // The API used to check whether the user is logged in or not.
  // If not, the API will redirect the user to the authorization page.
  // The method used to check the user state is default to GET.
  userStateCheckAPI: `${apiPrefix}authority/getMenus`,
  // The method used to check the user state. The default method is GET.
  userStateCheckMethod: 'POST',
  // The extra headers used to check the user state.
  userStateCheckHeaders: {},
  // The API used to log the user in with the authorization code.
  // Which will return the access token.
  // The method used to log the user in is default to POST.
  loginAPI: `${apiPrefix}login`,
  // The method used to log the user in. The default method is POST.
  loginMethod: 'GET',
  // The extra headers used to log the user in.
  loginHeaders: {},
  // The callback function that will be called when the user is redirected to the authorization page.
  // The default function is to log the message to the console.
  jumpingCallback: () => {
    message.warning('You are being redirected to the authorization page..')
  },
  // The callback function that will be called when the user is logged in successfully.
  // The default function is to log the message to the console.
  loginSuccessCallback: async (data) => {
    // data is the response data from the loginAPI, which contains the access token.
    localStorage.setItem('token', data?.token)
  },
})

/**
 * result: {
 * status: number // the oauth2 flow's status code, refer to http response code
 * message: string
 * data?: any // the data returned, including API's response data, catched error.
 * }
 */
switch (result.status) {
  case 200:
    // 200: login successfully, the flow is finished
    break
  case 204:
    // 204: user is already logged in, return the checkAPI's respnse data directly within the result
    break
  case 302:
    // 302: user is not logged in, the backend API has redirected the user to the authorization server
    break
  case 401:
    // 401: unauthorized, there is something wrong with the login backend API
    break
  case 500:
    // 500: internal server error, there is something wrong with the check-user backend API
    break
  default:
    break
}
```


## License

[MIT](./LICENSE) License © 2023-PRESENT [Donovan Ye](https://github.com/Donovan-Ye)
