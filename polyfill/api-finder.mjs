let loadedPromise;
const SUPPORTED_APIS = ['RAML 0.8', 'RAML 1.0', 'OAS 2.0', 'OAS 3.0'];
/**
 * A class to search DOM for API declarations and extracting information
 * from `link` element.
 */
export class WebSdkApiFinder {
  /**
   * Finds API definition in the document.
   * @return {Promise<Array<Object>>} A promise resolved to the list of API
   * descriprion. Each item includes:
   * - title {String} - API id
   * - href {String} - API location
   * - type {String} - API type
   */
  static find() {
    switch (document.readyState) {
      case 'loading': return WebSdkApiFinder._lookup();
      default: return WebSdkApiFinder._lookupAfterReady();
    }
  }
  /**
   * Observers `readystatechange` event and sets promise object.
   * @return {Promise<Array<Object>>} See `find()` for description
   */
  static _lookupAfterReady() {
    document.addEventListener('readystatechange', WebSdkApiFinder._waitUntilLoaded);
    return new Promise((resolve) => {
      loadedPromise = resolve;
    });
  }
  /**
   * Calls `loadedPromise` function when readystatechange event fires.
   * @param {Event} e
   */
  static _waitUntilLoaded(e) {
    if (!loadedPromise) {
      document.removeEventListener('readystatechange', WebSdkApiFinder._waitUntilLoaded);
      return;
    }
    const {readyState} = e.target;
    if (readyState === 'interactive' || readyState === 'complete') {
      document.removeEventListener('readystatechange', WebSdkApiFinder._waitUntilLoaded);
      loadedPromise(WebSdkApiFinder._lookup());
    }
  }
  /**
   * Looks up for `link` with `rel="api"` and collects information about the API.
   * If the API type is not supported it is ignored.
   * @return {Promise<Array<Object>>} See `find()` for description
   */
  static _lookup() {
    const nodes = document.querySelectorAll('link[rel="api"]');
    const result = [];
    for (let i = 0, len = nodes.length; i < len; i++) {
      const apiDef = WebSdkApiFinder.collectInfo(nodes[i]);
      if (apiDef) {
        result[result.length] = apiDef;
      }
    }
    return Promise.resolve(result);
  }
  /**
   * Collects information about an API from link node.
   * If any of the required information is not set or type is not supported
   * then it returns `undefined`.
   * @param {HTMLLinkElement} node Node to process
   * @return {Object|undefined} API definition. Contains `href`, `type`, and `title`.
   */
  static collectInfo(node) {
    const type = node.getAttribute('type');
    if (!type) {
      console.warn('No type declaration on "link[api]" element.');
      return;
    }
    const upperType = type.toUpperCase();
    if (SUPPORTED_APIS.indexOf(upperType) === -1) {
      console.warn(`Api type ${type} is not supported.`);
      return;
    }
    const title = node.getAttribute('title');
    if (!title) {
      console.warn('API title not defined.');
      return;
    }
    const href = node.getAttribute('href');
    if (!href) {
      console.warn('API href not defined.');
      return;
    }
    return {
      href,
      title,
      type: upperType
    };
  }
}
