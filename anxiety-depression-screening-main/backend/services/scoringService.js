/**
 * Clinical Scoring Service for Standardized GAD-7 and PHQ-9 instruments.
 * Note: These scores provide educational screening metrics, NOT a medical diagnosis.
 */

// GAD-7 Anxiety Interpretation Bands
function interpretGAD7(score) {
  if (score <= 4) {
    return {
      score,
      maxScore: 21,
      category: 'Minimal Anxiety',
      level: 'minimal',
      color: 'emerald',
      description: 'Your screening responses indicate minimal symptoms of anxiety within standard baseline levels.',
      recommendations: [
        'Continue regular sleep routines, physical activity, and stress management.',
        'Practice daily mindfulness or breathing exercises for preventive mental wellness.',
        'Retake screening periodically if you notice changes in your stress levels.'
      ]
    };
  } else if (score <= 9) {
    return {
      score,
      maxScore: 21,
      category: 'Mild Anxiety',
      level: 'mild',
      color: 'blue',
      description: 'Your responses indicate mild anxiety symptoms that may occasionally cause discomfort.',
      recommendations: [
        'Explore stress-reduction techniques like progressive muscle relaxation or guided meditation.',
        'Maintain balanced daily schedules, healthy nutrition, and supportive social connections.',
        'Consider keeping a mood and stress journal to identify anxiety triggers.'
      ]
    };
  } else if (score <= 14) {
    return {
      score,
      maxScore: 21,
      category: 'Moderate Anxiety',
      level: 'moderate',
      color: 'amber',
      description: 'Your responses indicate moderate anxiety symptoms that may be interfering with daily routines or academic work.',
      recommendations: [
        'Consider speaking with a university counselor, psychologist, or licensed therapist.',
        'Cognitive Behavioral Therapy (CBT) techniques can offer structured anxiety management tools.',
        'Share how you feel with a supportive family member, close mentor, or healthcare provider.'
      ]
    };
  } else {
    return {
      score,
      maxScore: 21,
      category: 'Severe Anxiety',
      level: 'severe',
      color: 'rose',
      description: 'Your responses indicate significant anxiety symptoms that likely impair day-to-day comfort and productivity.',
      recommendations: [
        'We strongly encourage reaching out to a qualified healthcare or mental health professional for a clinical evaluation.',
        'Schedule an appointment with your campus counseling center or primary healthcare clinic.',
        'Do not hesitate to ask for academic or personal accommodations while managing your wellness.'
      ]
    };
  }
}

// PHQ-9 Depression Interpretation Bands
function interpretPHQ9(score, item9Score = 0) {
  let base;
  if (score <= 4) {
    base = {
      score,
      maxScore: 27,
      category: 'Minimal Depression',
      level: 'minimal',
      color: 'emerald',
      description: 'Your screening responses reflect minimal or absent depressive symptoms.',
      recommendations: [
        'Maintain positive daily routines, physical activities, and healthy sleep schedules.',
        'Stay connected with friends, family, and hobbies that bring you joy.',
        'Practice self-compassion during challenging academic or personal periods.'
      ]
    };
  } else if (score <= 9) {
    base = {
      score,
      maxScore: 27,
      category: 'Mild Depression',
      level: 'mild',
      color: 'blue',
      description: 'Your responses indicate mild depressive symptoms that may periodically lower your energy or motivation.',
      recommendations: [
        'Monitor your mood and engage in regular, light exercise or nature walks.',
        'Break down large academic tasks into smaller, manageable milestones.',
        'Consider campus counseling services if symptoms persist for more than a few weeks.'
      ]
    };
  } else if (score <= 14) {
    base = {
      score,
      maxScore: 27,
      category: 'Moderate Depression',
      level: 'moderate',
      color: 'amber',
      description: 'Your responses indicate moderate depressive symptoms affecting your energy, mood, or concentration.',
      recommendations: [
        'Consulting a medical or mental health professional for a clinical evaluation is recommended.',
        'Talk therapy (such as CBT or interpersonal counseling) has proven efficacy for moderate symptoms.',
        'Establish consistent sleep hygiene and lean on trusted friends or family.'
      ]
    };
  } else if (score <= 19) {
    base = {
      score,
      maxScore: 27,
      category: 'Moderately Severe Depression',
      level: 'moderately_severe',
      color: 'orange',
      description: 'Your responses indicate moderately severe depressive symptoms noticeably impacting your daily functioning.',
      recommendations: [
        'Consulting a clinical psychologist or psychiatrist for personalized treatment is strongly advised.',
        'Combine professional therapeutic support with structured wellness habits.',
        'Notify a trusted mentor, counselor, or loved one so you do not carry this alone.'
      ]
    };
  } else {
    base = {
      score,
      maxScore: 27,
      category: 'Severe Depression',
      level: 'severe',
      color: 'rose',
      description: 'Your responses indicate severe depressive symptoms that substantially interfere with your well-being.',
      recommendations: [
        'Prompt clinical evaluation by a licensed mental health professional or psychiatrist is strongly encouraged.',
        'Contact your college health center or a specialized mental health clinic right away.',
        'Reach out to trusted support systems and utilize crisis helpline services if overwhelmed.'
      ]
    };
  }

  // Question 9 safety alert check
  const requiresSafetyAlert = item9Score > 0 || score >= 20;
  base.requiresSafetyAlert = requiresSafetyAlert;
  base.item9Score = item9Score;

  return base;
}

/**
 * Validates and scores submitted responses for GAD-7 and PHQ-9.
 * @param {Array} rawResponses - Array of { questionId, code, answerValue, questionnaireType }
 */
function calculateScores(rawResponses) {
  let anxietyScore = 0;
  let depressionScore = 0;
  let phq9Item9Score = 0;
  let gad7Count = 0;
  let phq9Count = 0;

  for (const item of rawResponses) {
    const val = Number(item.answerValue);
    if (isNaN(val) || val < 0 || val > 3) {
      throw new Error(`Invalid answer value ${item.answerValue} for question ${item.questionId || item.code}`);
    }

    if (item.questionnaireType === 'GAD-7') {
      anxietyScore += val;
      gad7Count++;
    } else if (item.questionnaireType === 'PHQ-9') {
      depressionScore += val;
      phq9Count++;
      if (item.code === 'PHQ9_9' || item.questionOrder === 9) {
        phq9Item9Score = val;
      }
    }
  }

  if (gad7Count !== 7) {
    throw new Error(`Incomplete GAD-7 questionnaire: expected 7 responses, received ${gad7Count}`);
  }
  if (phq9Count !== 9) {
    throw new Error(`Incomplete PHQ-9 questionnaire: expected 9 responses, received ${phq9Count}`);
  }

  const anxietyInterpretation = interpretGAD7(anxietyScore);
  const depressionInterpretation = interpretPHQ9(depressionScore, phq9Item9Score);

  return {
    anxiety: anxietyInterpretation,
    depression: depressionInterpretation,
    requiresSafetyAlert: depressionInterpretation.requiresSafetyAlert
  };
}

const ANSWER_LABELS = {
  0: 'Not at all',
  1: 'Several days',
  2: 'More than half the days',
  3: 'Nearly every day'
};

module.exports = {
  interpretGAD7,
  interpretPHQ9,
  calculateScores,
  ANSWER_LABELS
};
