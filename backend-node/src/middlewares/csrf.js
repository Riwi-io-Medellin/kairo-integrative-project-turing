/**
 * middlewares/csrf.js
 *
 * Lightweight CSRF protection for session-based API.
 * Validates the Origin header on state-changing requests
 * (POST, PUT, PATCH, DELETE) against the list of allowed origins.
 *
 * Safe methods (GET, HEAD, OPTIONS) are exempt per the HTTP spec.
 *
 * This approach is appropriate for SPA + REST API architectures
 * where the session cookie is the authentication mechanism.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Build the CSRF middleware bound to the given list of allowed origins.
 * @param {string[]} allowedOrigins
 * @returns Express middleware
 */
export function csrfProtection(allowedOrigins) {
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const origin = req.get('Origin') || req.get('Referer');

    if (!origin) {
      // Requests with no Origin/Referer are only allowed in same-origin browser
      // contexts or server-to-server calls. For safety, block them here.
      // Server-to-server integrations should use a dedicated service account
      // and not rely on the session cookie.
      return res.status(403).json({
        error: 'CSRF',
        message: 'Missing Origin header. Cross-site requests are not allowed.',
      });
    }

    const originUrl = new URL(origin);
    const originBase = `${originUrl.protocol}//${originUrl.host}`;

    if (!allowedOrigins.includes(originBase)) {
      return res.status(403).json({
        error: 'CSRF',
        message: `Origin '${originBase}' is not allowed.`,
      });
    }

    next();
  };
}
