import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScoreGauge from '../components/ScoreGauge';
import TrendChart from '../components/TrendChart';
import CrisisModal from '../components/CrisisModal';
import {
  ClipboardCheck,
  History,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading your screening overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <p className="text-rose-800 font-bold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, trends, recentScreenings } = data || {};
  const hasScreenings = stats && stats.totalScreenings > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-teal-300">Confidential Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Hello, {user?.name || 'Student'}
          </h1>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            {hasScreenings
              ? `You have completed ${stats.totalScreenings} screening assessment(s). Review your latest clinical scores and historical progress below.`
              : 'Welcome to your mental health screening portal. Take your first standardized screening to establish your baseline.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/screen"
            className="px-6 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-xl text-sm shadow-md transition flex items-center gap-2 group"
          >
            <ClipboardCheck className="w-4 h-4" />
            Start New Screening
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={() => setShowCrisisModal(true)}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-teal-300" />
            Crisis Helplines
          </button>
        </div>
      </div>

      {/* Safety Alert Warning if latest screening triggered it */}
      {stats?.latestScreening?.requires_safety_alert === 1 && (
        <div className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Crisis Intervention Advisory</h4>
              <p className="text-xs text-rose-700 leading-relaxed mt-0.5">
                Your latest screening flagged significant emotional distress. Free, confidential 24/7 support is available.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCrisisModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
          >
            View Emergency Resources
          </button>
        </div>
      )}

      {/* Latest Scores Section or Empty State */}
      {hasScreenings ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Latest Screening Overview
            </h2>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Taken on {new Date(stats.latestScreening.screening_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreGauge
              type="Anxiety Assessment"
              title="GAD-7 Score"
              score={stats.latestAnxiety.score}
              maxScore={21}
              category={stats.latestAnxiety.category}
              level={stats.latestAnxiety.level}
            />

            <ScoreGauge
              type="Depression Assessment"
              title="PHQ-9 Score"
              score={stats.latestDepression.score}
              maxScore={27}
              category={stats.latestDepression.category}
              level={stats.latestDepression.level}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Screenings Completed Yet</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1 mb-6">
            Complete your first 16-question assessment (GAD-7 & PHQ-9) in approximately 3-4 minutes to view your emotional health metrics.
          </p>
          <Link
            to="/screen"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition"
          >
            Start Your First Screening
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Longitudinal Trends & Screening History Preview */}
      {hasScreenings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Score Progression Over Time
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tracking changes across recent assessment sessions</p>
              </div>
              <Link to="/history" className="text-xs font-semibold text-teal-600 hover:underline">
                Full History →
              </Link>
            </div>

            <TrendChart trends={trends} />
          </div>

          {/* Recent History Table Card (1 col) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-600" />
                  Recent Screenings
                </h3>
              </div>

              <div className="space-y-3">
                {recentScreenings && recentScreenings.map((sc) => (
                  <Link
                    key={sc.id}
                    to={`/results/${sc.id}`}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-teal-200 bg-slate-50 hover:bg-teal-50/50 block transition group"
                  >
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                      <span>{new Date(sc.screening_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-teal-600 group-hover:underline flex items-center gap-0.5">
                        Details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700">
                        GAD-7: <strong>{sc.anxiety_score}</strong> ({sc.anxiety_category.split(' ')[0]})
                      </span>
                      <span className="text-slate-700">
                        PHQ-9: <strong>{sc.depression_score}</strong> ({sc.depression_category.split(' ')[0]})
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                to="/history"
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl block transition"
              >
                View Complete Screening History ({stats?.totalScreenings})
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Wellness & Coping Strategies Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-600" />
          Evidence-Based Coping & Mental Wellness Strategies
        </h3>
        <p className="text-xs text-slate-500 mb-6">Practical habits to support emotional equilibrium and resilience</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
            <h4 className="font-bold text-teal-900 text-sm mb-1">1. Box Breathing (4-4-4-4)</h4>
            <p className="text-xs text-teal-800/80 leading-relaxed">
              Inhale for 4 seconds, hold for 4, exhale slowly for 4, and hold for 4. Calms the autonomic nervous system during acute anxiety.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <h4 className="font-bold text-indigo-900 text-sm mb-1">2. Behavioral Activation</h4>
            <p className="text-xs text-indigo-800/80 leading-relaxed">
              Break tasks into micro-steps (e.g. 5 minutes of study or a 10-minute walk). Action often sparks motivation, not the other way around.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <h4 className="font-bold text-emerald-900 text-sm mb-1">3. Sleep Hygiene Architecture</h4>
            <p className="text-xs text-emerald-800/80 leading-relaxed">
              Consistent wake-up times and eliminating blue-light screens 45 minutes before sleep regulate serotonin and cortisol cycles.
            </p>
          </div>
        </div>
      </div>

      <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
    </div>
  );
}
