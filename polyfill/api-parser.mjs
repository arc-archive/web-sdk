// import {amf} from '../lib/amf.js';
// Currently I can't make AMF to work as a ES6 module.
// This will depend on AMF included in main docuemnt.

/* global amf */
amf.plugins.document.WebApi.register();
amf.plugins.document.Vocabularies.register();
amf.plugins.features.AMFValidation.register();

export class WebSdkApiParser {
  /**
   * @param {Object} apiInfo API definitions:
   * - `type` {String} API type, one of the supported types by AMF.
   * Default mime type for the file format is `application/yaml`. If file mime
   * is different (eg. application/json for OAS) then separate mimet with `;`.
   * E.g: `OAS 2.0;application/json`
   * - `href` {String} API location.
   */
  constructor(apiInfo) {
    this.apiInfo = this._getApiTypes(apiInfo.type);
    this.href = apiInfo.href;
  }
  /**
   * Parses the API to AMF object.
   * @return {Promise<Object>} Promise is resolved to AMF object.
   */
  async parse() {
    try {
      await amf.Core.init();
      const doc = await this._parseFile();
      await this._validate(doc);
      return doc;
    } catch (cause) {
      throw new Error(cause.toString());
    }
  }

  _getApiTypes(type) {
    let mime;
    const index = type.indexOf(';');
    if (index !== -1) {
      mime = type.substr(index + 1).trim();
      type = type.substr(0, index);
    }
    if (!mime) {
      mime = 'application/yaml';
    }
    return {
      type,
      mime
    };
  }

  _getApiUrl() {
    const u = new URL(this.href, location.href);
    return u.toString();
  }

  _parseFile() {
    const parser = amf.Core.parser(this.apiInfo.type, this.apiInfo.mime);
    const file = this._getApiUrl();
    return parser.parseFileAsync(file);
  }

  async _validate(doc) {
    let validateProfile;
    switch (this.apiInfo.type) {
      case 'RAML 1.0': validateProfile = amf.ProfileNames.RAML; break;
      case 'RAML 0.8': validateProfile = amf.ProfileNames.RAML08; break;
      case 'OAS 2.0':
      case 'OAS 3.0':
        validateProfile = amf.ProfileNames.OAS;
        break;
    }
    if (!validateProfile) {
      return;
    }
    const result = await amf.AMF.validate(doc, validateProfile)
    if (!result.conforms) {
      /* eslint-disable no-console */
      console.warn('API validation error.');
      console.warn(result.toString());
    }
  }
}
