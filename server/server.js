const express = require('express');
const session = require('express-session');
const http = require('http');
const handler = require('./request-handler');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(morgan('combined')); // logging
app.use(bodyParser.json());  // body parsing
app.use(bodyParser.urlencoded({ extended: false }));


// creates the req.user property when logged in
const sessionMiddleware = session({
  secret: 'some other thing!?',
  resave: true,
  saveUninitialized: true,
});
app.use(sessionMiddleware);

// Socket Event Listeners
require('./helpRequestsListeners')(io);
require('./screenshareRequestsListeners')(io);


// Set up authentication
const passport = require('./setupPassport');
app.use(passport.initialize());
const passportSessionMiddleware = passport.session();
app.use(passportSessionMiddleware);

const isAuthenticated = (req, res, next) => {
  console.log(1);
  if (req.isAuthenticated()) {
    next();
    return;
  }
  res.redirect('/login');
};

require('./routes.js')(app, passport, handler);

// Non-authenticating static pages
app.use('/components', express.static(`${__dirname}/../public/components`));
app.use('/css', express.static(`${__dirname}/../public/css`));
app.use('/login', express.static(`${__dirname}/../public/login`));

// Authenticating static pages
app.use('/', isAuthenticated, express.static(`${__dirname}/../public`));

server.listen(3000, () => {
  console.log('Tephra listening on port 3000!');
});
