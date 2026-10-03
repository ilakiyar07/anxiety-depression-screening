import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Brain,
  HeartPulse,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function ScreeningPage() {
  const navigate = useNavigate();
  const [questionsData, setQuestionsData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1 = GAD-7, 2 = PHQ-9
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await api.getQuestions();
        setQuestionsData(res);
      } catch (err) {
        setError(err.message || 'Failed to load questionnaire questions.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Preparing clinical screening questionnaire...</p>
      </div>
    );
  }

  if (error && !questionsData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <p className="text-rose-800 font-bold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { instruments, options } = questionsData;
  const currentInstrument = currentStep === 1 ? instruments.gad7 : instruments.phq9;
  const currentQuestions = currentInstrument.questions;

  const handleSelectOption = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    // Clear validation error for this question if it was flagged
    setValidationErrors(prev => prev.filter(id => id !== questionId));
  };

  // Validate current step
  const validateStep = (stepQuestions) => {
    const missing = [];
    for (const q of stepQuestions) {
      if (answers[q.id] === undefined || answers[q.id] === null) {
        missing.push(q.id);
      }
    }
    setValidationErrors(missing);
    return missing.length === 0;
  };

  const handleNext = () => {
    setError('');
    const isValid = validateStep(instruments.gad7.questions);
    if (!isValid) {
      setError('Please answer all 7 anxiety screening questions before continuing to Part 2.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    setError('');
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate both instruments
    const allQuestions = [...instruments.gad7.questions, ...instruments.phq9.questions];
    const missing = [];
    for (const q of allQuestions) {
      if (answers[q.id] === undefined || answers[q.id] === null) {
        missing.push(q.id);
      }
    }

    if (missing.length > 0) {
      setValidationErrors(missing);
      setError(`Please complete all required questions (${missing.length} remaining).`);
      return;
    }

    setSubmitting(true);
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: Number(qId),
        answerValue: val
      }));

      const res = await api.submitScreening({
        answers: payloadAnswers,
        notes: notes.trim()
      });

      // Navigate to detailed results page with newly created screening ID
      navigate(`/results/${res.screeningId}`, { replace: true, state: { newlySubmitted: true } });
    } catch (err) {
      setError(err.message || 'Submission failed. Please verify your responses and try again.');
      setSubmitting(false);
    }
  };

  // Calculate overall answered count
  const totalQuestions = (instruments.gad7.questions.length || 0) + (instruments.phq9.questions.length || 0);
  const totalAnswered = Object.keys(answers).length;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto my-8 px-4 pb-12">
      {/* Questionnaire Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentStep === 1 ? 'bg-teal-100 text-teal-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {currentStep === 1 ? <Brain className="w-6 h-6" /> : <HeartPulse className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Part {currentStep} of 2 Assessment
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {currentInstrument.title}
              </h1>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Progress</span>
            <p className="text-lg font-extrabold text-teal-600">{progressPercent}%</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Standardized Clinical Instructions */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <p className="text-xs sm:text-sm font-medium text-slate-700">
            <strong className="text-slate-900 font-semibold">Standard Clinical Instruction:</strong> {currentInstrument.instruction}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Questions Form */}
      <div className="space-y-6">
        {currentQuestions.map((q, index) => {
          const isSelected = answers[q.id] !== undefined;
          const isFlaggedMissing = validationErrors.includes(q.id);

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all ${
                isFlaggedMissing
                  ? 'border-rose-400 ring-2 ring-rose-200'
                  : isSelected
                  ? 'border-teal-200 bg-white shadow-sm'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {q.question_order}
                </span>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium text-slate-900 leading-snug">
                    {q.question_text}
                  </h3>
                  {q.code === 'PHQ9_9' && (
                    <span className="inline-block mt-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                      Sensitive item: Evaluates distress and safety indicators
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Standardized Options Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                {options.map((opt) => {
                  const checked = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        checked
                          ? 'border-teal-600 bg-teal-50/80 text-teal-900 ring-1 ring-teal-500 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold">
                          {opt.label}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          checked ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                        }`}>
                          {checked && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Optional Notes on Step 2 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Confidential Screening Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Preparing for end-of-semester exams; recent sleep disturbances..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>
        )}

        {/* Wizard Navigation Actions */}
        <div className="flex justify-between items-center pt-4">
          {currentStep === 2 ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to GAD-7 (Anxiety)
            </button>
          ) : (
            <div></div>
          )}

          {currentStep === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md shadow-teal-600/20 flex items-center gap-2 transition ml-auto"
            >
              Proceed to Part 2: PHQ-9 (Depression)
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition ml-auto"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Evaluating & Scoring Responses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Screening Assessment
                </>
              )}
            </button>
          )}
        </div>

        {/* Screening Educational Disclaimer Notice */}
        <div className="p-4 bg-slate-100 rounded-2xl flex items-center gap-2.5 text-xs text-slate-500">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Responses are securely calculated on the server and archived confidentially in your profile for historical progress review.
          </span>
        </div>
      </div>
    </div>
  );
}
