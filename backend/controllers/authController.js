const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'college_project_jwt_secret_anxiety_depression_2026';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email address, and password.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const info = await db.run(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'user')
    `, [name.trim(), cleanEmail, passwordHash]);

    const newUser = await db.get(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [info.lastInsertRowid]
    );

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: 'A server error occurred during registration. Please try again.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: 'A server error occurred during login. Please try again.' });
  }
}

function getMe(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, getMe };
