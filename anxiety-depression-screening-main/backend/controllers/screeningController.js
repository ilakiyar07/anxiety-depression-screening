const db = require('../config/database');
const { calculateScores, interpretGAD7, interpretPHQ9, ANSWER_LABELS } = require('../services/scoringService');

async function getQuestions(req, res) {
  try {
    const questions = await db.all(`
      SELECT id, code, questionnaire_type, question_text, question_order, category
      FROM questions
      ORDER BY questionnaire_type ASC, question_order ASC
    `);

    const gad7 = questions.filter(q => q.questionnaire_type === 'GAD-7');
    const phq9 = questions.filter(q => q.questionnaire_type === 'PHQ-9');
    const options = [
      { value: 0, label: 'Not at all', description: '0 days in past 2 weeks' },
      { value: 1, label: 'Several days', description: '1-6 days in past 2 weeks' },
      { value: 2, label: 'More than half the days', description: '7-11 days in past 2 weeks' },
      { value: 3, label: 'Nearly every day', description: '12-14 days in past 2 weeks' }
    ];

    return res.json({
      instruments: {
        gad7: {
          title: 'Generalized Anxiety Disorder 7-item (GAD-7)',
          instruction: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
          questions: gad7
        },
        phq9: {
          title: 'Patient Health Questionnaire 9-item (PHQ-9)',
          instruction: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
          questions: phq9
        }
      },
      options,
      disclaimer: 'This screening tool is for educational and self-reflection purposes only and does not constitute a clinical diagnosis.'
    });
  } catch (err) {
    console.error('[Get Questions Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve screening questions.' });
  }
}

async function submitScreening(req, res) {
  try {
    const userId = req.user.id;
    const { answers, notes } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Please submit responses for all questionnaire items.' });
    }

    const dbQuestions = await db.all(
      'SELECT id, code, questionnaire_type, question_order FROM questions'
    );
    const questionMap = new Map(dbQuestions.map(q => [Number(q.id), q]));

    const enrichedResponses = [];
    for (const ans of answers) {
      const questionId = Number(ans.questionId);
      const answerValue = Number(ans.answerValue);
      const q = questionMap.get(questionId);
      if (!q) {
        return res.status(400).json({ error: `Question with ID ${ans.questionId} not found.` });
      }
      if (![0, 1, 2, 3].includes(answerValue)) {
        return res.status(400).json({ error: `Invalid answer value for question ${ans.questionId}.` });
      }
      enrichedResponses.push({
        questionId: q.id,
        code: q.code,
        questionnaireType: q.questionnaire_type,
        questionOrder: q.question_order,
        answerValue
      });
    }

    let calculated;
    try {
      calculated = calculateScores(enrichedResponses);
    } catch (scoringErr) {
      return res.status(400).json({ error: scoringErr.message });
    }

    const screeningId = await db.transaction(async tx => {
      const screeningInfo = await tx.run(`
        INSERT INTO screenings (
          user_id, screening_date, anxiety_score, anxiety_category,
          depression_score, depression_category, requires_safety_alert, notes
        )
        VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        calculated.anxiety.score,
        calculated.anxiety.category,
        calculated.depression.score,
        calculated.depression.category,
        calculated.requiresSafetyAlert ? 1 : 0,
        notes || null
      ]);

      const id = screeningInfo.lastInsertRowid;
      for (const item of enrichedResponses) {
        const label = ANSWER_LABELS[item.answerValue] || 'Unknown';
        await tx.run(`
          INSERT INTO responses (screening_id, question_id, answer_value, answer_label)
          VALUES (?, ?, ?, ?)
        `, [id, item.questionId, item.answerValue, label]);
      }
      return id;
    });

    const createdScreening = await db.get('SELECT * FROM screenings WHERE id = ?', [screeningId]);

    return res.status(201).json({
      message: 'Screening assessment successfully submitted and evaluated.',
      screeningId,
      screening: createdScreening,
      anxiety: calculated.anxiety,
      depression: calculated.depression,
      requiresSafetyAlert: calculated.requiresSafetyAlert,
      crisisResources: {
        helplineName: 'Tele-MANAS (Govt of India Comprehensive Mental Health)',
        tollFree: '14416 / 1800 891 4416',
        internationalHotline: '988 Suicide & Crisis Lifeline',
        vandrevalaFoundation: '+91 9999 666 555',
        kiranHelpline: '1800-599-0019',
        emergencyNumber: '112 / 911'
      }
    });
  } catch (err) {
    console.error('[Submit Screening Error]', err);
    return res.status(500).json({ error: 'Failed to process and score screening assessment.' });
  }
}

async function getScreenings(req, res) {
  try {
    const screenings = await db.all(`
      SELECT id, user_id, screening_date, anxiety_score, anxiety_category,
             depression_score, depression_category, requires_safety_alert, notes, created_at
      FROM screenings
      WHERE user_id = ?
      ORDER BY screening_date DESC
    `, [req.user.id]);
    return res.json({ screenings });
  } catch (err) {
    console.error('[Get Screenings Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve screening history.' });
  }
}

async function getScreeningById(req, res) {
  try {
    const { id } = req.params;
    const screening = await db.get(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM screenings s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!screening) return res.status(404).json({ error: 'Screening assessment record not found.' });
    if (req.user.role !== 'admin' && Number(screening.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized to view this screening record.' });
    }

    const responses = await db.all(`
      SELECT r.id, r.question_id, r.answer_value, r.answer_label,
             q.code, q.question_text, q.question_order, q.questionnaire_type, q.category
      FROM responses r
      JOIN questions q ON r.question_id = q.id
      WHERE r.screening_id = ?
      ORDER BY q.questionnaire_type ASC, q.question_order ASC
    `, [id]);

    const anxietyInterpretation = interpretGAD7(Number(screening.anxiety_score));
    const q9Response = responses.find(r => r.code === 'PHQ9_9');
    const item9Score = q9Response ? Number(q9Response.answer_value) : 0;
    const depressionInterpretation = interpretPHQ9(Number(screening.depression_score), item9Score);

    return res.json({
      screening,
      responses,
      anxiety: anxietyInterpretation,
      depression: depressionInterpretation,
      requiresSafetyAlert: Number(screening.requires_safety_alert) === 1,
      crisisResources: {
        helplineName: 'Tele-MANAS (Govt of India Comprehensive Mental Health)',
        tollFree: '14416 / 1800 891 4416',
        internationalHotline: '988 Suicide & Crisis Lifeline',
        vandrevalaFoundation: '+91 9999 666 555',
        kiranHelpline: '1800-599-0019',
        emergencyNumber: '112 / 911'
      }
    });
  } catch (err) {
    console.error('[Get Screening Details Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve screening details.' });
  }
}

module.exports = { getQuestions, submitScreening, getScreenings, getScreeningById };
