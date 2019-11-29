import { WebSdkApiFinder } from './api-finder.mjs';
let refList;
let refCache;
/**
 * Checks if passed node is API link node.
 * @param {Element} node Node to test
 * @return {Boolean} True if passed node is a `link` with `rel="api"` attribute.
 */
function isApiLink(node) {
  return !!(node && node.nodeName === 'LINK' && node.getAttribute('rel') === 'api');
}
/**
 * A function that processes added nodes to the DOM. It looks for `link` with
 * `rel="api"` attribute and updates reference list of APIs.
 * @param {Array<Element>} nodes
 */
function processAdded(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!isApiLink(node)) {
      continue;
    }
    const apiDef = WebSdkApiFinder.collectInfo(nodes[i]);
    if (apiDef) {
      refList[apiDef.title] = apiDef;
    }
  }
}
/**
 * A function that processes removed nodes to the DOM. It looks for `link` with
 * `rel="api"` attribute and removes the API from reference list and from cache.
 * @param {Array<Element>} nodes
 */
function processRemoved(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!isApiLink(node)) {
      continue;
    }
    const apiDef = WebSdkApiFinder.collectInfo(nodes[i]);
    if (apiDef) {
      delete refList[apiDef.title];
      delete refCache[apiDef.title];
    }
  }
}
/**
 * Callback function for the mutation observer.
 * @param {Array} mutationsList
 */
function apiListObserver(mutationsList) {
  for (const mutation of mutationsList) {
    if (mutation.addedNodes.length) {
      processAdded(mutation.addedNodes);
    }
    if (mutation.removedNodes.length) {
      processRemoved(mutation.removedNodes);
    }
  }
}
/**
 * Observers DOM for mutations and adds an API to the APIs list when it becomes
 * available and removes it when `link` representing API is removed.
 * @param {Object} list A reference to APIs list
 * @param {Object} cache Cached parsed APIs list
 */
export default function observeApis(list, cache) {
  refList = list;
  refCache = cache;
  const config = {
    childList: true,
    subtree: true
  };
  const observer = new MutationObserver(apiListObserver);
  observer.observe(document, config);
}
