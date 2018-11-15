const amf = require('amf-client-js');
/* global self */
if (typeof window === 'undefined') {
  // Web worker environment.
  self.amf = amf;
} else {
  window.amf = amf;
}
