import { MapPin, ArrowLeftRight, Navigation2, ChevronDown, Zap, Route, Clock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HeroSearchProps {
  onSearch: (source: string, destination: string) => void;
  loading?: boolean;
  error?: string | null;
  hasRoute?: boolean;
  sourceLabel?: string;
  destLabel?: string;
}

export function HeroSearch({ onSearch, loading, error, hasRoute, sourceLabel, destLabel }: HeroSearchProps) {
  const [source, setSource] = useState(sourceLabel ?? '');
  const [destination, setDestination] = useState(destLabel ?? '');
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (source.trim() && destination.trim()) {
      setEditMode(false);
      onSearch(source.trim(), destination.trim());
    }
  };

  const examples = [
    { from: 'Mumbai', to: 'Pune' },
    { from: 'Delhi', to: 'Agra' },
    { from: 'Bangalore', to: 'Mysore' },
  ];

  // ── Compact active-route bar ──────────────────────────────────────────────
  if (hasRoute && !editMode) {
    return (
      <div className="bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
          {/* Route pill */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 min-w-0 flex-1">
              <div className="w-2 h-2 rounded-full bg-[#2563eb] flex-shrink-0" />
              <span className="text-xs font-medium text-[#1a2540] truncate">{sourceLabel}</span>
              <div className="flex-shrink-0 text-slate-300 mx-0.5">→</div>
              <MapPin className="h-3 w-3 text-[#ef4444] flex-shrink-0" />
              <span className="text-xs font-medium text-[#1a2540] truncate">{destLabel}</span>
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditMode(true)}
            className="flex-shrink-0 text-xs font-medium text-[#2563eb] hover:text-[#1e4fc2] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Edit route
          </button>
        </div>
      </div>
    );
  }

  // ── Full hero (idle or edit mode) ─────────────────────────────────────────
  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d1421 0%, #12233d 50%, #0f1d35 100%)' }}
    >
      {/* Dot-grid background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-[#2563eb] opacity-[0.07] blur-3xl pointer-events-none" />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Pill badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/80 text-[11px] font-medium px-3 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Live routing · No AI · Real algorithms
          </span>
        </div>

        {/* Headline */}
        <div className="mb-7">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-3">
            Your journey.{' '}
            <span className="text-[#60a5fa]">Better pitstops.</span>
          </h1>
          <p className="text-sm sm:text-base text-white/60 max-w-xl leading-relaxed">
            Find the best restaurants within 200&nbsp;m of your highway — ranked by actual driving detour, ETA, and road accessibility.
          </p>
        </div>

        {/* Floating search card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-white/10 p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {/* Source input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
                </div>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="Starting point — city or address"
                  className={cn(
                    'w-full pl-8 pr-3.5 py-3 text-sm bg-white border rounded-xl',
                    'placeholder:text-slate-400 text-[#1a2540]',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#2563eb]',
                    'transition-all duration-150',
                    error ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'
                  )}
                />
              </div>

              {/* Swap button */}
              <button
                type="button"
                onClick={handleSwap}
                className="self-center w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 hover:rotate-180"
                aria-label="Swap source and destination"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>

              {/* Destination input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-[#ef4444]" />
                </div>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Destination — city or address"
                  className={cn(
                    'w-full pl-9 pr-3.5 py-3 text-sm bg-white border rounded-xl',
                    'placeholder:text-slate-400 text-[#1a2540]',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#2563eb]',
                    'transition-all duration-150',
                    error ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'
                  )}
                />
              </div>

              {/* CTA */}
              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={!source.trim() || !destination.trim()}
                icon={<Navigation2 className="h-4 w-4" />}
                className="sm:w-auto w-full flex-shrink-0 rounded-xl"
              >
                Find Pitstops
              </Button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </p>
            )}

            {/* Quick examples + preferences toggle */}
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-medium">Try:</span>
              {examples.map((ex) => (
                <button
                  key={`${ex.from}-${ex.to}`}
                  type="button"
                  onClick={() => {
                    setSource(ex.from);
                    setDestination(ex.to);
                  }}
                  className="text-xs bg-slate-100 hover:bg-[#eff6ff] hover:text-[#2563eb] text-slate-600 px-2.5 py-1 rounded-full transition-colors border border-transparent hover:border-[#dbeafe]"
                >
                  {ex.from} → {ex.to}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPrefsOpen(!prefsOpen)}
                className="ml-auto text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <ChevronDown className={cn('h-3 w-3 transition-transform', prefsOpen && 'rotate-180')} />
                Preferences
              </button>
            </div>

            {/* Preferences panel */}
            {prefsOpen && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mt-0.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <PrefChip label="Vegetarian only" />
                <PrefChip label="Budget ₹" />
                <PrefChip label="Roadside only" />
                <PrefChip label="Open now" />
              </div>
            )}
          </form>
        </div>

        {/* Feature stat pills */}
        <div className="flex flex-wrap gap-3 mt-5">
          <FeaturePill icon={<Route className="h-3.5 w-3.5" />} text="Route-aware ranking" />
          <FeaturePill icon={<Clock className="h-3.5 w-3.5" />} text="ETA & meal windows" />
          <FeaturePill icon={<Zap className="h-3.5 w-3.5" />} text="5-factor efficiency score" />
        </div>
      </div>
    </div>
  );
}

function PrefChip({ label }: { label: string }) {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setActive(!active)}
      className={cn(
        'text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
        active
          ? 'bg-[#2563eb] text-white border-[#2563eb]'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      )}
    >
      {label}
    </button>
  );
}

function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-white/60 text-xs bg-white/8 border border-white/10 rounded-full px-3 py-1.5">
      <span className="text-white/50">{icon}</span>
      {text}
    </div>
  );
}
