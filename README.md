# oauth2-code-via-backend

<!-- [![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href] -->

Encapsulating the opinioned non-standard flow of OAuth2 authorization code grant for front-end projects, which communicate with the authorization server indirectly via backend APIs.

## What is the OAuth 2.0 Authorization Code Grant?

Plz refer to [okta Developer](https://developer.okta.com/blog/2018/04/10/oauth-authorization-code-grant-type).

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
1. The client (browser) check the login state via a backend API, if the user is not logged in, the backend API will redirect the user to the authorization server automatically via 302 redirect.
2. The user authenticates and authorizes the client (same as step 2 in standard flow).
3. The authorization server redirects the user back to the client with an authorization code (same as step 3 in standard flow).
4. The client (browser) sends the authorization code to the login backend API, and the backend API requests an access token from the authorization server's token endpoint by passing the authorization code received in the previous step.

## Why do we need this?

This is a special use case in my work. The redirect logic is ecapsulated in the backend API, and the client (browser) just need to send the authorization code to the backend API. The backend API will handle the rest of the flow. 

**So, this project is pretty much like an opinioned version of Oauth2 authorization code grant flow, which is suitable for my use case. If you have the same use case, you can use this project directly.**

## License

[MIT](./LICENSE) License © 2023-PRESENT [Donovan Ye](https://github.com/Donovan-Ye)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/pkg-placeholder
[npm-downloads-src]: https://img.shields.io/npm/dm/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/pkg-placeholder
[bundle-src]: https://img.shields.io/bundlephobia/minzip/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=pkg-placeholder
[license-src]: https://img.shields.io/github/license/antfu/pkg-placeholder.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/pkg-placeholder/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/pkg-placeholder
