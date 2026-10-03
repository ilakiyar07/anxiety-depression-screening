const db = require('../config/database');

async function getAdminStatistics(req, res) {
  try {
    const summaryRow = await db.get(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'user') AS regular_students,
        (SELECT COUNT(*) FROM screenings) AS total_screenings,
        COALESCE((SELECT ROUND(AVG(anxiety_score), 2) FROM screenings), 0) AS avg_anxiety_score,
        COALESCE((SELECT ROUND(AVG(depression_score), 2) FROM screenings), 0) AS avg_depression_score,
        (SELECT COUNT(*) FROM screenings WHERE requires_safety_alert = 1) AS safety_alerts_triggered
    `);

    const distributions = {
      anxiety: await db.all(`
        SELECT anxiety_category, COUNT(*) AS count
        FROM screenings
        GROUP BY anxiety_category
        ORDER BY anxiety_category
      `),
      depression: await db.all(`
        SELECT depression_category, COUNT(*) AS count
        FROM screenings
        GROUP BY depression_category
        ORDER BY depression_category
      `)
    };

    const recentScreenings = await db.all(`
      SELECT
        s.id,
        ('Student #' || s.user_id) AS student_code,
        s.screening_date,
        s.anxiety_score,
        s.anxiety_category,
        s.depression_score,
        s.depression_category,
        s.requires_safety_alert
      FROM screenings s
      ORDER BY s.screening_date DESC
      LIMIT 50
    `);

    return res.json({
      summary: {
        totalUsers: Number(summaryRow?.total_users || 0),
        regularStudents: Number(summaryRow?.regular_students || 0),
        totalScreenings: Number(summaryRow?.total_screenings || 0),
        avgAnxietyScore: Number(summaryRow?.avg_anxiety_score || 0),
        avgDepressionScore: Number(summaryRow?.avg_depression_score || 0),
        safetyAlertsTriggered: Number(summaryRow?.safety_alerts_triggered || 0)
      },
      distributions,
      recentScreenings
    });
  } catch (err) {
    console.error('[Admin Statistics Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
}

async function getUsersList(req, res) {
  try {
    const users = await db.all(`
      SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        COUNT(s.id) AS screening_count
      FROM users u
      LEFT JOIN screenings s ON u.id = s.user_id
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);
    return res.json({ users });
  } catch (err) {
    console.error('[Admin Users Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve user accounts.' });
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;
    if (!Number.isInteger(userId) || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'A valid user ID and role (user/admin) are required.' });
    }
    if (userId === Number(req.user.id) && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot remove your own administrator access.' });
    }

    const existing = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existing) return res.status(404).json({ error: 'User account not found.' });

    await db.run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, userId]);
    const user = await db.get(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );
    return res.json({ message: `User role updated to ${role}.`, user });
  } catch (err) {
    console.error('[Admin Role Update Error]', err);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
}

module.exports = { getAdminStatistics, getUsersList, updateUserRole };
