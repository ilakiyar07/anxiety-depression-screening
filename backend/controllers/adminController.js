const db = require('../config/database');

async function getAdminStatistics(req, res) {
  try {
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const regularUserCount = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const screeningCount = await db.get('SELECT COUNT(*) as count FROM screenings');

    const avgScores = await db.get(`
      SELECT AVG(anxiety_score) as avg_anxiety,
             AVG(depression_score) as avg_depression,
             SUM(CASE WHEN requires_safety_alert = 1 THEN 1 ELSE 0 END) as safety_alerts_count
      FROM screenings
    `);

    const anxietyDist = await db.all(`
      SELECT anxiety_category, COUNT(*) as count
      FROM screenings
      GROUP BY anxiety_category
    `);

    const depressionDist = await db.all(`
      SELECT depression_category, COUNT(*) as count
      FROM screenings
      GROUP BY depression_category
    `);

    const recentScreenings = await db.all(`
      SELECT s.id, s.screening_date, s.anxiety_score, s.anxiety_category,
             s.depression_score, s.depression_category, s.requires_safety_alert,
             s.user_id,
             ('Student #' || s.user_id) as student_code,
             u.name as student_name,
             u.email as student_email
      FROM screenings s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.screening_date DESC
      LIMIT 25
    `);

    const avgAnxiety = avgScores && avgScores.avg_anxiety !== null
      ? Number(avgScores.avg_anxiety)
      : 0;
    const avgDepression = avgScores && avgScores.avg_depression !== null
      ? Number(avgScores.avg_depression)
      : 0;

    return res.json({
      summary: {
        totalUsers: Number(userCount?.count || 0),
        regularStudents: Number(regularUserCount?.count || 0),
        totalScreenings: Number(screeningCount?.count || 0),
        avgAnxietyScore: Number(avgAnxiety.toFixed(1)),
        avgDepressionScore: Number(avgDepression.toFixed(1)),
        safetyAlertsTriggered: Number(avgScores?.safety_alerts_count || 0)
      },
      distributions: {
        anxiety: anxietyDist.map(row => ({ ...row, count: Number(row.count) })),
        depression: depressionDist.map(row => ({ ...row, count: Number(row.count) }))
      },
      recentScreenings: recentScreenings.map(row => ({
        ...row,
        anxiety_score: Number(row.anxiety_score),
        depression_score: Number(row.depression_score),
        requires_safety_alert: Number(row.requires_safety_alert || 0)
      }))
    });
  } catch (err) {
    console.error('[Admin Statistics Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
}

async function getUsersList(req, res) {
  try {
    const users = await db.all(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COUNT(s.id) as screening_count,
             MAX(s.screening_date) as last_screening_date
      FROM users u
      LEFT JOIN screenings s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return res.json({
      users: users.map(user => ({
        ...user,
        screening_count: Number(user.screening_count || 0)
      }))
    });
  } catch (err) {
    console.error('[Admin Get Users Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve registered users list.' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'user' && role !== 'admin')) {
      return res.status(400).json({ error: 'Role must be either "user" or "admin".' });
    }

    if (Number(id) === Number(req.user.id) && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove administrative privileges from your own active session.' });
    }

    await db.run(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, id]
    );

    const updated = await db.get(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [id]
    );

    return res.json({ message: 'User role updated successfully.', user: updated });
  } catch (err) {
    console.error('[Admin Update User Role Error]', err);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
}

module.exports = { getAdminStatistics, getUsersList, updateUserRole };
