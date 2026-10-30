/**
 * HowItWorksSection — 4-step numbered flow showing how WayDine works.
 */
import { useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, ShieldCheck, MapPin } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Plan your route',
    description:
      'Enter your starting point and destination. WayDine calculates a real drivable road route using OpenStreetMap data.',
    accent: '#2563eb',
    bg: '#eff6ff',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Set your detour budget',
    description:
      'Choose how much extra driving you can tolerate — by distance, time, or both. Presets for strict, balanced, and flexible trips.',
    accent: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'Validate access & timing',
    description:
      'Every candidate is checked against 16 deterministic rules: road direction, opening hours, meal availability, dietary needs, and more.',
    accent: '#059669',
    bg: '#ecfdf5',
  },
  {
    number: '04',
    icon: MapPin,
    title: 'Discover your pitstop',
    description:
      'See ranked restaurants on the map with transparent scores, full rejection reasons, and real detour calculations — not guesses.',
    accent: '#d97706',
    bg: '#fffbeb',
  },
];

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
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
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Icon = step.icon;

  return (
    <div
      ref={ref}
      className="relative flex flex-col"
      style={{
        opacity: 0,
        transform: 'translateY(32px)',
        transition: `opacity 0.5s ease ${index * 0.12}s, transform 0.5s ease ${index * 0.12}s`,
      }}
    >
      {/* Connector line (hidden on last) */}
      {index < STEPS.length - 1 && (
        <div
          className="hidden lg:block absolute top-9 left-[calc(100%+0px)] w-full h-px"
          style={{ background: 'linear-gradient(90deg, #e2e8f0 0%, transparent 100%)', zIndex: 0, width: 'calc(100% - 2.5rem)', left: 'calc(100% - 0.5rem)' }}
        />
      )}

      {/* Card */}
      <div className="relative bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow group">
        {/* Step number */}
        <div
          className="absolute -top-3.5 left-6 text-xs font-bold px-2.5 py-0.5 rounded-full tracking-widest"
          style={{ background: step.bg, color: step.accent, border: `1px solid ${step.accent}22` }}
        >
          {step.number}
        </div>

        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 mt-2"
          style={{ background: step.bg }}
        >
          <Icon className="h-5 w-5" style={{ color: step.accent }} strokeWidth={2} />
        </div>

        <h3 className="text-[#1a2540] font-semibold text-base mb-2">{step.title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#eff6ff] text-[#2563eb] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            Simple · Transparent · Deterministic
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d1421] mb-4">
            How WayDine works
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Four steps from route input to restaurant recommendation — all driven by real
            road data and deterministic algorithms. No black-box AI.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-4">
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-slate-400 text-xs mt-12">
          Powered by OSRM road routing · OpenStreetMap data · Cross-track geometry · No ML models
        </p>
      </div>
    </section>
  );
}
