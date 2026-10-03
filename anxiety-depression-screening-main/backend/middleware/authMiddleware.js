const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'college_project_jwt_secret_anxiety_depression_2026';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists or session expired.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

module.exports = authMiddleware;
