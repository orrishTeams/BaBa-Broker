export const requireRole = (roles) => {
  const allowed = (Array.isArray(roles) ? roles : [roles]).map((r) => String(r).trim().toLowerCase());
  return (req, res, next) => {
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    if (!req.user || !userRole || !allowed.includes(userRole)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
};
