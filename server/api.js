const express = require('express');
const passport = require('passport');
const app = express();

app.disable('etag');
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(passport.initialize());
app.use(passport.session());

app.use('/v1', require('./routes'));

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use((err, req, res) => {
  /* jshint unused:false */
  console.error(err.response);
  res.status(500).send({
    error: true,
    message: err.response || 'Something is wrong...'
  });
});

if (module === require.main) {
  // Start the server
  const server = app.listen(8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
