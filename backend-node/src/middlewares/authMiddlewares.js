import { findById } from '../models/user.js';

export async function isAuthenticated(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Active session not found. Please log in.',
      });
    }

    const user = await findById(req.session.userId);
    if (!user) {
      return req.session.destroy(() => {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User account no longer exists.',
        });
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[isAuthenticated]', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
}

export function hasRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No role found for this user.',
      });
    }

    const normalized = userRole.toLowerCase().trim();
    const isAuthorized = allowedRoles.some((r) => r.toLowerCase() === normalized);

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires one of: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}

export function checkOnboarding(req, res, next) {
  if (req.user?.role === 'coder' && req.user?.first_login) {
    return res.status(403).json({
      error: 'Onboarding Required',
      message: 'Complete the diagnostic assessment first.',
      redirect: '/onboarding',
    });
  }
  next();
}
