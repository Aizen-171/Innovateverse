/**
 * Server-Enforced Role-Based Access Control (RBAC)
 * Never trusts client-supplied role parameters. Always checks req.user attached by auth middleware.
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Action requires one of the following roles: [${roles.join(', ')}]. Your current role is '${req.user.role}'.`
      });
    }

    next();
  };
}

module.exports = {
  requireRole
};
