class WebSdkRequestElement extends HTMLElement {
  static get observedAttributes() {
    return ['endpoint', 'method', 'auto'];
  }

  constructor() {
    super();
    this.__data__ = {};
  }

  get sdk() {
    return this.__data__.sdk;
  }

  set sdk(value) {
    this.__setDataValue('sdk', value);
    this.__requestPropertiesChanged();
  }

  get endpoint() {
    return this.__data__.endpoint;
  }

  set endpoint(value) {
    this.__setDataValue('endpoint', value, {
      reflectToAttribute: true
    });
    this.__requestPropertiesChanged();
  }

  get method() {
    return this.__data__.method;
  }

  set method(value) {
    this.__setDataValue('method', value, {
      reflectToAttribute: true
    });
    this.__requestPropertiesChanged();
  }

  get auto() {
    return this.__data__.auto;
  }

  set auto(value) {
    this.__setDataValue('auto', value, {
      reflectToAttribute: true
    });
    this.__requestPropertiesChanged();
  }

  __setDataValue(prop, value, opts) {
    if (this.__data__[prop] === value) {
      return;
    }
    this.__data__[prop] = value;
    if (!opts) {
      return;
    }
    if (opts.reflectToAttribute) {
      if (this.getAttribute(prop) !== value) {
        if (!value) {
          this.removeAttribute(prop);
        } else {
          if (typeof value === 'boolean') {
            this.setAttribute(prop, '');
          } else {
            this.setAttribute(prop, value);
          }
        }
      }
    }
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    switch (attrName) {
      case 'endpoint': this.endpoint = newVal; break;
      case 'method': this.method = newVal; break;
      case 'auto':
        this.auto = newVal === null ? false : true;
        break;
    }
  }

  __requestPropertiesChanged() {
    if (!this.auto || this.__tryAutoScheduled) {
      return;
    }
    this.__tryAutoScheduled = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.__tryAutoScheduled = false;
        this._tryAutoExecute();
      });
    });
  }

  _tryAutoExecute() {
    if (!this.method || !this.endpoint || !this.sdk) {
      return;
    }
    console.log('Request execution.');
  }
}
window.customElements.define('web-sdk-request', WebSdkRequestElement);
