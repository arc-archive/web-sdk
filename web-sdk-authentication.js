class WebSdkAuthenticationElement extends HTMLElement {
  static get observedAttributes() {
    return [
      'type', 'client-id', 'grant-type', 'redirect-uri', 'scopes', 'username', 'password',
      'auth'
    ];
  }

  constructor() {
    super();
    this.__data__ = {};
  }

  get sdk() {
    return this.__data__.sdk;
  }

  set sdk(value) {
    this.__data__.sdk = value;
    this._generateSettings();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    switch (attrName) {
      case 'type':
      case 'scopes':
      case 'username':
      case 'password':
        this[attrName] = newVal;
        break;
      case 'client-id':
        this.clientId = newVal;
        break;
      case 'grant-type':
        this.grantType = newVal;
        break;
      case 'redirect-uri':
        this.redirectUri = newVal;
        break;
    }
    this._generateSettings();
  }

  _generateSettings() {
    if (!this.sdk || !this.type) {
      return;
    }
    const config = this._getSdkAuthConfig();
  }

  _getSdkAuthConfig() {
    const t = this.type;
  }
}
window.customElements.define('web-sdk-authentication', WebSdkAuthenticationElement);
