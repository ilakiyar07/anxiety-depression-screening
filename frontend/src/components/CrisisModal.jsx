import React from 'react';
import { Phone, ShieldAlert, Heart, X, ExternalLink } from 'lucide-react';

export default function CrisisModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100 relative overflow-hidden">
        {/* Soft background header accent */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500"></div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Support & Crisis Resources</h3>
            <p className="text-xs text-slate-500">You are not alone — compassionate, confidential support is free and available 24/7.</p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 mb-5">
          <p className="text-xs sm:text-sm text-rose-950 font-medium leading-relaxed">
            Your responses indicate you may be going through significant emotional pain or distress. Your life and well-being have immense value. Please consider reaching out to one of the trained professionals or helplines below right away.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">National Health Mission (India)</p>
              <h4 className="text-base font-bold text-slate-800">Tele-MANAS Comprehensive Helpline</h4>
              <p className="text-xs text-slate-600">24/7 Multi-lingual toll-free mental healthcare</p>
            </div>
            <a
              href="tel:14416"
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
            >
              <Phone className="w-4 h-4" />
              14416
            </a>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Crisis Support & Counseling</p>
              <h4 className="text-base font-bold text-slate-800">Vandrevala Foundation</h4>
              <p className="text-xs text-slate-600">Free, confidential 24x7 crisis intervention</p>
            </div>
            <a
              href="tel:+919999666555"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
            >
              <Phone className="w-3.5 h-3.5" />
              +91 9999 666 555
            </a>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Ministry of Social Justice</p>
              <h4 className="text-base font-bold text-slate-800">Kiran Helpline</h4>
              <p className="text-xs text-slate-600">Mental health rehabilitation & distress support</p>
            </div>
            <a
              href="tel:18005990019"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
            >
              <Phone className="w-3.5 h-3.5" />
              1800-599-0019
            </a>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">International (US / Canada)</p>
              <h4 className="text-base font-bold text-slate-800">Suicide & Crisis Lifeline</h4>
              <p className="text-xs text-slate-600">24/7 call or text support</p>
            </div>
            <a
              href="tel:988"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
            >
              <Phone className="w-4 h-4" />
              988
            </a>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition"
          >
            I Understand & Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
