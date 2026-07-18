export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User session missing' });
    }

    // Support case-insensitive role comparisons if needed
    const userRole = req.user.role.toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    const hasAccess = normalizedAllowed.includes(userRole);
    if (!hasAccess) {
      return res.status(403).json({ error: `Forbidden: Required roles [${allowedRoles.join(', ')}]` });
    }

    next();
  };
};
