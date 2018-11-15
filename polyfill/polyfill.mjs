import {WebSdkApiFinder} from './api-finder.mjs';
import observeApis from './api-observer.mjs';
import {WebSdkApiParser} from './api-parser.mjs';
import {WebSdkApiWrapper} from './api-wrapper.mjs';
/**
 * A flag that determines if the API was already initialized.
 * @type {Boolean}
 */
let initialized = false;
/**
 * A flag that determines that the API is being initialized.
 * @type {Boolean}
 */
let initilizing = false;
/**
 * A promise that resolves when API is initialized.
 * @type {Object}
 */
let initPromise;
/**
 * Keeps API model in memory so subsequent API parse calls will reuse existing model.
 */
const __cache__ = {};
/**
 * List of APIs located in the DOM.
 * @type {Object}
 */
const apiDefinitions = {};

/**
 * @namespace
 */
navigator.sdk = {};

/**
 * Initializes the API
 * @return {Promise} [description]
 */
navigator.sdk.ready = function() {
  if (initialized) {
    return Promise.resolved();
  }
  if (initilizing) {
    return initPromise;
  }
  initilizing = true;
  initPromise = WebSdkApiFinder.find();
  initPromise.then((apis) => {
    initilizing = false;
    initialized = true;
    initPromise = undefined;
    observeApis(apiDefinitions, __cache__);
    if (!apis.length) {
      return;
    }
    apis.forEach((item) => {
      apiDefinitions[item.title] = item;
    });
  });
  return initPromise;
};
/**
 * Generates SDK from the API definition.
 * @param {String} id API id represented as `title` attribute of the `link`.
 * @return {Promise<Object>} A promise resolved to the SDK object.
 */
navigator.sdk.api = function(id) {
  if (!(id in apiDefinitions)) {
    return Promise.reject('Unknown API ' + id);
  }
  if (id in __cache__) {
    return Promise.resolve(__cache__[id]);
  }
  const info = apiDefinitions[id];
  const parser = new WebSdkApiParser(info);
  return parser.parse()
  .then((api) => {
    const sdk = new WebSdkApiWrapper(api);
    __cache__[id] = sdk;
    return sdk;
  });
};
