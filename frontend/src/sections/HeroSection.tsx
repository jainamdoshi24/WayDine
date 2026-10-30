/**
 * HeroSection — premium dark hero with functional route search.
 * Search inputs are connected to the real backend via the shared onSearch callback.
 */
import { useState } from 'react';
import { MapPin, ArrowLeftRight, Navigation2, Zap, Route, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  onSearch: (source: string, destination: string) => void;
  loading?: boolean;
}

const EXAMPLES = [
  { from: 'Mumbai', to: 'Pune' },
  { from: 'Delhi', to: 'Agra' },
  { from: 'Bangalore', to: 'Mysore' },
  { from: 'Chennai', to: 'Pondicherry' },
];

export function HeroSection({ onSearch, loading }: HeroSectionProps) {
  const [source, setSource]           = useState('');
  const [destination, setDestination] = useState('');

  const handleSwap = () => { setSource(destination); setDestination(source); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (source.trim() && destination.trim()) {
      onSearch(source.trim(), destination.trim());
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #0a0f1e 0%, #0d1421 40%, #12233d 100%)' }}
    >
      {/* Dot-grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Subtle blue glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 opacity-[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500 opacity-[0.05] rounded-full blur-[100px] pointer-events-none" />

      {/* Route line decoration */}
      <RouteDecoration />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — copy */}
          <div>
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-white/70 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              Graph algorithms · Zero AI · Real road routing
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Your journey<br />deserves{' '}
              <span className="text-[#60a5fa]">better</span><br />
              pitstops.
            </h1>

            <p className="text-lg text-white/55 leading-relaxed mb-8 max-w-xl">
              Find food stops that fit your route, schedule, and detour budget —
              ranked by actual driving distance, ETA, and road accessibility.
              Not straight-line guesses.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2.5 mb-10">
              {[
                { icon: <Route className="h-3.5 w-3.5" />, text: 'Route-aware ranking' },
                { icon: <Clock className="h-3.5 w-3.5" />, text: 'ETA & meal windows' },
                { icon: <Zap className="h-3.5 w-3.5" />, text: 'Detour budget wallet' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-white/55 text-xs bg-white/[0.06] border border-white/10 rounded-full px-3 py-1.5">
                  <span className="text-white/40">{icon}</span>
                  {text}
                </div>
              ))}
            </div>

            {/* Scroll cue */}
            <button
              onClick={() => {
                const el = document.querySelector('#how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              <span>See how it works</span>
              <span className="animate-bounce">↓</span>
            </button>
          </div>

          {/* Right — functional search card */}
          <div className="lg:pl-8">
            <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-white/10 overflow-hidden">
              {/* Card header */}
              <div className="bg-[#f8fafc] border-b border-slate-100 px-5 py-3.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-slate-400 font-medium">WayDine Route Planner</span>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                {/* Source */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                  </div>
                  <input
                    type="text"
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    placeholder="Starting point — city or landmark"
                    className="w-full pl-9 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-[#1a2540] focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#2563eb] transition-all hover:border-slate-300"
                  />
                </div>

                {/* Swap */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all hover:rotate-180 duration-200"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Destination */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <MapPin className="h-3.5 w-3.5 text-[#ef4444]" />
                  </div>
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="Destination — city or landmark"
                    className="w-full pl-9 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-[#1a2540] focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#2563eb] transition-all hover:border-slate-300"
                  />
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  disabled={!source.trim() || !destination.trim() || loading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all',
                    source.trim() && destination.trim() && !loading
                      ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-[0_4px_16px_rgba(37,99,235,0.3)]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Finding pitstops…</>
                    : <><Navigation2 className="h-4 w-4" />Plan My Route</>
                  }
                </button>

                {/* Example chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Try:</span>
                  {EXAMPLES.map(ex => (
                    <button
                      key={`${ex.from}-${ex.to}`}
                      type="button"
                      onClick={() => { setSource(ex.from); setDestination(ex.to); }}
                      className="text-[11px] text-slate-500 hover:text-[#2563eb] bg-slate-50 hover:bg-[#eff6ff] border border-slate-200 hover:border-[#bfdbfe] px-2 py-0.5 rounded-full transition-colors"
                    >
                      {ex.from} → {ex.to}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* Below-card note */}
            <p className="text-center text-white/30 text-xs mt-4">
              Uses OpenStreetMap routing · No account required · Demo data included
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RouteDecoration() {
  return (
    <svg
      className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none hidden lg:block"
      width="500" height="600" viewBox="0 0 500 600"
      fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 50 50 Q 200 150 150 300 T 400 550"
        stroke="white" strokeWidth="3" strokeDasharray="12 8"
      />
      <circle cx="50"  cy="50"  r="12" fill="white" />
      <circle cx="400" cy="550" r="12" fill="white" />
    </svg>
  );
}
