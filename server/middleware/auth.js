const { verifyToken, sanitizeUser } = require('../services/authService');
const { supabase } = require('../config/supabaseClient');

/**
 * Require valid JWT session token
 */
async function requireAuth(req, res, next) {
  try {
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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.'
      });
    }

    req.user = sanitizeUser(user);
    next();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Authentication verification error.' });
  }
}

/**
 * Optional authentication: if token is present and valid, attaches req.user; otherwise proceeds as guest
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (payload && payload.id) {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.id)
        .maybeSingle();

      if (user) {
        req.user = sanitizeUser(user);
      }
    }

    next();
  } catch {
    req.user = null;
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth
};
