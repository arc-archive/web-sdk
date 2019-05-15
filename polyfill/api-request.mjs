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
   */
  constructor(amf, endpointId, methodId) {
    this.amf = amf;
    this.endpointId = endpointId;
    this.methodId = methodId;
    this.endpoint = this._findEndpoint(endpointId);
    this.method = this._findMethod(methodId);
  }
  /**
   * Executes the request using the `Fetch` API.
   * @param {?Object} init User parameters. See init object docs.
   * @param {?Object} auth Authorization options.
   * @return {Promise<Response>} A promise resolved to a Response object.
   */
  execute(init, auth) {
    if (!init) {
      init = {};
    }
    let authMethods = auth.listSecurity(this.method);
    let endpointAuth = auth.listSecurity(this.endpoint);
    if (endpointAuth.length > 0) {
      authMethods = authMethods.concat(endpointAuth);
    }
    // TODO: Check if authentication is required.
    // When required: check if user is authenticated for any authorization method
    // if `auth` object is not set, and for selected method when `auth` property is set
    // When the user is not authenticated and request authentication method is
    // OAuth2 then begin OAuth2 flow.
    // TODO: Test for "null" (RAML) auth method
    const {url, method, headers, body} = this._collectRequestData(init);
    const request = this._createRequest(url, method, headers, body, init);
    return fetch(request);
  }

  _findEndpoint(id) {
    const amf = this.amf;
    const list = amf && amf.encodes && amf.encodes.endPoints;
    if (!list) {
      return;
    }
    return list.find((item) => item.id === id);
  }

  _findMethod(id) {
    const ops = this.endpoint && this.endpoint.operations;
    if (!(ops instanceof Array)) {
      return;
    }
    return ops.find((item) => item.id === id);
  }

  _createRequest(url, method, headers, body, userInit) {
    const init = {
      method,
      headers,
      body
    };
    this._collectFetchRequestArguments(userInit, init);
    return new Request(url, init);
  }

  _collectFetchRequestArguments(init, target) {
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

  _collectRequestData(init) {
    if (!init) {
      init = {};
    }
    const url = this._getRequestUrl(init);
    const headers = this._getRequestHeaders(init);
    const lowerMethod = this.method.method.toString();
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

  _selectPayload(payloads, contentType) {
    let payload;
    if (!contentType) {
      payload = payloads[0];
    } else {
      const lowerCt = contentType.toLowerCase();
      payload = payloads.find((item) => item.mediaType.toString() === lowerCt);
    }
    return payload;
  }

  _getRequestHeaders(method, init) {
    if (!init) {
      init = {};
    }
    // Adds content type if required
    const initParams = init.headers || {};
    const initHeaders = new Headers(initParams);
    const initCt = initHeaders.get('content-type');
    const payloads = method.request && method.request.payloads;
    const result = new Headers();
    if (payloads && payloads.length) {
      const payload = this._selectPayload(payloads, initCt);
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
      let value = this._extractVariableValue(apiHeader, initParams);
      if (value) {
        result.append(name, value);
      }
    }
    return result;
  }

  _getRequestUrl(init) {
    const path = this._processEndpointPath(init);
    const url = this._constructRequestUrl(path, init);
    return url;
  }

  _processEndpointPath(init) {
    if (!init) {
      init = {};
    }
    let path = this.endpoint.path.toString();
    if (!path) {
      return;
    }
    const params = this.endpoint.parameters;
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
      path = path.replace(`\{${name}\}`, value);
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
    const request = this.method.request;
    if (request) {
      this._applyQueryParameters(u, request.queryParameters, init);
    }
    return u.toString();
  }

  _applyQueryParameters(parser, qp, init) {
    if (!qp || !qp.length) {
      return;
    }
    if (!init) {
      init = {};
    }
    const initParams = init.parameters || {};
    for (let i = 0, len = qp.length; i < len; i++) {
      const param = qp[i];
      const name = param.name.toString();
      if (name in initParams) {
        parser.searchParams.set(name, initParams[name]);
        continue;
      }
      if (!param.required.value()) {
        continue;
      }
      let value = this._extractVariableValue(param, initParams);
      if (value) {
        parser.searchParams.set(name, value);
      }
    }
  }

  _getBaseUri(init) {
    if (!init) {
      init = {};
    }
    const amf = this.amf;
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
      base = base.replace(`\{${name}\}`, value);
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
}
