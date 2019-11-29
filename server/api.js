const express = require('express');
const passport = require('passport');
const chalk = require('chalk');
const boxen = require('boxen');
const app = express();
const os = require('os');

app.disable('etag');
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(passport.initialize());
app.use(passport.session());

app.use('/v1', require('./routes'));
app.use(express.static('./'))

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use((err, req, res) => {
  /* jshint unused:false */
  res.status(500).send({
    error: true,
    message: err.response || 'Something is wrong...'
  });
});

const getNetworkAddress = () => {
  const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const intf of interfaces[name]) {
			const { address, family, internal } = intf;
			if (family === 'IPv4' && !internal) {
				return address;
			}
		}
	}
};

const port = 8080;
const server = app.listen(port, () => {
  const ip = getNetworkAddress();
  const port = server.address().port;
  const localAddress = `http://localhost:${port}`;
	const networkAddress = `http://${ip}:${port}`;

  let message = chalk.green('Serving demo API and www!');
  message += `\n\n${chalk.bold(`- Local:`)} ${localAddress}`;
  message += `\n${chalk.bold('- On Your Network:')}  ${networkAddress}`;

  console.log(boxen(message, {
		padding: 1,
		borderColor: 'green',
		margin: 1
	}));
});

module.exports = app;
