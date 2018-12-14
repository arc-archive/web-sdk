export class WebSdkAuthentication {
  onstructor(amf) {
    this.__amf = amf;
  }

  isAuthenticated() {

  }

  listSecurity(shape) {
    let result = [];
    const rootSecurity = this.__amf.encodes.security;
    if (rootSecurity && rootSecurity.length) {
      result = result.concat(rootSecurity);
    }
    if (shape.security && shape.security.length) {
      result = result.concat(shape.security);
    }
    return result;
  }

  hasSecurity(shape) {
    const rootSecurity = this.__amf.encodes.security;
    if (rootSecurity && rootSecurity.length) {
      return true;
    }
    if (shape.security && shape.security.length) {
      return true;
    }
    return false;
  }
}
