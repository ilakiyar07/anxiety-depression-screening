import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ArrowRight,
  ClipboardCheck,
  LineChart,
  Lock,
  HeartPulse,
  Brain,
  HelpCircle,
  PhoneCall
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-teal-50/70 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
            Standardized Clinical Screening Instruments (GAD-7 & PHQ-9)
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Anxiety & Depression <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
              Screening System
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Take a confidential, evidence-based self-assessment to understand your emotional well-being, track longitudinal changes, and access compassionate mental health support.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? "/screen" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition group"
            >
              Start Free Screening
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {!isAuthenticated && (
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-semibold transition text-center shadow-sm"
              >
                Create Account
              </Link>
            )}
          </div>

          {/* Prominent Educational & Diagnostic Disclaimer */}
          <div className="mt-10 max-w-2xl mx-auto p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong className="font-bold">Medical Disclaimer:</strong> This screening application is an educational self-reflection instrument based on standard clinical scales. It is <strong>NOT</strong> a medical diagnosis or treatment plan. Always consult a licensed psychiatrist, psychologist, or healthcare provider for clinical evaluation.
            </div>
          </div>
        </div>
      </section>

      {/* Core Screening Instruments Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Clinically Validated Instruments</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
            Our system utilizes world-standard psychological measurement tools recognized by healthcare institutions globally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* GAD-7 Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Instrument 1</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">Generalized Anxiety Disorder (GAD-7)</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              A 7-question clinical tool measuring the severity of generalized anxiety symptoms experienced over the past 2 weeks. Scored from 0 to 21 across minimal, mild, moderate, and severe tiers.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">✓ Assesses uncontrollable worry, tension, and restlessness</li>
              <li className="flex items-center gap-2">✓ Objective scoring bands validated in clinical literature</li>
              <li className="flex items-center gap-2">✓ Instant categorization and personalized coping advice</li>
            </ul>
          </div>

          {/* PHQ-9 Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5">
              <HeartPulse className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Instrument 2</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">Patient Health Questionnaire (PHQ-9)</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              A 9-question diagnostic-aligned scale for screening and measuring the severity of depression according to DSM criteria. Includes built-in crisis detection for suicidal ideation.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">✓ Evaluates mood, energy levels, sleep patterns, and concentration</li>
              <li className="flex items-center gap-2">✓ Scored from 0 to 27 across 5 clinical severity bands</li>
              <li className="flex items-center gap-2">✓ Automatic safety alert protocol for distress indicators</li>
            </ul>
          </div>
        </div>
      </section>

      {/* System Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-teal-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Secure & Confidential</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Passwords hashed with bcrypt, authenticated via JWT sessions, and screening history protected by strict authorization rules.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
              <LineChart className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Longitudinal Progress Charts</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track how your anxiety and depression scores shift over time. View changes following academic exams, lifestyle shifts, or therapy.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
              <PhoneCall className="w-5 h-5 text-rose-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Emergency Crisis Guard</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Built-in item 9 safety monitoring flags potential crisis situations, immediately offering 24/7 toll-free crisis helpline connections.
            </p>
          </div>
        </div>
      </section>

      {/* Mental Health Awareness Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
              Mental Health Awareness & Early Screening
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
              Anxiety and depression are widespread yet highly treatable health challenges. Standardized screening serves as the first proactive step toward self-awareness, allowing students and adults to identify warning signs early and seek appropriate professional care.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to={isAuthenticated ? "/screen" : "/register"}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition"
              >
                Begin Your Assessment
              </Link>
              <a
                href="tel:14416"
                className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-white font-medium rounded-xl text-sm border border-slate-700 transition flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-teal-400" />
                Tele-MANAS Helpline: 14416
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
