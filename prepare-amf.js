const browserify = require('browserify');
const fs = require('fs-extra');
function nodeToBrowser(file, ignore) {
  return new Promise((resolve) => {
    const b = browserify();
    b.add(file);
    if (ignore) {
      b.ignore(ignore);
    }
    b.bundle((err, buf) => {
      if (err) {
        console.log(err);
      }
      resolve(buf.toString());
    });
  });
}

function build() {
  return fs.ensureDir('lib')
  .then(() => nodeToBrowser('lib/amf-export.js'))
  .then((content) => fs.writeFile('lib/amf.js', content, 'utf8'));
}

build()
.then(() => {
  console.log('Completed.');
})
.catch((cause) => console.error(cause));
