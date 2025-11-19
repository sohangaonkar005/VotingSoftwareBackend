// middleware/auth.js
exports.ensureAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Authentication required' });
};

exports.ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
};

exports.ensureVoter = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'voter') return next();
  return res.status(403).json({ error: 'Voter access required' });
};
