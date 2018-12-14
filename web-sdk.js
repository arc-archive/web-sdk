const authNodeName = 'WEB-SDK-AUTHENTICATION';

class WebSdkElement extends HTMLElement {
  constructor() {
    super();
    this._authenticationChanged = this._authenticationChanged.bind(this);
    this.__data__ = {};
    this.__createDom();
    this.__observeSlot();
  }

  __createDom() {
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = `<style>:host{display: none !important;}</style>
    <slot id="slot"></slot>`;
  }

  __observeSlot() {
    this._slotChangeHandler = this._slotChangeHandler.bind(this);
    const config = {
      childList: true
    };
    const observer = new MutationObserver(this._slotChangeHandler);
    observer.observe(this, config);
  }

  static get observedAttributes() {
    return ['api', 'auth'];
  }

  get api() {
    return this.__data__.api;
  }

  set api(value) {
    if (this.sdk) {
      this.sdk = undefined;
    }
    this.__data__.api = value;
    this.__initializeApi();
  }

  get sdk() {
    return this.__data__.sdk;
  }

  set sdk(value) {
    this.__data__.sdk = value;
    this._propagateSdkAll(value);
  }

  get auth() {
    return this.__data__.auth;
  }

  set auth(value) {
    this.__data__.auth = value;
    this._setupAuth();
  }

  set authenticated(value) {
    if (value && !this.hasAttribute('authenticated')) {
      this.setAttribute('authenticated', '');
    } else if (!value && this.hasAttribute('authenticated')) {
      this.removeAttribute('authenticated');
    }
    this.__data__.authenticated = value;
    this._propagateAuthenticated(value);
  }

  get authenticated() {
    return this.__data__.authenticated;
  }

  get ready() {
    if (!this.__data__.readyPromise) {
      this.__data__.readyPromise = new Promise((resolve, reject) => {
        this.__readyResolve = resolve;
        this.__readyReject = reject;
      });
    }
    return this.__data__.readyPromise;
  }

  _getChildren() {
    const slot = this.shadowRoot.querySelector('#slot');
    return slot.assignedNodes();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    switch (attrName) {
      case 'api': this.api = newVal; break;
    }
  }

  __initializeApi() {
    const p = this.ready;
    return navigator.sdk.ready()
    .then(() => navigator.sdk.api(this.api))
    .then((sdk) => {
      this.sdk = sdk;
      this.__readyResolve();
      this.__dispatchReady();
      return p;
    });
  }

  __dispatchReady() {
    this.dispatchEvent(new CustomEvent('ready'));
  }

  _slotChangeHandler(mutationsList) {
    for (let mutation of mutationsList) {
      if (mutation.addedNodes.length) {
        this.__processSlotAdded(mutation.addedNodes);
      }
      if (mutation.removedNodes.length) {
        this.__processSlotRemoved(mutation.removedNodes);
      }
    }
  }

  __processSlotAdded(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!this._isWebSdkElement(node)) {
        continue;
      }
      this._propagateSdk(node, this.sdk);
      if (node.nodeName.indexOf(authNodeName) !== -1) {
        this._setAuthComponent(node);
      }
    }
  }

  __processSlotRemoved(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!this._isWebSdkElement(node)) {
        continue;
      }
      this._propagateSdk(node, undefined);
      if (node.nodeName.indexOf(authNodeName) !== -1) {
        this._removeAuthComponent(node);
      }
    }
  }

  _propagateSdkAll(sdk) {
    const nodes = this._getChildren();
    for (let i = 0, len = nodes.length; i < len; i++) {
      const node = nodes[i];
      if (!this._isWebSdkElement(node)) {
        continue;
      }
      this._propagateSdk(node, sdk);
    }
  }

  _propagateSdk(node, sdk) {
    node.sdk = sdk;
  }

  _isWebSdkElement(node) {
    return !!(node && node.nodeName.indexOf('WEB-SDK-') === 0);
  }

  _setupAuth() {
    if (!this.authComponent || !this.auth) {
      return;
    }
  }

  _setAuthComponent(node) {
    this.authComponent = node;
    this.authenticated = node.authenticated;
    node.addEventListener('authentication-changed', this._authenticationChanged);
  }

  _removeAuthComponent(node) {
    if (this.authComponent !== node) {
      return;
    }
    node.removeEventListener('authentication-changed', this._authenticationChanged);
    this.authComponent = undefined;
    this._lookupAuthComponent();
  }

  _lookupAuthComponent() {
    const nodes = this._getChildren();
    for (let i = 0, len = nodes.length; i < len; i++) {
      if (nodes[i].nodeName === authNodeName) {
        this._setAuthComponent(nodes[i]);
        break;
      }
    }
  }

  _authenticationChanged(e) {
    this.authenticated = e.target.authenticated;
  }

  _propagateAuthenticated(value) {
    const nodes = this._getChildren();
    for (let i = 0, len = nodes.length; i < len; i++) {
      const node = nodes[i];
      if (!this._isWebSdkElement(node) || node.nodeName.indexOf(authNodeName) !== -1) {
        continue;
      }
      node.authenticated = value;
    }
  }
}
window.customElements.define('web-sdk', WebSdkElement);
