import React from 'react';
import { ShieldAlert, PhoneCall, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800 text-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Mission & Purpose */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h3 className="text-white font-semibold text-base">Anxiety & Depression Screening System</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standardized clinical assessment tool utilizing the GAD-7 and PHQ-9 questionnaires to foster mental health self-awareness, symptom tracking, and early educational intervention.
            </p>
          </div>

          {/* Educational Disclaimer */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-2 text-amber-400 mb-2 font-medium text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Medical & Diagnostic Disclaimer</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This screening application is an educational and self-reflection aid. It does <strong>not</strong> provide medical diagnoses, clinical treatment plans, or emergency psychiatric care. If you are experiencing distress, please consult a qualified mental health clinician or physician.
            </p>
          </div>

          {/* Crisis Helplines */}
          <div>
            <div className="flex items-center gap-2 text-teal-400 mb-3 font-semibold text-xs tracking-wider uppercase">
              <PhoneCall className="w-4 h-4" />
              <span>24/7 Crisis Support Resources</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-300">Tele-MANAS (Govt of India):</span>
                <span className="font-semibold text-teal-400">14416 / 1800 891 4416</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-300">Vandrevala Foundation:</span>
                <span className="font-semibold text-teal-400">+91 9999 666 555</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-300">Kiran Mental Health:</span>
                <span className="font-semibold text-teal-400">1800-599-0019</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-300">US / Canada Suicide Lifeline:</span>
                <span className="font-semibold text-teal-400">988</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} Anxiety & Depression Screening System. College Project Review Edition.</span>
          <span>Designed with evidence-based GAD-7 & PHQ-9 instruments.</span>
        </div>
      </div>
    </footer>
  );
}
