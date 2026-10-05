const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function getProfile(req, res) {
  try {
    const user = await db.get(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COUNT(s.id) as total_screenings
      FROM users u
      LEFT JOIN screenings s ON u.id = s.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [req.user.id]);

    return res.json({ profile: user });
  } catch (err) {
    console.error('[Get Profile Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve profile information.' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
    }

    await db.run(
      'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), req.user.id]
    );

    const updatedUser = await db.get(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('[Update Profile Error]', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please enter both current and new passwords.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    const user = await db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const valid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, req.user.id]
    );

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[Update Password Error]', err);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
}

module.exports = { getProfile, updateProfile, updatePassword };
