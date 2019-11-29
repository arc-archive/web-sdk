import { WebSdkRequest } from './api-request.mjs';
import { WebSdkAuthentication } from './api-authentication.mjs';
const amfInstance = Symbol();
const wrapApi = Symbol();
const wrapEndpoints = Symbol();
const wrapEndpoint = Symbol();
const constructPath = Symbol();
const wrapMethods = Symbol();
const wrapMethodApi = Symbol();
const wrapMethodValidation = Symbol();
const createRequest = Symbol();
const makeValidation = Symbol();
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
 * sdk.api.path.to.endpoint.get({
 *  variables: {
 *    endpoint: 'value'
 *  }
 * });
 * ```
 *
 * To access authentication methods:
 *
 * ```
 * sdk.auth.isAuthorized(config);
 * ```
 *
 * To access validation interface:
 *
 * ```
 * const validationResult = sdk.validation.todos.post(init);
 * console.log(validationResult.invalid);
 * console.log(validationResult.messages);
 * ```
 */
export class WebSdkApiWrapper {
  /**
   * @param {Array|Object} amf AMF instance with parsed document.
   */
  constructor(amf) {
    this[amfInstance] = amf;
    this.api = {};
    this.validation = {};
    this.auth = new WebSdkAuthentication(amf);
    this[wrapApi](amf);
    Object.freeze(this.api);
    Object.freeze(this);
  }
  /**
   * Generates JavaScript interface for the API.
   * @param {Object} amf Generated AMF model from the API spec file.
   */
  [wrapApi](amf) {
    this[wrapEndpoints](amf.encodes && amf.encodes.endPoints);
  }
  /**
   * Iterates over endpoints and creates an API structure
   * on the `api` property.
   *
   * @param {Array<Object>} endpoints A list of AMF endpoints.
   */
  [wrapEndpoints](endpoints) {
    if (!endpoints) {
      return;
    }
    for (let i = 0, len = endpoints.length; i < len; i++) {
      const endpoint = endpoints[i];
      this[wrapEndpoint](endpoint);
    }
  }
  /**
   * Creates a wrapper for an endpoint.
   *
   * @param {Object} endpoint AMF endpoint definition.
   */
  [wrapEndpoint](endpoint) {
    const path = endpoint.path.toString();
    const sdk = this[constructPath](path);
    this[wrapMethods](sdk.api, sdk.validation, endpoint.operations, endpoint.id);
  }
  /**
   * Creates endpoint touch point for a path.
   *
   * @param {String} path A path to create endpoint for
   * @return {Object} An object with `api` and `validation` properties.
   * `api` is current API edge to attach methods to and `validation` is current
   * validation object for the path.
   */
  [constructPath](path) {
    const parts = path.split('/');
    if (!parts[0]) {
      parts.shift();
    }
    let currentApi = this.api;
    let currentValidatrion = this.validation;
    while (parts.length) {
      let breadcrumb = parts.shift();
      // TODO (pawel): URI parameter should be wrapped as a function
      // that accepts parameter value as the only argument and returns
      // api endpoint.
      if (breadcrumb[0] === '{') {
        breadcrumb = breadcrumb.substr(1);
      }
      if (breadcrumb[breadcrumb.length - 1] === '}') {
        breadcrumb = breadcrumb.substr(0, breadcrumb.length - 1);
      }
      // The case for methods for `/` endpoint
      if (breadcrumb) {
        if (!(breadcrumb in currentApi)) {
          currentApi[breadcrumb] = {};
          currentValidatrion[breadcrumb] = {};
        }
        currentApi = currentApi[breadcrumb];
        currentValidatrion = currentValidatrion[breadcrumb];
      }
    }
    return {
      api: currentApi,
      validation: currentValidatrion
    };
  }

  [wrapMethods](apiTarget, validationTarget, operations, id) {
    if (!operations || !operations.length) {
      return;
    }
    for (let i = 0, len = operations.length; i < len; i++) {
      const op = operations[i];
      this[wrapMethodApi](apiTarget, op, id);
      this[wrapMethodValidation](validationTarget, op, id);
    }
  }

  [wrapMethodApi](target, method, id) {
    const name = method.method.toString();
    target[name] = this[createRequest].bind(this, id, method.id);
  }

  [wrapMethodValidation](target, method, id) {
    const name = method.method.toString();
    target[name] = this[makeValidation].bind(this, id, method.id);
  }

  [createRequest](endpointId, methodId, init) {
    const request = new WebSdkRequest(this[amfInstance], endpointId, methodId, init, this.auth);
    return request;
    // return request.execute(init, this.auth);
  }

  [makeValidation](endpointId, methodId, init={}) {
    // Mocked for now. Not sure if there's a use case for this.
    return true;
  }
}
