import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Shield,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  HeartPulse,
  Brain,
  CheckCircle2,
  Calendar,
  Lock,
  Search,
  UserCog
} from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'screenings', 'users'
  const [userSearch, setUserSearch] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers()
      ]);
      setStats(statsRes);
      setUsers(usersRes.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load administrative analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUserRole(userId, newRole);
      setActionMessage(`User role updated to ${newRole}.`);
      loadAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Aggregating system statistics & records...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-rose-800">Admin Portal Error</h2>
        <p className="text-rose-600 text-sm mt-1">{error}</p>
        <button
          onClick={loadAdminData}
          className="mt-4 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, distributions, recentScreenings } = stats || {};

  // Filter users
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 pb-16 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            Administrative Oversight
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Administration & Analytics
          </h1>
          <p className="text-purple-200 text-xs sm:text-sm mt-1 max-w-xl">
            Live population metrics, clinical severity distributions, and user screening records.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/10 p-1 rounded-2xl border border-white/20">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'overview' ? 'bg-white text-purple-900 shadow-md' : 'text-purple-200 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('screenings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'screenings' ? 'bg-white text-purple-900 shadow-md' : 'text-purple-200 hover:text-white'
            }`}
          >
            Screening Records ({recentScreenings?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'users' ? 'bg-white text-purple-900 shadow-md' : 'text-purple-200 hover:text-white'
            }`}
          >
            User Accounts ({users.length})
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Primary Key Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{summary?.totalUsers || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {summary?.regularStudents} regular student accounts
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Screenings</span>
            <ClipboardCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{summary?.totalScreenings || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Completed assessments
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg GAD-7</span>
            <Brain className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{summary?.avgAnxietyScore || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Scale: 0 to 21 (Anxiety)
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg PHQ-9</span>
            <HeartPulse className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{summary?.avgDepressionScore || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Scale: 0 to 27 (Depression)
          </span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SEVERITY DISTRIBUTIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* GAD-7 Anxiety Distribution Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-base">GAD-7 Severity Breakdown</h3>
                </div>
                <span className="text-xs text-slate-400 font-semibold">Anxiety</span>
              </div>

              <div className="space-y-3 pt-2">
                {distributions?.anxiety?.map((item, idx) => {
                  const pct = summary?.totalScreenings ? Math.round((item.count / summary.totalScreenings) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item.anxiety_category}</span>
                        <span>{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PHQ-9 Depression Distribution Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">PHQ-9 Severity Breakdown</h3>
                </div>
                <span className="text-xs text-slate-400 font-semibold">Depression</span>
              </div>

              <div className="space-y-3 pt-2">
                {distributions?.depression?.map((item, idx) => {
                  const pct = summary?.totalScreenings ? Math.round((item.count / summary.totalScreenings) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item.depression_category}</span>
                        <span>{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Safety Alert Summary Alert Box */}
          <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Crisis Intervention Indicators</h4>
                <p className="text-xs text-amber-800">
                  {summary?.safetyAlertsTriggered} screening assessments flagged PHQ-9 Item 9 (distress or self-harm).
                  All flagged screenings automatically received immediate crisis helpline links and emergency medical advisory banners.
                </p>
              </div>
            </div>
            <span className="text-xl font-black text-amber-900 px-3 py-1 bg-amber-200/60 rounded-xl">
              {summary?.safetyAlertsTriggered}
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: ANONYMIZED SCREENING LOG FOR PROJECT REVIEW */}
      {activeTab === 'screenings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Anonymized Assessment Records
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Screening responses across student cohorts (anonymized for privacy compliance)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold tracking-wider">
                  <th className="py-3 px-3">Subject ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">GAD-7 (Anxiety)</th>
                  <th className="py-3 px-3">PHQ-9 (Depression)</th>
                  <th className="py-3 px-3">Safety Alert</th>
                  <th className="py-3 px-3 text-right">View Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentScreenings?.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                        {s.student_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {new Date(s.screening_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 mr-2">{s.anxiety_score}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
                        {s.anxiety_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 mr-2">{s.depression_score}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        {s.depression_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {s.requires_safety_alert === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Alert Triggered
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Normal</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        to={`/results/${s.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER ACCOUNTS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">User Accounts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage registered accounts and assign administrative roles</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold tracking-wider">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Screenings</th>
                  <th className="py-3 px-3">Registered</th>
                  <th className="py-3 px-3 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-3 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">{u.screening_count}</td>
                    <td className="py-3.5 px-3 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                      >
                        {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
