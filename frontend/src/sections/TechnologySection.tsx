/**
 * TechnologySection — architecture overview with styled flow diagram.
 */
import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const PIPELINE = [
  { step: '01', label: 'Route Input',         detail: 'Geocode source & destination via Nominatim' },
  { step: '02', label: 'Road Routing',         detail: 'OSRM computes real drivable path & duration' },
  { step: '03', label: 'Candidate Filtering',  detail: 'Cross-track distance ≤ 200 m from route polyline' },
  { step: '04', label: 'Access Validation',    detail: 'Carriageway, direction, U-turn & road restriction checks' },
  { step: '05', label: 'Budget Enforcement',   detail: 'Detour distance & time checked against wallet limits' },
  { step: '06', label: 'ETA & Meal Rules',     detail: 'Opening hours and meal availability at estimated arrival' },
  { step: '07', label: 'Explainable Ranking',  detail: 'Deterministic efficiency score, full rule evaluation' },
];

const TECH_ITEMS = [
  { label: 'Haversine distance',   desc: 'Spherical Earth formula for precise lat/lng distances between points' },
  { label: 'Cross-track geometry', desc: 'Perpendicular distance from a point to a great-circle path segment' },
  { label: 'OSRM routing',         desc: 'Open Source Routing Machine for real drivable routes and durations' },
  { label: "Dijkstra's algorithm", desc: 'Shortest-path graph search for internal route graph operations' },
  { label: 'Rule engine',          desc: '16 deterministic rule IDs evaluated in priority order per candidate' },
  { label: 'Detour budget math',   desc: 'Extra distance = detour route – original route; no straight-line shortcuts' },
];

function RevealEl({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(20px)',
        transition: `opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export function TechnologySection() {
  return (
    <section id="technology" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#ecfdf5] text-[#059669] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            100% deterministic · Zero AI
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d1421] mb-4">
            How the algorithm works
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Seven-stage pipeline from route input to ranked recommendation.
            Every decision is traceable, reproducible, and explainable.
          </p>
        </div>

        {/* Pipeline */}
        <div className="relative mb-20">
          {/* Horizontal scroll on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch gap-0 overflow-x-auto pb-2">
            {PIPELINE.map((item, i) => (
              <div key={item.step} className="flex flex-row sm:flex-col items-center flex-1">
                <RevealEl delay={i * 0.08}>
                  <div className="flex flex-row sm:flex-col items-center text-center sm:text-center w-full">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0d1421] text-white text-xs font-bold flex items-center justify-center mb-0 sm:mb-3 mr-3 sm:mr-0 sm:mx-auto">
                      {item.step}
                    </div>
                    <div className="sm:px-2 flex-1 sm:flex-none">
                      <div className="font-semibold text-[#1a2540] text-sm mb-1">{item.label}</div>
                      <div className="text-slate-400 text-[11px] leading-snug hidden sm:block">{item.detail}</div>
                    </div>
                  </div>
                </RevealEl>
                {i < PIPELINE.length - 1 && (
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-px sm:h-8 sm:w-full">
                    <ArrowRight className="h-4 w-4 text-slate-300 rotate-90 sm:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tech cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TECH_ITEMS.map((item, i) => (
            <RevealEl key={item.label} delay={i * 0.07}>
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200 p-5 hover:border-[#93c5fd] hover:bg-[#eff6ff] transition-all group">
                <div className="font-semibold text-[#1a2540] text-sm mb-2 group-hover:text-[#2563eb] transition-colors">
                  {item.label}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </RevealEl>
          ))}
        </div>

        {/* Attribution */}
        <div className="mt-12 p-5 bg-[#f8fafc] rounded-xl border border-slate-200 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            Road data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">OpenStreetMap contributors</a> ·
            Routing by <a href="http://project-osrm.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">OSRM</a> ·
            Geocoding by <a href="https://nominatim.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Nominatim</a> ·
            No AI/ML models used
          </p>
        </div>
      </div>
    </section>
  );
}
