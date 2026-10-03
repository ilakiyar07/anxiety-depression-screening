const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { ANSWER_LABELS } = require('./scoringService');

const GAD7_QUESTIONS = [
  { code: 'GAD7_1', text: 'Feeling nervous, anxious, or on edge', order: 1, type: 'GAD-7', category: 'Anxiety' },
  { code: 'GAD7_2', text: 'Not being able to stop or control worrying', order: 2, type: 'GAD-7', category: 'Anxiety' },
  { code: 'GAD7_3', text: 'Worrying too much about different things', order: 3, type: 'GAD-7', category: 'Anxiety' },
  { code: 'GAD7_4', text: 'Trouble relaxing', order: 4, type: 'GAD-7', category: 'Anxiety' },
  { code: 'GAD7_5', text: 'Being so restless that it is hard to sit still', order: 5, type: 'GAD-7', category: 'Anxiety' },
  { code: 'GAD7_6', text: 'Becoming easily annoyed or irritable', order: 6, type: 'GAD-7', category: 'Anxiety' },
  { code: 'GAD7_7', text: 'Feeling afraid, as if something awful might happen', order: 7, type: 'GAD-7', category: 'Anxiety' }
];

const PHQ9_QUESTIONS = [
  { code: 'PHQ9_1', text: 'Little interest or pleasure in doing things', order: 1, type: 'PHQ-9', category: 'Depression' },
  { code: 'PHQ9_2', text: 'Feeling down, depressed, or hopeless', order: 2, type: 'PHQ-9', category: 'Depression' },
  { code: 'PHQ9_3', text: 'Trouble falling or staying asleep, or sleeping too much', order: 3, type: 'PHQ-9', category: 'Depression' },
  { code: 'PHQ9_4', text: 'Feeling tired or having little energy', order: 4, type: 'PHQ-9', category: 'Depression' },
  { code: 'PHQ9_5', text: 'Poor appetite or overeating', order: 5, type: 'PHQ-9', category: 'Depression' },
  { code: 'PHQ9_6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', order: 6, type: 'PHQ-9', category: 'Depression' },
  { code: 'PHQ9_7', text: 'Trouble concentrating on things, such as reading or studying', order: 7, type: 'PHQ-9', category: 'Depression' },
  { code: 'PHQ9_8', text: 'Moving or speaking so slowly that other people could have noticed, or being fidgety and restless', order: 8, type: 'PHQ-9', category: 'Depression' },
  { code: 'PHQ9_9', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', order: 9, type: 'PHQ-9', category: 'Depression' }
];

async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');
  await db.init();

  // 1. Seed Questions
  const allQuestions = [...GAD7_QUESTIONS, ...PHQ9_QUESTIONS];
  for (const q of allQuestions) {
    await db.run(`
      INSERT INTO questions (code, questionnaire_type, question_text, question_order, category)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        question_text = excluded.question_text,
        question_order = excluded.question_order,
        category = excluded.category
    `, [q.code, q.type, q.text, q.order, q.category]);
  }
  console.log('[Seed] Standardized GAD-7 and PHQ-9 questions seeded.');

  // 2. Seed Users
  const userPasswordHash = bcrypt.hashSync('DemoUser@123', 10);
  const adminPasswordHash = bcrypt.hashSync('AdminPass@123', 10);

  await db.run(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'user')
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = excluded.role
  `, ['Demo Student', 'demo@student.edu', userPasswordHash]);

  await db.run(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'admin')
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = excluded.role
  `, ['System Administrator', 'admin@screening.org', adminPasswordHash]);

  console.log('[Seed] Demo accounts verified: demo@student.edu and admin@screening.org');

  // 3. Seed Sample Historical Screenings for Demo User
  const demoUser = await db.get('SELECT id FROM users WHERE email = ?', ['demo@student.edu']);
  if (demoUser) {
    const existingScreenings = await db.get('SELECT COUNT(*) as count FROM screenings WHERE user_id = ?', [demoUser.id]);
    const count = existingScreenings ? Number(existingScreenings.count) : 0;

    if (count === 0) {
      const dbQuestions = await db.all('SELECT * FROM questions ORDER BY questionnaire_type, question_order');

      // Sample 1: 30 days ago (moderate)
      const date1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      await db.run(`
        INSERT INTO screenings (user_id, screening_date, anxiety_score, anxiety_category, depression_score, depression_category, requires_safety_alert, notes, created_at)
        VALUES (?, ?, 12, 'Moderate Anxiety', 14, 'Moderate Depression', 0, 'Pre-midterm baseline assessment.', ?)
      `, [demoUser.id, date1, date1]);

      // Sample 2: 14 days ago (mild)
      const date2 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      await db.run(`
        INSERT INTO screenings (user_id, screening_date, anxiety_score, anxiety_category, depression_score, depression_category, requires_safety_alert, notes, created_at)
        VALUES (?, ?, 8, 'Mild Anxiety', 9, 'Mild Depression', 0, 'Post-exam follow-up screening.', ?)
      `, [demoUser.id, date2, date2]);

      // Sample 3: 2 days ago (minimal)
      const date3 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const r3 = await db.run(`
        INSERT INTO screenings (user_id, screening_date, anxiety_score, anxiety_category, depression_score, depression_category, requires_safety_alert, notes, created_at)
        VALUES (?, ?, 4, 'Minimal Anxiety', 3, 'Minimal Depression', 0, 'Regular wellness check-in.', ?)
      `, [demoUser.id, date3, date3]);

      if (r3.lastInsertRowid) {
        for (const q of dbQuestions) {
          const val = q.questionnaire_type === 'GAD-7' ? (q.question_order <= 4 ? 1 : 0) : (q.question_order <= 3 ? 1 : 0);
          await db.run(`
            INSERT INTO responses (screening_id, question_id, answer_value, answer_label)
            VALUES (?, ?, ?, ?)
          `, [r3.lastInsertRowid, q.id, val, ANSWER_LABELS[val]]);
        }
      }

      console.log('[Seed] Demo longitudinal screening history created.');
    }
  }

  console.log('[Seed] Database initialization and seed complete.');
}

if (require.main === module) {
  seedDatabase().catch(err => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
