// Role-based authorization middleware
// Usage: router.get('/admin', protect, requireRole('admin', 'super_admin'), handler)

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
        your_role: req.user.role,
      });
    }

    next();
  };
};

module.exports = { requireRole };