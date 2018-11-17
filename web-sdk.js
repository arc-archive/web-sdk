class WebSdkElement extends HTMLElement {
  constructor() {
    super();
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
    return ['api'];
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

  get ready() {
    if (!this.__data__.readyPromise) {
      this.__data__.readyPromise = new Promise((resolve, reject) => {
        this.__readyResolve = resolve;
        this.__readyReject = reject;
      });
    }
    return this.__data__.readyPromise;
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
    }
  }

  __processSlotRemoved(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!this._isWebSdkElement(node)) {
        continue;
      }
      this._propagateSdk(node, undefined);
    }
  }

  _propagateSdkAll(sdk) {
    const slot = this.shadowRoot.querySelector('#slot');
    const nodes = slot.assignedNodes();
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
}
window.customElements.define('web-sdk', WebSdkElement);
