# oauth2-code-via-backend

> Below is Chinese README, please refer to [README-EN.md](./README-EN.md) for English version.

该项目封装了前端项目中，通过后端 API 间接与授权服务器通信的 **非标准** OAuth2 授权码授权流程。

## 什么是 OAUTH 2.0 授权码授权流程(Authorization Code Grant)

<img src="https://images.ctfassets.net/cdy7uua7fh8z/2nbNztohyR7uMcZmnUt0VU/2c017d2a2a2cdd80f097554d33ff72dd/auth-sequence-auth-code.png"/>

更多细节请参考 [okta Developer](https://developer.okta.com/blog/2018/04/10/oauth-authorization-code-grant-type).

## 非标准流程

从上面的文章中我们可以看到，授权码授权流程是 OAuth2 协议的一种类型。标准流程是客户端（浏览器）直接与授权服务器通信。简单的步骤如下：

1. 客户端（浏览器）将用户重定向到授权服务器：
    ```
    https://authorization-server.com/auth
      ?response_type=code
      &client_id=29352915982374239857
      &redirect_uri=https%3A%2F%2Fexample-app.com%2Fcallback
      &scope=create+delete
      &state=xcoiv98y2kd22vusuye3kch
    ```
2. 用户进行身份验证和授权。
3. 授权服务器将用户重定向回客户端，并附带授权码：
    ```
    https://example-app.com/redirect
      ?code=g0ZGZmNjVmOWIjNTk2NTk2YTJkM
      &state=xcoiv98y2kd22vusuye3kch
    ```
4. 客户端通过在上一步中收到的授权码，以及其他参数（如 client_id、client_secret、redirect_uri 等）向授权服务器请求访问令牌，也就是access token。更多细节请参考上面的文章。

但是在我们的项目中，是间接与授权服务器通信的。步骤如下：

1. 客户端（浏览器）通过后端 API 检查登录状态，如果用户未登录，后端 API 将自动通过 302 重定向将用户重定向到授权服务器（或者通过 header 中的特定字段来控制，在我们的项目中使用url-redirect）。
2. 用户进行身份验证和授权（与标准流程中的第 2 步相同）。
3. 授权服务器将用户重定向回客户端，并附带授权码（与标准流程中的第 3 步相同）。
4. 客户端（浏览器）将授权码发送给后端。后端再将授权码，以及其他参数（如 client_id、client_secret、redirect_uri 等）发送给授权服务器，去请求访问令牌。

## 为什么开发这个项目？ 

这是我们项目里一个通用的登录授权逻辑。重定向逻辑封装在后端 API 中，客户端（浏览器）只需要将授权码发送给后端，后端来处理后续逻辑。**因此，这个项目是Oauth2授权码流程的一个变种，适用于我们的项目。如果你有相同的需求的话，可以直接使用这个项目。**

## 使用方法

### 安装

```bash
npm install oauth2-code-via-backend
```

### 使用

```js
import { OAuth2CodeViaBackend } from 'oauth2-code-via-backend'

// 使用 env 变量来区分开发环境和生产环境
const apiPrefix = import.meta.env.MODE === 'development'
  ? import.meta.env.VITE_DEV_URL
  : import.meta.env.VITE_PROD_URL

const result = await oauth2CodeViaBackend({
  // 存储在客户端本地的令牌。如果令牌有效，则跳过登录流程。
  token: localStorage.getItem('token'),
  // 用于检查用户是否已登录的 API。
  // 如果没有登录，API 将自动通过 302 或者自定义header逻辑 将用户重定向到授权页面。
  // 检查用户状态的方法默认为 GET。
  userStateCheckAPI: `${apiPrefix}authority/getMenus`,
  // 用于检查用户状态的方法。默认方法为 GET。
  userStateCheckMethod: 'POST',
  // 用于检查用户状态的额外 header。
  userStateCheckHeaders: {},
  // 用于使用授权码登录的 API。
  // 将返回访问令牌。
  loginAPI: `${apiPrefix}login`,
  // 用于登录的方法。默认方法为 POST。
  loginMethod: 'GET',
  // 用于登录的额外 header。
  loginHeaders: {},
  // 当用户被重定向到授权页面时将调用的回调函数。
  // 默认函数是将消息记录到控制台。
  jumpingCallback: () => {
    message.warning('You are being redirected to the authorization page..')
  },
  // 当用户登录成功时将调用的回调函数。
  // 默认函数是将消息记录到控制台。
  loginSuccessCallback: async (data) => {
    // data 是 loginAPI 的响应数据，其中包含访问令牌。
    localStorage.setItem('token', data?.token)
  },
})

/**
 * result: {
 * status: number // oauth2 流程的状态码，参考 http 响应码
 * message: string
 * data?: any // 返回的数据，包括 API 的响应数据，捕获的错误等。
 * }
 */
switch (result.status) {
  case 200:
    // 200: 登录成功，流程结束
    break
  case 204:
    // 204: 用户已登录，直接返回 userStateCheckAPI 的响应数据
    break
  case 302:
    // 302: 用户未登录，loginAPI 已将用户重定向到授权服务器
    break
  case 401:
    // 401: 未授权，用户登录失败，loginAPI 的响应数据中包含错误信息
    break
  case 500:
    // 500: 内部服务器错误，loginAPI 或者 userStateCheckAPI 出现错误
    break
  default:
    break
}
```
