import React from 'react';

export default function ScoreGauge({
  title,
  score,
  maxScore,
  category,
  level,
  type
}) {
  const percentage = Math.min(Math.round((score / maxScore) * 100), 100);

  // Determine color themes based on severity level
  const getColorScheme = (lvl) => {
    switch (lvl) {
      case 'minimal':
        return {
          bg: 'bg-emerald-500',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800'
        };
      case 'mild':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-700',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'moderate':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-700',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-800'
        };
      case 'moderately_severe':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-700',
          border: 'border-orange-200',
          badge: 'bg-orange-100 text-orange-800'
        };
      case 'severe':
      default:
        return {
          bg: 'bg-rose-500',
          text: 'text-rose-700',
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-800'
        };
    }
  };

  const colors = getColorScheme(level);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">{type}</span>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colors.badge}`}>
          {category}
        </span>
      </div>

      {/* Main Score Display */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-extrabold text-slate-900">{score}</span>
        <span className="text-slate-400 font-medium text-lg">/ {maxScore}</span>
      </div>

      {/* Visual Meter Bar */}
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bg}`}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        ></div>
      </div>

      {/* Tiers Legend Reference */}
      {type.includes('Anxiety') ? (
        <div className="grid grid-cols-4 gap-1 text-[10px] text-center text-slate-500 font-medium pt-1 border-t border-slate-100">
          <div className="p-1 rounded bg-slate-50">0-4: Minimal</div>
          <div className="p-1 rounded bg-slate-50">5-9: Mild</div>
          <div className="p-1 rounded bg-slate-50">10-14: Mod</div>
          <div className="p-1 rounded bg-slate-50">15-21: Severe</div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1 text-[9px] text-center text-slate-500 font-medium pt-1 border-t border-slate-100">
          <div className="p-0.5 rounded bg-slate-50">0-4: Min</div>
          <div className="p-0.5 rounded bg-slate-50">5-9: Mild</div>
          <div className="p-0.5 rounded bg-slate-50">10-14: Mod</div>
          <div className="p-0.5 rounded bg-slate-50">15-19: Mod.Sev</div>
          <div className="p-0.5 rounded bg-slate-50">20-27: Sev</div>
        </div>
      )}
    </div>
  );
}
