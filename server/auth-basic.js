const passport = require('passport');
const {BasicStrategy} = require('passport-http');

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

// Middleware that requires the user to be logged in. If the user is not logged
// in, it will redirect the user to authorize the application and then return
// them to the original URL they requested.
function authRequired(req, res, next) {
  if (!req.user) {
    return res.sendStatus(401);
  }
  next();
}

module.exports = {
  authRequired
};
