// passportConfig.js
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');

module.exports = function(passport) {
  passport.use(new LocalStrategy({
      usernameField: 'aadharCardNumber',
      passwordField: 'password',
      passReqToCallback: false
    },
    async (aadharCardNumber, password, done) => {
      try {
        // aadharCardNumber will come as string from form; convert to number
        const aadhar = Number(aadharCardNumber);
        const user = await User.findOne({ aadharCardNumber: aadhar });
        if (!user) return done(null, false, { message: 'User not found' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password' });

        // success
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-password');
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
