const _createQueryParameters = Symbol();
const _defineQueryParameter = Symbol();
const _queryParametersMap = Symbol();
const _initializeQueryParameters = Symbol();
const _applyQueryParameters = Symbol();
const amfInstance = Symbol();
const findEndpoint = Symbol();
const findMethod = Symbol();
const endpointIdProperty = Symbol();
const methodIdProperty = Symbol();
const endpointProperty = Symbol();
const methodProperty = Symbol();
const createRequest = Symbol();
const collectFetchRequestArguments = Symbol();
const collectRequestData = Symbol();
const selectPayload = Symbol();
/**
 * A class to make a HTTP request to a method identified by id.
 *
 * Basic usage example:
 *
 * ```
 * const request = new WebSdkRequest(amfModel, endpointId, methodId);
 * request.execute({
 *  headers: {...},
 *  variables: {...},
 *  parameters: {...},
 *  body: ''
 * });
 * ```
 */
export class WebSdkRequest {
  /**
   * @param {Object} amf AMF model
   * @param {String} endpointId Endpoint ID containing the operation.
   * @param {String} methodId Method's to execute ID.
   * @param {Object=} init Request init object
   */
  constructor(amf, endpointId, methodId, init={}) {
    this.init = init;
    this[amfInstance] = amf;
    this[endpointIdProperty] = endpointId;
    this[methodIdProperty] = methodId;
    this[endpointProperty] = this[findEndpoint](endpointId);
    this[methodProperty] = this[findMethod](methodId);
    this[_initializeQueryParameters]();
  }
  /**
   * Creates a map of query parameters defined in the API on
   * the `query` property.
   * When ready it freezes the object so it is safe to enumerate on this object
   * only when applying query parameters to the request. If the object is not
   * freezed then the request execution should check whether a query parameter
   * is defined in the API before applying it to the request.
   */
  [_initializeQueryParameters]() {
    this.query = {};
    this[_queryParametersMap] = {};
    this[_createQueryParameters]();
    Object.freeze(this.query);
  }
  /**
   * Executes the request using the `Fetch` API.
   * @param {Object=} auth Authorization options.
   * @return {Promise<Response>} A promise resolved to a Response object.
   */
  execute(auth) {
    // let authMethods = auth.listSecurity(this[methodProperty]);
    // let endpointAuth = auth.listSecurity(this[endpointProperty]);
    // if (endpointAuth.length > 0) {
    //   authMethods = authMethods.concat(endpointAuth);
    // }
    // TODO: Check if authentication is required.
    // When required: check if user is authenticated for any authorization method
    // if `auth` object is not set, and for selected method when `auth` property is set
    // When the user is not authenticated and request authentication method is
    // OAuth2 then begin OAuth2 flow.
    // TODO: Test for "null" (RAML) auth method
    const {url, method, headers, body} = this[collectRequestData](this.init);
    const request = this[createRequest](url, method, headers, body, this.init);
    return fetch(request);
  }
  /**
   * Finsd an endpoint in AMF object.
   *
   * @param {String} id Endpoint ID in the AMF model
   * @return {Object|undefined} Endpoint definition or undefined if missing.
   */
  [findEndpoint](id) {
    const amf = this[amfInstance];
    const list = amf && amf.encodes && amf.encodes.endPoints;
    if (!list) {
      return;
    }
    return list.find((item) => item.id === id);
  }
  /**
   * Finds a method in current endpoint.
   * @param {String} id Method ID
   * @return {Object|undefined} AMF method (operation) definition.
   */
  [findMethod](id) {
    const ops = this[endpointProperty] && this[endpointProperty].operations;
    if (!Array.isArray(ops)) {
      return;
    }
    return ops.find((item) => item.id === id);
  }

  [createRequest](url, method, headers, body, userInit) {
    const init = {
      method,
      headers,
      body
    };
    this[collectFetchRequestArguments](userInit, init);
    return new Request(url, init);
  }

  [collectFetchRequestArguments](init, target) {
    if (!init) {
      return;
    }
    const include = ['mode', 'credentials', 'cache', 'redirect', 'referrer', 'integrity'];
    Object.keys(init).forEach((key) => {
      if (include.indexOf(key) === -1) {
        return;
      }
      target[key] = init[key];
    });
  }

  [collectRequestData](init) {
    if (!init) {
      init = {};
    }
    const url = this._getRequestUrl(init);
    const headers = this._getRequestHeaders(init);
    const lowerMethod = this[methodProperty].method.toString();
    const httpMethod = lowerMethod.toUpperCase();
    let body;
    if (['get', 'head'].indexOf(lowerMethod) === -1) {
      body = init.body;
    }
    return {
      url,
      method: httpMethod,
      headers,
      body
    };
  }

  [selectPayload](payloads, contentType) {
    let payload;
    if (!contentType) {
      payload = payloads[0];
    } else {
      const lowerCt = contentType.toLowerCase();
      payload = payloads.find((item) => item.mediaType.toString() === lowerCt);
    }
    return payload;
  }

  _getRequestHeaders(init={}) {
    // Adds content type if required
    const { method } = this;
    const initParams = init.headers || {};
    const initHeaders = new Headers(initParams);
    const initCt = initHeaders.get('content-type');
    const payloads = method.request && method.request.payloads;
    const result = new Headers();
    if (payloads && payloads.length) {
      const payload = this[selectPayload](payloads, initCt);
      if (payload) {
        result.set('content-type', payload.mediaType.toString());
      }
    }
    const apiHeaders = (method && method.request && method.request.headers);
    if (!apiHeaders || !apiHeaders.length) {
      return result;
    }
    for (let i = 0; i < apiHeaders.length; i++) {
      const apiHeader = apiHeaders[i];
      const name = apiHeader.name.toString();
      if (initHeaders.has(name)) {
        result.append(name, initHeaders.get(name));
        continue;
      }
      if (!apiHeader.required.value()) {
        continue;
      }
      const value = this._extractVariableValue(apiHeader, initParams);
      if (value) {
        result.append(name, value);
      }
    }
    return result;
  }

  _getRequestUrl(init={}) {
    const path = this._processEndpointPath(init);
    const url = this._constructRequestUrl(path, init);
    return url;
  }

  _processEndpointPath(init) {
    if (!init) {
      init = {};
    }
    let path = this[endpointProperty].path.toString();
    if (!path) {
      return;
    }
    const params = this[endpointProperty].parameters;
    if (!params || !params.length) {
      return path;
    }
    for (let i = 0, len = params.length; i < len; i++) {
      const v = params[i];
      const value = this._extractVariableValue(v, init.variables);
      if (!value) {
        continue;
      }
      const name = v.name.toString();
      path = path.replace(`{${name}}`, value);
    }
    return path;
  }

  _constructRequestUrl(path, init) {
    path = path || '/';
    const base = this._getBaseUri(init);
    let u;
    if (!base) {
      u = new URL(path, location.href);
      u.search = '';
      u.hash = '';
    } else {
      u = new URL(base);
      let basePath = u.pathname;
      if (!basePath) {
        basePath = '';
      }
      if (basePath[basePath.length - 1] === '/' && path[0] === '/') {
        path = path.substr(1);
      }
      basePath += path;
      u.pathname = basePath;
    }
    const request = this[methodProperty].request;
    if (request) {
      this[_applyQueryParameters](u, request.queryParameters, init);
    }
    return u.toString();
  }
  /**
   * Applies collected query parameters to the request URL.
   * It does not check whether the aprameter is valid according to
   * API spoecification. Anything defined in the `query` property is used
   * in the request.
   *
   * @param {URL} parser Parsed base URL with path
   */
  [_applyQueryParameters](parser) {
    const { query } = this;
    const keys = Object.keys(query);
    const len = keys.length;
    if (!len) {
      return;
    }
    for (let i = 0; i < len; i++) {
      const name = keys[i];
      const value = query[name];
      if (value) {
        parser.searchParams.set(name, value);
      }
    }
  }
  /**
   * Returns base URI for the API.
   *
   * @param {Object} init Request init object
   * @return {String} API base URI
   */
  _getBaseUri(init) {
    if (!init) {
      init = {};
    }
    const amf = this[amfInstance];
    const srvs = amf.encodes.servers;
    const version = amf.encodes.version && amf.encodes.version.toString();
    if (!srvs || !srvs.length) {
      return;
    }
    const srv = srvs[0];
    let base = srv.url.toString();
    const vars = srv.variables;
    if (!vars || !vars.length) {
      return base;
    }
    for (let i = 0, len = vars.length; i < len; i++) {
      const v = vars[i];
      const value = this._extractVariableValue(v, init.variables, version);
      if (!value) {
        continue;
      }
      const name = v.name.toString();
      base = base.replace(`{${name}}`, value);
    }
    return base;
  }

  _extractVariableValue(shape, variables, version) {
    const name = shape.name.toString();
    if (name === 'version' && version) {
      return version;
    }
    if (variables && name in variables) {
      return variables[name];
    }
    const schema = shape.schema;
    let value = this._getDefaultValue(schema);
    if (value) {
      return value;
    }
    value = this._getExampleValue(schema);
    return value;
  }

  _getDefaultValue(schema) {
    if (!schema || !schema.defaultValue) {
      return;
    }
    return schema.defaultValue.value;
  }

  _getExampleValue(schema) {
    if (!schema || !schema.examples || !schema.examples.length) {
      return;
    }
    const ex = schema.examples[0];
    return ex.value.toString();
  }
  /**
   * Uses current method definition to create access points to define
   * query parameters on the request object. The developer can then use
   * the setters to set query parameter value.
   *
   * If the API defines a query parameter, say `limit`, it creates a getter and
   * a setter for `limit` property on `query` property of this request.
   *
   * ```
   * const request = api.endpoint.get();
   * request.query.limit = 10;
   * request.execute();
   * ```
   */
  [_createQueryParameters]() {
    const { request } = this[methodProperty];
    if (!request) {
      return;
    }
    const { queryParameters } = request;
    if (!queryParameters || !queryParameters.length) {
      return;
    }
    queryParameters.forEach((qp) => this[_defineQueryParameter](qp));
  }
  /**
   * Defines a getter and a setter for a query parameter defined in the API.
   *
   * @param {Object} qp
   */
  [_defineQueryParameter](qp) {
    const name = qp.name.toString();
    const context = this;
    Object.defineProperty(this.query, name, {
      get() {
        return context[_queryParametersMap][name];
      },
      set(newValue) {
        context[_queryParametersMap][name] = newValue;
      },
      enumerable: true,
      configurable: false
    });
  }
}
