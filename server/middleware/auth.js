const { verifyToken, sanitizeUser } = require('../services/authService');
const { getDb } = require('../config/database');

/**
 * Require valid JWT session token
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in or select a demo persona.'
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || !payload.id) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.'
    });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User account no longer exists.'
    });
  }

  req.user = sanitizeUser(user);
  next();
}

/**
 * Optional authentication: if token is present and valid, attaches req.user; otherwise proceeds as guest
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (payload && payload.id) {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (user) {
      req.user = sanitizeUser(user);
    }
  }

  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
