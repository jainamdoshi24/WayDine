/**
 * FeatureShowcaseSection — 4 key features with varied card layouts.
 */
import { useEffect, useRef } from 'react';
import { Wallet, ListChecks, Navigation2, Clock } from 'lucide-react';

const FEATURES = [
  {
    icon: Wallet,
    accent: '#2563eb',
    bg: 'linear-gradient(135deg, #0d1421 0%, #1a2540 100%)',
    label: 'Feature A',
    title: 'Detour Budget Wallet',
    description:
      'Control exactly how much extra driving you accept. Set distance and time budgets independently. Presets for strict, balanced, and flexible trip styles.',
    tags: ['Distance budget', 'Time budget', 'Presets', 'Real road math'],
    dark: true,
    preview: (
      <div className="mt-4 bg-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs">Max extra distance</span>
          <span className="text-white text-xs font-semibold">5.0 km</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div className="bg-[#60a5fa] h-1.5 rounded-full" style={{ width: '42%' }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs">Max extra time</span>
          <span className="text-white text-xs font-semibold">10 min</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div className="bg-[#a78bfa] h-1.5 rounded-full" style={{ width: '58%' }} />
        </div>
        <div className="flex gap-1.5 pt-1">
          {['Strict', 'Balanced', 'Flexible'].map((p, i) => (
            <div
              key={p}
              className={`flex-1 text-center text-[10px] py-1 rounded-lg font-medium ${
                i === 1 ? 'bg-[#2563eb] text-white' : 'bg-white/10 text-white/50'
              }`}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: ListChecks,
    accent: '#7c3aed',
    bg: '#f5f3ff',
    label: 'Feature B',
    title: 'Explainable Rejection Engine',
    description:
      '16 named rule IDs evaluated for every candidate. Know exactly why a restaurant was recommended, rejected, or needs verification.',
    tags: ['16 rule IDs', 'Transparent logic', 'No AI inference', 'Rejection analytics'],
    dark: false,
    preview: (
      <div className="mt-4 space-y-2">
        {[
          { label: 'ROUTE_CORRIDOR', status: 'pass' },
          { label: 'FORWARD_POSITION', status: 'pass' },
          { label: 'DISTANCE_BUDGET', status: 'fail' },
          { label: 'OPEN_AT_ETA', status: 'warn' },
        ].map(({ label, status }) => (
          <div key={label} className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2 border border-slate-100">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status === 'pass' ? 'bg-emerald-400' : status === 'fail' ? 'bg-red-400' : 'bg-amber-400'
            }`} />
            <span className="text-xs font-mono text-slate-600 flex-1">{label}</span>
            <span className={`text-[10px] font-semibold uppercase ${
              status === 'pass' ? 'text-emerald-600' : status === 'fail' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {status === 'pass' ? '✓ Pass' : status === 'fail' ? '✗ Fail' : '⚠ Warn'}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Navigation2,
    accent: '#059669',
    bg: '#ecfdf5',
    label: 'Algorithm',
    title: 'Direction-Aware Access',
    description:
      'WayDine checks if a restaurant is on the forward side of your route and flags carriageway crossings, U-turns, and access restrictions using real road data.',
    tags: ['Cross-track geometry', 'Haversine distance', 'Road direction', 'Access confidence'],
    dark: false,
    preview: (
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        {[
          { label: 'Same side', value: '✓ Clear', color: '#059669', bg: '#d1fae5' },
          { label: 'Distance', value: '142 m', color: '#1a2540', bg: '#f1f5f9' },
          { label: 'Detour', value: '3.2 km', color: '#1a2540', bg: '#f1f5f9' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl py-2.5 px-1" style={{ background: bg }}>
            <div className="font-bold text-sm" style={{ color }}>{value}</div>
            <div className="text-slate-400 text-[10px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Clock,
    accent: '#d97706',
    bg: '#fffbeb',
    label: 'Algorithm',
    title: 'ETA-Aware Food Matching',
    description:
      'Your arrival time at each restaurant is calculated from the route. Opening hours and meal availability are checked against your actual ETA, not just the current time.',
    tags: ['Real ETA calc', 'Meal windows', 'Opening hours', 'Dietary filters'],
    dark: false,
    preview: (
      <div className="mt-4 space-y-2">
        {[
          { meal: 'Lunch', time: '12:30 PM', open: true },
          { meal: 'Dinner', time: '07:45 PM', open: true },
          { meal: 'Breakfast', time: '09:00 AM', open: false },
        ].map(({ meal, time, open }) => (
          <div key={meal} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
            <span className="text-xs text-slate-600">{meal} window</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700">{time}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                open ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}>
                {open ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

function RevealCard({ children, delay }: { children: React.ReactNode; delay: number }) {
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
        transform: 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export function FeatureShowcaseSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#f5f3ff] text-[#7c3aed] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            Built on algorithms, not AI
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d1421] mb-4">
            Features that make every stop count
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            From budget controls to explainable rejection logic — everything is transparent,
            deterministic, and grounded in real road data.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <RevealCard key={feat.title} delay={i * 0.1}>
                <div
                  className="rounded-2xl p-6 h-full border"
                  style={{
                    background: feat.dark ? feat.bg : feat.bg,
                    borderColor: feat.dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                  }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: feat.dark ? 'rgba(255,255,255,0.1)' : 'white',
                        boxShadow: feat.dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: feat.accent }} strokeWidth={2} />
                    </div>
                    <div>
                      <div
                        className="text-[10px] font-bold uppercase tracking-widest mb-1"
                        style={{ color: feat.dark ? 'rgba(255,255,255,0.4)' : feat.accent }}
                      >
                        {feat.label}
                      </div>
                      <h3
                        className="font-bold text-lg leading-snug"
                        style={{ color: feat.dark ? 'white' : '#0d1421' }}
                      >
                        {feat.title}
                      </h3>
                    </div>
                  </div>

                  <p
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: feat.dark ? 'rgba(255,255,255,0.55)' : '#64748b' }}
                  >
                    {feat.description}
                  </p>

                  {feat.preview}

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {feat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: feat.dark ? 'rgba(255,255,255,0.08)' : 'white',
                          color: feat.dark ? 'rgba(255,255,255,0.5)' : '#64748b',
                          border: feat.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </RevealCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
