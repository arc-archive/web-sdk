/**
 * Generates a JavaScript interface to interact with the API.
 * It generates path for each endpoint and method so functions can be
 * called using JavaScript API.
 * It adds security methods to the interface is any exists.
 *
 * ## Request init object
 *
 * The init object is as close to Request init object of Fetch API.
 * However, in case like URI variables it accepts additional properties.
 *
 * Schema:
 *
 * - headers {Object, Headers} Headers to add to the request.
 * If the API requires a header and it is not provided then it will use API's
 * default value or example value. It won't set header without the value even if
 * it's required.
 * - parameters {Object} List of query parameters to add. It only add parameters
 * defined in the API and will ignore not defined parameters.
 * - variables {Object} URI variables definition.
 * - body {String|FormData|Blob} A body to send with request. It ignores the body
 * if the request cannot carry a body (GET, HEAD) or if the API does not specify
 * request body tor the request.
 *
 * Other properties passed directly to request object:
 * - mode
 * - credentials
 * - cache
 * - redirect
 * - referrer
 * - integrity
 *
 * Ignored properties:
 * - method
 * - headers if header on the list is not in API spec.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
 * for documentation.
 *
 * ## Making a request with variables
 *
 * To make a GET request to endpoint `/path/to/{endpoint}` you need to
 * call the function like:
 *
 * ```
 * sdk.path.to.endpoint.get({
 *  variables: {
 *    endpoint: 'value'
 *  }
 * });
 * ```
 */
export class WebSdkApiWrapper {
  constructor(amf) {
    this.__amf = amf;
    this.api = {};
    this.auth = {};
    this._wrap(amf);
  }

  _wrap(amf) {
    this._wrapEndpoints(amf.encodes && amf.encodes.endPoints);
  }

  _wrapEndpoints(endpoints) {
    if (!endpoints) {
      return;
    }
    for (let i = 0, len = endpoints.length; i < len; i++) {
      const endpoint = endpoints[i];
      this._wrapEndpoint(endpoint);
    }
  }

  _wrapEndpoint(endpoint) {
    const path = endpoint.path.toString();
    const sdk = this._constructPath(path);
    this._wrapMethods(sdk, endpoint.operations, endpoint.id);
  }

  _constructPath(path) {
    const parts = path.split('/');
    if (!parts[0]) {
      parts.shift();
    }
    let current = this.api;
    while (parts.length) {
      const breadcrumb = parts.shift();
      if (!(breadcrumb in current)) {
        current[breadcrumb] = {};
      }
      current = current[breadcrumb];
    }
    return current;
  }

  _wrapMethods(target, operations, id) {
    if (!operations || !operations.length) {
      return;
    }
    for (let i = 0, len = operations.length; i < len; i++) {
      const op = operations[i];
      this._wrapMethod(target, op, id);
    }
  }

  _wrapMethod(target, method, id) {
    const name = method.method.toString();
    target[name] = (init) => {
      this._makeRequest(id, method.id, init);
    };
  }

  _makeRequest(endpointId, methodId, init) {
    const endpoint = this._findEndpoint(endpointId);
    const method = this._findEndpointsMethod(endpoint, methodId);
    const path = this._processEndpointPath(endpoint, init);
    const url = this._constructRequestUrl(method, path, init);
    console.log('URL', url);
    return Promise.reject(new Error('Not implemented: ' + endpointId + '::' + methodId));
  }

  _findEndpoint(id) {
    const amf = this.__amf;
    const list = amf.encodes.endPoints;
    return list.find((item) => item.id === id);
  }

  _findEndpointsMethod(endpoint, id) {
    return endpoint.operations.find((item) => item.id === id);
  }

  _processEndpointPath(endpoint, init) {
    if (!init) {
      init = {};
    }
    let path = endpoint.path.toString();
    if (!path) {
      return;
    }
    const params = endpoint.parameters;
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

  _constructRequestUrl(method, path, init) {
    path = path || '/';
    const base = this._getBaseUri(init);
    let u;
    if (!base) {
      u = new URL(path, location.href);
      u.search = '';
      u.hash = '';
    } else {
      u = new URL(path, base);
    }
    const request = method.request;
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

    const amf = this.__amf;
    const srvs = amf.encodes.servers;
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
      const value = this._extractVariableValue(v, init.variables);
      if (!value) {
        continue;
      }
      const name = v.name.toString();
      base = base.replace(`\{${name}\}`, value);
    }
    return base;
  }

  _extractVariableValue(shape, variables) {
    const name = shape.name.toString();
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
