// server.js
const express = require('express');
const app = express();
require('dotenv').config();
const db = require('./db'); // ensures db connects

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const passportConfig = require('./passportConfig');

// session (persisted in mongo)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL_LOCAL }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// passport init
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// routes
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);

// simple root
app.get('/', (req, res) => {
  res.send({ message: 'Voting backend running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('listening on port', PORT));
