import { useState } from 'react';
import { UserPreferences, MealWindow } from '@/types';
import { cn } from '@/lib/utils';
import {
  X, SlidersHorizontal, Leaf, Utensils, ChevronDown, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CUISINES = [
  'North Indian', 'South Indian', 'Mughlai', 'Punjabi', 'Gujarati',
  'Rajasthani', 'Karnataka', 'Chettinad', 'Continental', 'Seafood',
  'Street Food', 'Healthy', 'Multi-cuisine',
];

const MEAL_OPTIONS: { value: MealWindow | 'any'; label: string; icon: string; time: string }[] = [
  { value: 'any',       label: 'Any meal',  icon: '🍽️', time: 'All day' },
  { value: 'breakfast', label: 'Breakfast', icon: '☕', time: '6–10:30 AM' },
  { value: 'lunch',     label: 'Lunch',     icon: '🍛', time: '11:30–3 PM' },
  { value: 'snacks',    label: 'Snacks',    icon: '🥙', time: '3–6:30 PM' },
  { value: 'dinner',    label: 'Dinner',    icon: '🌙', time: '6:30–10:30 PM' },
];

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onApply: (prefs: UserPreferences) => void;
}

export function FilterPanel({ open, onClose, preferences, onApply }: FilterPanelProps) {
  const [draft, setDraft] = useState<UserPreferences>(preferences);

  const toggleCuisine = (c: string) => {
    const current = draft.cuisines ?? [];
    setDraft(p => ({
      ...p,
      cuisines: current.includes(c) ? current.filter(x => x !== c) : [...current, c],
    }));
  };

  const setMeal = (meal: MealWindow | 'any') => setDraft(p => ({ ...p, meal }));
  const setMaxDetour = (v: number) => setDraft(p => ({ ...p, maxDetourMetres: v }));
  const setMaxPrice = (v: number) => setDraft(p => ({ ...p, maxPriceLevel: v }));
  const setVeg = (v: boolean) => setDraft(p => ({ ...p, vegetarianOnly: v }));
  const setMode = (v: 'strict' | 'relaxed') => setDraft(p => ({ ...p, mode: v }));

  const reset = () => setDraft({
    meal: 'any',
    maxDetourMetres: 5000,
    maxPriceLevel: 4,
    vegetarianOnly: false,
    cuisines: [],
    mode: 'strict',
  });

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const maxDetour = draft.maxDetourMetres ?? 5000;
  const maxPrice = draft.maxPriceLevel ?? 4;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl',
        'flex flex-col transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#2563eb]" />
            <span className="font-semibold text-[#0d1421]">Filters & Preferences</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-6">

          {/* Meal timing */}
          <Section title="Meal window" subtitle="Filter by what you want to eat">
            <div className="grid grid-cols-2 gap-2">
              {MEAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMeal(opt.value)}
                  className={cn(
                    'flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all',
                    draft.meal === opt.value
                      ? 'bg-[#eff6ff] border-[#2563eb] text-[#1e4fc2]'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  )}
                >
                  <span className="text-lg leading-none mb-1">{opt.icon}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{opt.time}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Dietary */}
          <Section title="Dietary" subtitle="Filter by dietary preference">
            <div className="flex flex-wrap gap-2">
              <ToggleChip
                active={draft.vegetarianOnly ?? false}
                onClick={() => setVeg(!(draft.vegetarianOnly))}
                icon={<Leaf className="h-3.5 w-3.5" />}
                label="Vegetarian only"
                color="green"
              />
            </div>
          </Section>

          {/* Budget */}
          <Section title="Budget" subtitle="Maximum price level">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(level => (
                <button
                  key={level}
                  onClick={() => setMaxPrice(level)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-xs font-semibold transition-all',
                    maxPrice >= level
                      ? 'bg-[#1a2540] text-white border-[#1a2540]'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {'₹'.repeat(level)}
                </button>
              ))}
            </div>
          </Section>

          {/* Max detour slider */}
          <Section title="Maximum detour" subtitle={`Up to ${(maxDetour / 1000).toFixed(1)} km extra driving`}>
            <input
              type="range"
              min={500}
              max={10000}
              step={500}
              value={maxDetour}
              onChange={e => setMaxDetour(parseInt(e.target.value))}
              className="w-full accent-[#2563eb] cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0.5 km</span>
              <span className="font-medium text-[#2563eb]">{(maxDetour / 1000).toFixed(1)} km</span>
              <span>10 km</span>
            </div>
          </Section>

          {/* Cuisine chips */}
          <Section title="Cuisine" subtitle="Show only selected cuisines (empty = all)">
            <div className="flex flex-wrap gap-1.5">
              {CUISINES.map(c => {
                const active = (draft.cuisines ?? []).includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCuisine(c)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                      active
                        ? 'bg-[#2563eb] text-white border-[#2563eb]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Recommendation mode */}
          <Section title="Recommendation mode" subtitle="Controls how strictly access rules are applied">
            <div className="grid grid-cols-2 gap-2">
              <ModeCard
                title="Strict"
                description="Only confirmed accessible stops"
                active={(draft.mode ?? 'strict') === 'strict'}
                onClick={() => setMode('strict')}
              />
              <ModeCard
                title="Relaxed"
                description="Include unverified stops with warnings"
                active={draft.mode === 'relaxed'}
                onClick={() => setMode('relaxed')}
              />
            </div>
          </Section>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <Button onClick={handleApply} className="flex-1">
            Apply filters
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5">
        <p className="text-sm font-semibold text-[#1a2540]">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleChip({ active, onClick, icon, label, color }: {
  active: boolean; onClick: () => void;
  icon?: React.ReactNode; label: string; color?: 'blue' | 'green';
}) {
  const activeClass = color === 'green'
    ? 'bg-[#f0fdf4] text-[#15803d] border-[#86efac]'
    : 'bg-[#eff6ff] text-[#2563eb] border-[#93c5fd]';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
        active ? activeClass : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ModeCard({ title, description, active, onClick }: {
  title: string; description: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-3 rounded-xl border text-left transition-all',
        active
          ? 'bg-[#eff6ff] border-[#2563eb]'
          : 'bg-white border-slate-200 hover:border-slate-300'
      )}
    >
      <p className={cn('text-xs font-semibold mb-0.5', active ? 'text-[#1e4fc2]' : 'text-[#1a2540]')}>
        {title}
      </p>
      <p className="text-[10px] text-slate-400 leading-snug">{description}</p>
    </button>
  );
}
