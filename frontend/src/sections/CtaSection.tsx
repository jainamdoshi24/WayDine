/**
 * CtaSection — final call to action that scrolls to the planner.
 */
import { Navigation2, ArrowRight } from 'lucide-react';

interface CtaSectionProps {
  onPlanRoute: () => void;
}

export function CtaSection({ onPlanRoute }: CtaSectionProps) {
  return (
    <section
      id="cta"
      className="relative overflow-hidden py-28"
      style={{ background: 'linear-gradient(150deg, #0a0f1e 0%, #0d1421 40%, #12233d 100%)' }}
    >
      {/* Dot-grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 opacity-[0.06] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-white/60 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          Ready to use · No signup required
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6 tracking-tight">
          Make every stop<br />
          <span className="text-[#60a5fa]">worth the detour.</span>
        </h2>

        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Enter your route and let WayDine find the perfect pitstop —
          ranked by real driving data, not guesses.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onPlanRoute}
            className="flex items-center gap-2 px-7 py-3.5 bg-[#2563eb] text-white font-semibold rounded-xl hover:bg-[#1d4ed8] transition-all shadow-[0_8px_32px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.5)] text-sm"
          >
            <Navigation2 className="h-4 w-4" />
            Plan My Route Now
          </button>
          <button
            onClick={() => {
              const el = document.querySelector('#how-it-works');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium rounded-xl transition-all text-sm"
          >
            See how it works
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
