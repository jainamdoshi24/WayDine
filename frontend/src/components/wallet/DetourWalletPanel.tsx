/**
 * DetourWalletPanel — interactive detour budget controls.
 * Lets drivers set distance + time budgets with presets or custom sliders.
 */
import { useState } from 'react';
import { Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { DetourBudget, DETOUR_PRESETS_FE } from '@/types';
import { cn } from '@/lib/utils';

interface DetourWalletPanelProps {
  budget: DetourBudget;
  onChange: (b: DetourBudget) => void;
  /** Show collapsed pill by default (e.g., in the sidebar) */
  compact?: boolean;
}

const PRESET_KEYS = ['strict', 'balanced', 'flexible'] as const;
type PresetKey = typeof PRESET_KEYS[number];

export function DetourWalletPanel({ budget, onChange, compact = false }: DetourWalletPanelProps) {
  const [open, setOpen] = useState(!compact);

  const applyPreset = (key: PresetKey) => {
    const p = DETOUR_PRESETS_FE[key];
    onChange({
      maxDistanceKm:  p.maxDistanceKm,
      maxTimeMinutes: p.maxTimeMinutes,
      mode:           'both',
      preset:         key,
    });
  };

  const setDist  = (v: number) => onChange({ ...budget, maxDistanceKm: v,  preset: 'custom' });
  const setTime  = (v: number) => onChange({ ...budget, maxTimeMinutes: v, preset: 'custom' });
  const setMode  = (m: DetourBudget['mode']) => onChange({ ...budget, mode: m, preset: 'custom' });

  const activePreset = budget.preset && budget.preset !== 'custom' ? budget.preset : null;

  const distPct = budget.mode !== 'time'
    ? Math.min(100, (budget.maxDistanceKm / 10) * 100)
    : null;
  const timePct = budget.mode !== 'distance'
    ? Math.min(100, (budget.maxTimeMinutes / 20) * 100)
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
            <Wallet className="h-3.5 w-3.5 text-[#2563eb]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#0d1421]">Detour Wallet</p>
            {!open && (
              <p className="text-xs text-slate-400">
                {budget.mode !== 'time' ? `≤ ${budget.maxDistanceKm} km` : ''}
                {budget.mode === 'both' ? ' · ' : ''}
                {budget.mode !== 'distance' ? `≤ ${budget.maxTimeMinutes} min` : ''}
              </p>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          {/* Presets */}
          <div className="pt-3">
            <p className="text-xs font-medium text-slate-500 mb-2">Budget preset</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_KEYS.map(key => {
                const p = DETOUR_PRESETS_FE[key];
                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={cn(
                      'px-2 py-2 rounded-lg border text-center transition-all',
                      activePreset === key
                        ? 'bg-[#2563eb] text-white border-[#2563eb]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <p className={cn('text-xs font-semibold', activePreset === key ? 'text-white' : 'text-[#1a2540]')}>
                      {p.label}
                    </p>
                    <p className={cn('text-[10px] mt-0.5', activePreset === key ? 'text-blue-100' : 'text-slate-400')}>
                      {p.maxDistanceKm} km / {p.maxTimeMinutes} min
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode selector */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Enforce</p>
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
              {(['both', 'distance', 'time'] as DetourBudget['mode'][]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all capitalize',
                    budget.mode === m
                      ? 'bg-white text-[#1a2540] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {m === 'both' ? 'Both' : m === 'distance' ? 'Distance' : 'Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Distance slider */}
          {budget.mode !== 'time' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-slate-500">Max extra distance</p>
                <span className="text-xs font-semibold text-[#2563eb]">{budget.maxDistanceKm} km</span>
              </div>
              {/* Visual bar */}
              <div className="h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                <div
                  className="h-full bg-[#2563eb] rounded-full transition-all"
                  style={{ width: `${distPct ?? 0}%` }}
                />
              </div>
              <input
                type="range" min={0.5} max={10} step={0.5}
                value={budget.maxDistanceKm}
                onChange={e => setDist(parseFloat(e.target.value))}
                className="w-full accent-[#2563eb] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0.5 km</span><span>10 km</span>
              </div>
            </div>
          )}

          {/* Time slider */}
          {budget.mode !== 'distance' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-slate-500">Max extra time</p>
                <span className="text-xs font-semibold text-[#2563eb]">{budget.maxTimeMinutes} min</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                <div
                  className="h-full bg-[#2563eb] rounded-full transition-all"
                  style={{ width: `${timePct ?? 0}%` }}
                />
              </div>
              <input
                type="range" min={1} max={20} step={1}
                value={budget.maxTimeMinutes}
                onChange={e => setTime(parseInt(e.target.value))}
                className="w-full accent-[#2563eb] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1 min</span><span>20 min</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
