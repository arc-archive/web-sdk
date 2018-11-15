# WebSDK polyfill and <web-sdk> web component

This is a proof of concept for a proposition of new web platform API: WebSDK.

This PoC contains:

-   WebSDK polyfill as a platform primitive
-   `<web-sdk>` web component as a part of [Layered API](https://github.com/drufball/layered-apis)

**This is work in progress**
As long as this notice is here the polyfill and the component won't work.


## What is WebSDK?

In short, it's a way to generate an SDK for REST API at runtime using any of standardized API specifications like RAML or OAS.

## Benefits of WebSDK

### Benefits for web developers

#### Common REST API

WebSDK generates common model for all rest APIs. Web developer has to learn how to use WebSDK API once and then, using API documentation, makes a call to an endpoint.
Common model means that the parameters for the request are defined by WebSDK and are propagated in underlying HTTP request according to API specification.

#### Standardized way of authentication

Both OAS and RAML defines ways to authenticate users in a web service. Authentication methods are all standardised and therefore the authentication flow can be unified for all APIs. This means that the developer no longer have to spend time reading SDK documentation to authenticate the user but instead calls unified authentication interface of WebSDK.

#### Faster consumption of new APIs

Web developer who already know WebSDK API only need to know new API's endpoint's structure, authentication options, and data models. This is available in API documentation provided by API provider. The developer do not need to learn how new SDK works.

### Benefits for API providers

API providers already have tools to generate API documentation from API model like MuleSoft's API console or API Blueprint. However, providers still have to build, test, document, and distribute the SDK to developers. This part can be removed by standardising WebSDK API.

### WebSDK API

As a primitive, WebSDK allows to define API use declaratively, meaning by declaring it's use in website using the API.

**Declaring the SDK**

When the API consumer website want to use provider's API it references the API specification file in `link` element.

```html
<head>
  ...
  <link rel="api" type="RAML 1.0" href="https://provider.com/api.raml" title="provider-api">
</head>
```

New value for `rel` attribute tells the browser that the external resource is the API specification.
The `type` attribute describes API native format. It can be `RAML 1.0` or `OAS 2.0`, for example.
Title is used by a web developer to identify the API when using JavaScript interface.

**Using the API**

Once the APIs are declared the developer has to initialize the WebSDK. Initialization part includes ensuring that all definitions are downloaded and the API is ready to use.

```html
<script>
navigator.sdk.ready()
.then(() => navigator.sdk.api('provider-api'))
.then((sdk) => sdk.api.path.to.endpoint.get());
.then((respone) => response.json())
.then((data) => console.log(data));
</script>
```

In first step the WebSDK is being initialized. The initialization can be perform earlier if the browser was able to download API definitions earlier. However, users who never visited a website using this API it can take some time.

Second line asks WebSDK API to generate the SDK. This involves parsing the API and creating JavaScript interface. The interface reflects the API structure including authentication options and REST API structure.

Third line makes a HTTP request to the endpoint. The structure is generated from the API specification and can be read from API documentation. The function optionally accepts configuration object which is similar to [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request) init option. However, giving the complexity of APIs it may include additional properties (like `variables`) and ignore other (like `method`).

Finally when the request is made it returns standard [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response) object.

#### `api` property

The `api` property of generated SDK object contains complete API structure. API model is parsed and evaluated to produce a path to each endpoint. Each endpoint may have a number of HTTP methods which are functions that can be called to perform an operation on a resource.

For example a `GET` request to `/profile/me` would become `api.profile.me.get()` path of generated SDK object.

**Request init option**

Usually APIs requires additional options to provide when making a request. This are URI variables, query parameters, headers, and body. The WebSDK API utilize options for `Request` object which web developers already know.

```html
<script>
 const init = {
  headers: {'x-api-key': '...'},
  body: JSON.stringify({
    ...
  }),
  mode: 'cors'
 };
 const response = await sdk.api.todos.post(init);
</script>
```

APIs can define additional parameters to be included into request that are not standard init option for the Request constructor. This will be URI variables and query parameters.
To support this in WebSDK API additional properties are required.

```yaml
# API definition

/todos:
  /{id}:
    put:
      queryParameters:
        responseType: string
      headers:
        x-api-key: string
      body:
        application/json:
          type: object
```

```html
<script>
 const init = {
  headers: {'x-api-key': '...'},
  body: JSON.stringify({
    ...
  }),
  variables: {
    id: 'todo-id'
  },
  parameters: {
    responseType: 'json'
  }
 };
 const response = await sdk.api.todos.id.put(init);
</script>
```

The `variables` property represents URI variables. The WebSDK inserts values into corresponding place. If the API spec defines default values it will be used in case when parameter is missing.
Similarly to `parameters` which represent query parameters defined in API documentation.

#### `auth` property

The `auth` property contains authentication options for given API. It allows to test whether the user is authenticated for given configuration and to perform authentication in a unified way.

```html
<script>
 const config = {
  type: 'OAuth 2.0',
  grantType: 'implicit',
  interactive: true,
  clientId: '....',
  redirectUri: '...'
 };
 if (!sdk.auth.isAuthenticated(config)) {
  await sdk.auth.authenticate(config);
 }
</script>
```

**configuration option**

Depending on `type` configuration option can have different properties.
The `type` represents one of standardised authentication mechanisms like `OAuth 2.0`, `OAuth 1.0`, `Basic` and so on.
In case of multiple options available in the API spec file (`grantType`) the developer can decide which option to use. Otherwise the first available option is used. So if the API defines grant type for OAuth 2.0 as `implicit` and `client_credentials` in case of missing declaration in configuration option the first available option is used.

## `<web-sdk-*>` components

`<web-sdk>` component provides a declarative way of using the API. It performs operations on low level WebSDK API to make a request to the server. This is part of [Layered APIs](https://github.com/drufball/layered-apis) proposal.

For example

```html
<script type="module" src="std:web-sdk"></script>
<script type="module" src="std:web-sdk-authentication"></script>
<script type="module" src="std:web-sdk-request"></script>

<web-sdk api="my-api" id="api">
 <web-sdk-authentication client-id="..." redirect-url="..." id="auth"></web-sdk-authentication>
 <web-sdk-request endpoint="/users/me" method="GET" id="profile"></web-sdk-request>
</web-sdk>

<script>
  api.addEventListener('ready', () => {
    if (!auth.isAuthenticated()) {
      auth.authenticate();
    }
  });

  auth.addEventListener('authenticated-changed', (e) => {
    console.log('User authenticated: ', e.target.authenticated);
  });

  profile.addEventListener('response', (e) => {
    e.target.response.json()
    .then((profile) => console.log(profile));
  });
</script>
```

## `<web-sdk>` component

It initializes the WebSDK API and creates a workspace for other components.
Other components added to the light DOM of it are scoped to this API.
It also communicates authorization state change to child elements.

### API

#### `api` property

Type: `String`

It is a referenced to the `title` attribute of `link[rel="api"]` element declared in `head` section.


#### `ready` property

Type: `function()`

Returns a promise resolved when the WebSDK API is initialized.

#### `ready` event

Dispatched when WebSDK is ready to use.

## `<web-sdk-authentication>` component

Manages user authentication state and performs authentication.

### API

#### `type` property

Type: `String`

Authentication type to use. It must be one of defined in authentication types in the API spec file.
List of accepted other options depends on value of this property. When omitted the first available authentication option is assumed (as defined in API spec file).

#### `isAuthenticated` property

Type: `function(options: object)`

Checks if user is authenticated for given options. When no options provided the ones from attributes are used.

#### `authenticate` property

Type: `function(options: object)`

The options argumet is the same as for `isAuthenticated` property.

In case of OAuth 2.0 additional `interactive` property is available. When set it determines if the popup window is rendered when the user is not authenticated or not. This can be used to restore user session in background, without prompting the user to log in.

#### `logout` property

Type: `function()`

Removes any authentication configuration previously received. In case of OAuth 2.0 by calling `authenticate` function after logging out will authenticate the user without prompting for app authorization as the app is already authorized with the OAuth 2.0 provider.

#### `authenticated-changed` event

The event is dispatched when authentication status changed.

## `<web-sdk-request>` component

A component to make authenticated and declarative request to the endpoint.
If the endpoint requires authentication it waits until authentication state change to `authenticated`. If authentication is not required then it performs the request when the element is created.

### API

All attributes are inherited from request init option.

#### `endpoint` property

Type: `string`

Endpoint path to call.

#### `method` property

Type: `string`

HTTP method name to use with request

#### `send` property

Type: `function()`

Allows to manually generate and send request to the endpoint.

#### `response` event

Dispatched when the response is ready

## Status of this document

This document is work in progress. It will most probably change as well as WebSDK and `<web-sdk_*>` APIs. Any comments are welcome. Please, create issue report if you want start a discussion about the proposal.
