/**
 * ScenariosSection — 4 real-world use-case scenarios.
 */
import { useEffect, useRef } from 'react';
import { Leaf, Briefcase, Clock, Users } from 'lucide-react';

const SCENARIOS = [
  {
    icon: Leaf,
    accent: '#059669',
    bg: '#ecfdf5',
    border: '#6ee7b7',
    title: 'Vegetarian highway trip',
    description:
      'A family on the Mumbai–Pune expressway needs a vegetarian lunch stop. WayDine filters by cuisine and dietary preference, checking meal availability at the actual ETA.',
    tags: ['Vegetarian filter', 'Lunch window', 'ETA-aware'],
  },
  {
    icon: Briefcase,
    accent: '#2563eb',
    bg: '#eff6ff',
    border: '#93c5fd',
    title: 'Business traveller — strict budget',
    description:
      'A consultant driving Delhi–Agra sets a 2 km / 4 min strict budget. WayDine rejects any restaurant requiring a larger detour, even if it scores highly on other factors.',
    tags: ['Strict preset', 'Hard budget', 'No overrides'],
  },
  {
    icon: Clock,
    accent: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
    title: 'Restaurant closing near ETA',
    description:
      'A driver reaches a restaurant at 21:55 — it closes at 22:00. WayDine flags this as a warning, allowing the driver to decide rather than silently dropping the result.',
    tags: ['Opening hours', 'ETA check', 'Warning state'],
  },
  {
    icon: Users,
    accent: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    title: 'Group with mixed preferences',
    description:
      'Three travellers need North Indian food, one is vegetarian, and the budget is mid-range. WayDine evaluates all constraints simultaneously using deterministic rule logic.',
    tags: ['Multi-constraint', 'Price filter', 'Cuisine match'],
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
          el.style.transform = 'scale(1)';
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
        transform: 'scale(0.97)',
        transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export function ScenariosSection() {
  return (
    <section id="scenarios" className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#f5f3ff] text-[#7c3aed] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            Real-world use cases
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d1421] mb-4">
            Built for real journeys
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            WayDine handles the complexity of real trips — dietary needs, tight schedules,
            group preferences, and closing times.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCENARIOS.map((s, i) => {
            const Icon = s.icon;
            return (
              <RevealCard key={s.title} delay={i * 0.1}>
                <div
                  className="bg-white rounded-2xl border p-6 h-full hover:shadow-md transition-shadow"
                  style={{ borderColor: s.border + '66' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: s.bg }}
                    >
                      <Icon className="h-5 w-5" style={{ color: s.accent }} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1a2540] text-base mb-2">{s.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4">{s.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: s.bg, color: s.accent }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
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
