import { ScoreComponents } from '@/types';
import { cn, SCORE_COMPONENT_LABELS, SCORE_WEIGHTS, getScoreColor, getScoreBg, getScoreRingColor, scoreLabel } from '@/lib/utils';
import { X, Info } from 'lucide-react';

interface ScoreBreakdownPanelProps {
  score: number;
  components: ScoreComponents;
  reasons: string[];
  restaurantName: string;
  onClose: () => void;
}

export function ScoreBreakdownPanel({
  score,
  components,
  reasons,
  restaurantName,
  onClose,
}: ScoreBreakdownPanelProps) {
  const ringColor = getScoreRingColor(score);
  const circumference = 2 * Math.PI * 28; // r=28
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-[#2563eb]" />
          <div>
            <p className="text-xs font-semibold text-[#1a2540]">Efficiency Score</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{restaurantName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-5">
        {/* Score ring */}
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72">
              {/* Background ring */}
              <circle cx="36" cy="36" r="28" fill="none" stroke="#f1f5f9" strokeWidth="7" />
              {/* Score arc */}
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke={ringColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-lg font-bold leading-none', getScoreColor(score))}>{score}</span>
              <span className="text-[9px] text-slate-400 font-medium">/100</span>
            </div>
          </div>
          <div>
            <p className={cn('text-xl font-bold', getScoreColor(score))}>{scoreLabel(score)}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Based on detour, direction,<br />accessibility, timing & preferences.
            </p>
          </div>
        </div>

        {/* Component bars */}
        <div>
          <p className="text-xs font-semibold text-[#1a2540] mb-3 uppercase tracking-wide">Score breakdown</p>
          <div className="space-y-3">
            {(Object.keys(components) as (keyof ScoreComponents)[]).map(key => {
              const value = components[key];
              const weight = SCORE_WEIGHTS[key];
              const pct = Math.round(value * 100);
              const contribution = Math.round(value * weight * 100);

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">{SCORE_COMPONENT_LABELS[key]}</span>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-[10px] text-slate-400">×{weight.toFixed(2)}</span>
                      <span className={cn('text-xs font-semibold w-8 text-right', getScoreColor(pct))}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 70 ? '#16a34a' : pct >= 45 ? '#d97706' : '#dc2626',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 text-right">
                    +{contribution} pts weighted
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <p className="text-xs font-semibold text-[#1a2540] mb-2 uppercase tracking-wide">Why this score?</p>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#2563eb] flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Weight legend */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Weight distribution</p>
          <div className="space-y-1">
            {(Object.keys(SCORE_WEIGHTS) as (keyof ScoreComponents)[]).map(key => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="h-1.5 rounded-full bg-[#2563eb] flex-shrink-0"
                  style={{ width: `${SCORE_WEIGHTS[key] * 100}%`, maxWidth: '60px' }}
                />
                <span className="text-[10px] text-slate-500">{SCORE_COMPONENT_LABELS[key]} — {Math.round(SCORE_WEIGHTS[key] * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
