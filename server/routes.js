const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const {BasicStrategy} = require('passport-http');
const cors = require('cors');

const router = express.Router();
router.use(bodyParser.json());

passport.use(new BasicStrategy(
  function(userid, password, done) {
    console.log('AUTH', userid, password);
    setTimeout(() => {
      if (userid === 'demo-user' && password === 'demo-password') {
        done(null, false);
      } else {
        done(null, {
          username: 'demo-user',
          name: 'Demo user'
        });
      }
    });
  }
));

class ApiRoute {
  constructor() {
    this._indexHandler = this._indexHandler.bind(this);
    this._indexPostHandler = this._indexPostHandler.bind(this);
    this._basicAuthHandler = this._basicAuthHandler.bind(this);
    this._processCors = this._processCors.bind(this);
  }

  createRoutes() {
    router.options('*', cors(this._processCors));
    router.get('/', cors(this._processCors), this._indexHandler);
    router.post('/', cors(this._processCors), this._indexPostHandler);
    router.get('/auth/basic', cors(this._processCors),
      passport.authenticate('basic', {session: false}), this._basicAuthHandler);
  }

  _sendEcho(req, res) {
    const data = {};
    const body = req.body ? Object.assign(req.body) : undefined;
    data.success = true;
    data.headers = req.headers;
    if (body) {
      data.body = body;
    }
    res.set('Access-Control-Allow-Origin', 'http://127.0.0.1:8081');
    res.send(data);
  }

  _indexHandler(req, res) {
    res.send({
      success: true
    });
  }

  _indexPostHandler(req, res) {
    this._sendEcho(req, res);
  }

  _basicAuthHandler(req, res) {
    this._sendEcho(req, res);
  }

  _processCors(req, callback) {
    const origin = req.header('Origin');
    let corsOptions;
    if (!origin) {
      corsOptions = {origin: false};
    } else if (origin.indexOf('http://localhost:') === 0 || origin.indexOf('http://127.0.0.1:') === 0) {
      corsOptions = {origin: true};
    }
    if (corsOptions) {
      corsOptions.credentials = true;
      corsOptions.allowedHeaders = ['Content-Type', 'Authorization'];
    }
    callback(null, corsOptions);
  }
}

const api = new ApiRoute();
api.createRoutes();
module.exports = router;
