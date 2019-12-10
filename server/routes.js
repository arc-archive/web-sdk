const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const { BasicStrategy } = require('passport-http');
const cors = require('cors');
const { DataGenerator } = require('./DataGenerator.js');

const router = express.Router();
router.use(bodyParser.raw());

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
    router.get('/people', cors(this._processCors), this._collectionHandler);
    router.get('/people/:id', cors(this._processCors), this._collectionItemHandler);
    router.post('/', cors(this._processCors), this._indexPostHandler);
    router.get('/auth/basic', cors(this._processCors),
      passport.authenticate('basic', {session: false}), this._basicAuthHandler);
  }

  async _sendEcho(req, res) {
    const data = {};
    data.success = true;
    data.headers = req.headers;
    if (req.body) {
      data.body = req.body.toString();
    }
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

  _collectionHandler(req, res) {
    const { limit } = req.query;
    const itemsLimit = isNaN(limit) ? undefined : Number(limit);
    const items = DataGenerator.createCollection(itemsLimit);
    const response = {
      items,
    };
    res.send(response);
  }

  _collectionItemHandler(req, res) {
    const item = DataGenerator.createResource();
    res.send(item);
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
