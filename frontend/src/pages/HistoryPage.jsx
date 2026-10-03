import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import TrendChart from '../components/TrendChart';
import {
  History,
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  LineChart,
  ShieldAlert,
  Search
} from 'lucide-react';

export default function HistoryPage() {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.getScreenings();
        setScreenings(res.screenings || []);
      } catch (err) {
        setError(err.message || 'Failed to retrieve screening history.');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading longitudinal screening history...</p>
      </div>
    );
  }

  // Build chart dataset from screenings (sorted chronological ascending)
  const chronological = [...screenings].reverse();
  const trendsData = {
    labels: chronological.map(s => new Date(s.screening_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    anxietyScores: chronological.map(s => s.anxiety_score),
    depressionScores: chronological.map(s => s.depression_score)
  };

  // Filter screenings based on search query (category or date)
  const filtered = screenings.filter(s => {
    const term = searchQuery.toLowerCase();
    const dateStr = new Date(s.screening_date).toLocaleDateString().toLowerCase();
    return (
      s.anxiety_category.toLowerCase().includes(term) ||
      s.depression_category.toLowerCase().includes(term) ||
      dateStr.includes(term)
    );
  });

  return (
    <div className="max-w-5xl mx-auto my-8 px-4 pb-16 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-teal-600">Screening Log</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Screening History & Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review past assessments to monitor emotional well-being trends over time.
          </p>
        </div>

        <Link
          to="/screen"
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
        >
          <ClipboardCheck className="w-4 h-4" />
          Take New Screening
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Longitudinal Score Trend Graph */}
      {screenings.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Longitudinal Score Trajectory</h3>
          </div>
          <TrendChart trends={trendsData} />
        </div>
      )}

      {/* Screenings Table / Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            Completed Assessments ({filtered.length})
          </h3>

          {/* Search/Filter Bar */}
          {screenings.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by severity or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </div>

        {screenings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">No Screening History Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't recorded any screening assessments yet. Take your first assessment to begin tracking your scores.
            </p>
            <Link
              to="/screen"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
            >
              Start Screening Now
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No records matched your filter query "{searchQuery}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">GAD-7 (Anxiety)</th>
                  <th className="py-3 px-3">PHQ-9 (Depression)</th>
                  <th className="py-3 px-3">Safety Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(s.screening_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{s.anxiety_score}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {s.anxiety_category}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{s.depression_score}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {s.depression_category}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {s.requires_safety_alert === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Crisis Flagged
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Standard</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <Link
                        to={`/results/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition"
                      >
                        View Report
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
