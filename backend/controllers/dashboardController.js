const db = require('../config/database');
const { interpretGAD7, interpretPHQ9 } = require('../services/scoringService');

async function getDashboardData(req, res) {
  try {
    const userId = req.user.id;

    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM screenings WHERE user_id = ?',
      [userId]
    );
    const totalScreenings = countResult ? Number(countResult.total) : 0;

    const latestScreening = await db.get(`
      SELECT * FROM screenings
      WHERE user_id = ?
      ORDER BY screening_date DESC
      LIMIT 1
    `, [userId]);

    const historyTrends = await db.all(`
      SELECT id, screening_date, anxiety_score, anxiety_category,
             depression_score, depression_category, requires_safety_alert
      FROM (
        SELECT * FROM screenings
        WHERE user_id = ?
        ORDER BY screening_date DESC
        LIMIT 10
      ) AS recent_screenings
      ORDER BY screening_date ASC
    `, [userId]);

    const chartData = {
      labels: historyTrends.map(item =>
        new Date(item.screening_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      ),
      anxietyScores: historyTrends.map(item => Number(item.anxiety_score)),
      depressionScores: historyTrends.map(item => Number(item.depression_score)),
      dates: historyTrends.map(item => item.screening_date)
    };

    let latestAnxietyInfo = null;
    let latestDepressionInfo = null;
    if (latestScreening) {
      latestAnxietyInfo = interpretGAD7(latestScreening.anxiety_score);
      latestDepressionInfo = interpretPHQ9(latestScreening.depression_score);
    }

    return res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      stats: {
        totalScreenings,
        latestScreening: latestScreening || null,
        latestAnxiety: latestAnxietyInfo,
        latestDepression: latestDepressionInfo
      },
      trends: chartData,
      recentScreenings: historyTrends.slice().reverse().slice(0, 5)
    });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve dashboard overview data.' });
  }
}

module.exports = { getDashboardData };
