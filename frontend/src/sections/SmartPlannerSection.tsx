/**
 * SmartPlannerSection — embeds the full Planner component in the landing page.
 * Accepts initialSource / initialDest from the hero search form.
 */
import { useState, useEffect, useRef } from 'react';
import Planner from '@/Planner';
import { ArrowLeftRight, MapPin, Navigation2 } from 'lucide-react';

interface SmartPlannerSectionProps {
  plannerRef: React.RefObject<HTMLDivElement | null>;
  initialSource?: string;
  initialDest?: string;
}

export function SmartPlannerSection({
  plannerRef,
  initialSource = '',
  initialDest = '',
}: SmartPlannerSectionProps) {
  const [source, setSource] = useState(initialSource);
  const [dest, setDest] = useState(initialDest);
  const innerRef = useRef<HTMLDivElement>(null);

  // Sync when parent updates initialSource/initialDest
  useEffect(() => { if (initialSource) setSource(initialSource); }, [initialSource]);
  useEffect(() => { if (initialDest) setDest(initialDest); }, [initialDest]);

  // Reveal on scroll
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="planner"
      className="bg-[#f8fafc] border-t border-slate-200"
      style={{ minHeight: '100vh' }}
    >
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#eff6ff] text-[#2563eb] text-xs font-semibold px-4 py-1.5 rounded-full mb-3">
              Live planner
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0d1421] leading-tight">
              Plan your route now
            </h2>
            <p className="text-slate-500 mt-2 max-w-lg">
              Enter any source and destination — the planner finds restaurants
              within 200 m of your route matching your schedule and detour budget.
            </p>
          </div>

          {/* Compact search bar */}
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] flex-shrink-0" />
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="From"
                  className="flex-1 min-w-0 text-sm text-[#1a2540] placeholder:text-slate-400 bg-transparent outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => { const t = source; setSource(dest); setDest(t); }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <MapPin className="h-3.5 w-3.5 text-[#ef4444] flex-shrink-0" />
                <input
                  type="text"
                  value={dest}
                  onChange={e => setDest(e.target.value)}
                  placeholder="To"
                  className="flex-1 min-w-0 text-sm text-[#1a2540] placeholder:text-slate-400 bg-transparent outline-none"
                />
              </div>
              <button
                type="button"
                disabled={!source.trim() || !dest.trim()}
                onClick={() => {
                  if (source.trim() && dest.trim()) {
                    const plannerEl = plannerRef.current;
                    if (plannerEl) {
                      const input = plannerEl.querySelector('input[placeholder*="Starting"]') as HTMLInputElement | null;
                      if (input) { input.value = source; input.dispatchEvent(new Event('input', { bubbles: true })); }
                    }
                  }
                }}
                className="flex-shrink-0 p-2 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Navigation2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Planner workspace */}
      <div
        ref={innerRef}
        style={{ opacity: 0, transition: 'opacity 0.4s ease', height: 'calc(100vh - 220px)', minHeight: '540px' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10"
      >
        <div className="h-full rounded-2xl overflow-hidden border border-slate-200 shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
          <Planner
            plannerRef={plannerRef}
            initialSource={initialSource}
            initialDest={initialDest}
          />
        </div>
      </div>
    </section>
  );
}
