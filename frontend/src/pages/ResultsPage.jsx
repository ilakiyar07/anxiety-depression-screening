import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import ScoreGauge from '../components/ScoreGauge';
import CrisisModal from '../components/CrisisModal';
import {
  Printer,
  History,
  LayoutDashboard,
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Sparkles,
  Info
} from 'lucide-react';

export default function ResultsPage() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showDetailedResponses, setShowDetailedResponses] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await api.getScreeningById(id);
        setData(res);
        // Automatically open crisis modal if safety alert is triggered on newly submitted assessment
        if (res.requiresSafetyAlert && location.state?.newlySubmitted) {
          setShowCrisisModal(true);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve screening assessment results.');
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Computing clinical interpretation & guidance...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-rose-800">Result Not Found</h2>
        <p className="text-rose-600 text-sm mt-1">{error || 'This screening record may not exist or belongs to another user.'}</p>
        <Link
          to="/dashboard"
          className="inline-block mt-4 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { screening, responses, anxiety, depression, requiresSafetyAlert, crisisResources } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4 pb-16 space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-teal-600">Screening Evaluation Summary</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Assessment Results
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5" />
            Completed on {new Date(screening.screening_date).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
          <Link
            to="/dashboard"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* Safety Alert Banner if Triggered */}
      {requiresSafetyAlert && (
        <div className="p-6 bg-rose-50/90 border border-rose-200 rounded-3xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-rose-900">Important Safety & Support Alert</h3>
                <button
                  onClick={() => setShowCrisisModal(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shrink-0"
                >
                  View Crisis Numbers
                </button>
              </div>
              <p className="text-xs sm:text-sm text-rose-800 mt-2 leading-relaxed">
                Your screening responses indicated feelings of emotional distress or thoughts related to self-harm. Please remember that you do not have to carry this alone. Confidential, compassionate, and free professional support is immediately accessible.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-rose-900">
                <span>Tele-MANAS: <a href="tel:14416" className="underline">14416</a></span>
                <span>• Vandrevala: <a href="tel:+919999666555" className="underline">+91 9999 666 555</a></span>
                <span>• National Crisis Lifeline: <a href="tel:988" className="underline">988</a></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Visual Score Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreGauge
          type="Anxiety Assessment (GAD-7)"
          title="Anxiety Severity"
          score={anxiety.score}
          maxScore={anxiety.maxScore}
          category={anxiety.category}
          level={anxiety.level}
        />

        <ScoreGauge
          type="Depression Assessment (PHQ-9)"
          title="Depression Severity"
          score={depression.score}
          maxScore={depression.maxScore}
          category={depression.category}
          level={depression.level}
        />
      </div>

      {/* Clinical Interpretations and Actionable Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Anxiety Interpretation */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              <h3 className="font-bold text-slate-900 text-base">Anxiety Analysis (GAD-7)</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
              {anxiety.description}
            </p>
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recommended Action Steps:
              </p>
              <ul className="text-xs text-slate-600 space-y-2">
                {anxiety.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Depression Interpretation */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <h3 className="font-bold text-slate-900 text-base">Depression Analysis (PHQ-9)</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
              {depression.description}
            </p>
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recommended Action Steps:
              </p>
              <ul className="text-xs text-slate-600 space-y-2">
                {depression.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Required Responsible Educational Disclaimer Box */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-800 text-sm">
              Clinical Interpretation Notice:
            </p>
            <p>
              "Your screening responses indicate symptom levels based on the GAD-7 and PHQ-9 instruments. <strong>This screening result is not a diagnosis.</strong> Many temporary factors—such as physical illness, lack of sleep, or upcoming exams—can elevate screening scores."
            </p>
            <p>
              "Consider speaking with a qualified mental-health professional or physician if you are concerned or if symptoms persist."
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Question-by-Question Response Audit */}
      {responses && responses.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowDetailedResponses(!showDetailedResponses)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-900 text-sm">
                View Detailed Item Breakdown ({responses.length} responses)
              </span>
            </div>
            {showDetailedResponses ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showDetailedResponses && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
              {responses.map((r, i) => (
                <div key={r.id || i} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-400 w-6">#{r.question_order}</span>
                    <span className="text-slate-800 font-medium max-w-lg">{r.question_text}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">
                      {r.answer_label} ({r.answer_value} pts)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 no-print">
        <Link
          to="/dashboard"
          className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md transition text-center"
        >
          Return to Dashboard
        </Link>
        <Link
          to="/history"
          className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm transition text-center"
        >
          View All Screening History
        </Link>
      </div>

      <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
    </div>
  );
}
