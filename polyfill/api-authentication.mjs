let amf;
let credentials = {};

export class WebSdkAuthentication {
  constructor(amfApi) {
    amf = amfApi;
  }

  setCredentials(config) {
    if (!config) {
      throw new Error('Authorization configuration not set');
    }
    if (!config.type) {
      throw new Error('Authorization type not set');
    }

    switch (config.type) {
      case 'Basic': this._setBasicCredentials(config); break;
      default:
        throw new Error(`Unknown auhorization type ${config.type}`);
    }
  }

  _setBasicCredentials(config) {
    credentials.Basic = {
      username: config.username,
      password: config.password,
      hash: btoa(`${config.username}:${config.password}`)
    };
  }

  getCredentials(type) {
    if (!type) {
      throw new Error('Authorization type not set');
    }

    switch (type) {
      case 'Basic': this._getBasicCredentials(); break;
      default:
        throw new Error(`Unknown auhorization type ${type}`);
    }
  }

  _getBasicCredentials() {
    if (!credentials.Basic) {
      return;
    }
    return credentials.Basic;
  }

  isAuthenticated() {

  }

  listSecurity(shape) {
    let result = [];
    const rootSecurity = amf.encodes.security;
    if (rootSecurity && rootSecurity.length) {
      result = result.concat(rootSecurity);
    }
    if (shape.security && shape.security.length) {
      result = result.concat(shape.security);
    }
    return result;
  }

  hasSecurity(shape) {
    const rootSecurity = amf.encodes.security;
    if (rootSecurity && rootSecurity.length) {
      return true;
    }
    if (shape.security && shape.security.length) {
      return true;
    }
    return false;
  }
}
