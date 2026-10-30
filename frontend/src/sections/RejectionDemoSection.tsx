/**
 * RejectionDemoSection — 3 hardcoded demo evaluations showing pass/fail/warn scenarios.
 * Uses static fixture data so no backend call is needed for the landing page.
 */
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';

interface DemoRule {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  detail?: string;
}

interface DemoCard {
  title: string;
  subtitle: string;
  finalStatus: 'recommended' | 'rejected' | 'needs_verification';
  score?: number;
  rules: DemoRule[];
  summary: string;
}

const DEMOS: DemoCard[] = [
  {
    title: 'Highway Dhaba — Kalyan',
    subtitle: 'Scenario A: Small detour, forward position',
    finalStatus: 'recommended',
    score: 82,
    summary: 'Passes all eligibility checks. 1.4 km detour is within the balanced budget.',
    rules: [
      { id: 'ROUTE_CORRIDOR',     label: 'Within 200 m of route',         status: 'pass', detail: '142 m from route' },
      { id: 'FORWARD_POSITION',   label: 'Forward route position',         status: 'pass', detail: 'Ahead at 38% along route' },
      { id: 'ACCESS_VERIFIED',    label: 'Road access verified',           status: 'pass', detail: 'Same carriageway' },
      { id: 'DISTANCE_BUDGET',    label: 'Within distance budget',         status: 'pass', detail: '1.4 km extra (budget: 5 km)' },
      { id: 'TIME_BUDGET',        label: 'Within time budget',             status: 'pass', detail: '3 min extra (budget: 10 min)' },
      { id: 'OPEN_AT_ETA',        label: 'Open at estimated arrival',      status: 'pass', detail: 'Open 11:00 – 22:00, ETA 13:45' },
      { id: 'MEAL_AVAILABLE',     label: 'Meal available at arrival',      status: 'pass', detail: 'Lunch served 11:00 – 16:00' },
      { id: 'PREFERENCE_MATCH',   label: 'Matches cuisine preferences',    status: 'pass', detail: 'North Indian' },
    ],
  },
  {
    title: 'Express Highway Café — Pune',
    subtitle: 'Scenario B: Nearby but exceeds detour budget',
    finalStatus: 'rejected',
    summary: 'Restaurant is close to the route but requires a large driving detour — exceeds both distance and time limits.',
    rules: [
      { id: 'ROUTE_CORRIDOR',     label: 'Within 200 m of route',         status: 'pass', detail: '98 m from route' },
      { id: 'FORWARD_POSITION',   label: 'Forward route position',         status: 'pass', detail: 'Ahead at 61% along route' },
      { id: 'ACCESS_VERIFIED',    label: 'Road access verified',           status: 'pass', detail: 'Side road accessible' },
      { id: 'DISTANCE_BUDGET',    label: 'Within distance budget',         status: 'fail', detail: '8.7 km extra (budget: 5 km) — EXCEEDED' },
      { id: 'TIME_BUDGET',        label: 'Within time budget',             status: 'fail', detail: '19 min extra (budget: 10 min) — EXCEEDED' },
      { id: 'OPEN_AT_ETA',        label: 'Open at estimated arrival',      status: 'pass', detail: 'Open, ETA within hours' },
      { id: 'MEAL_AVAILABLE',     label: 'Meal available at arrival',      status: 'pass' },
      { id: 'PREFERENCE_MATCH',   label: 'Matches cuisine preferences',    status: 'pass' },
    ],
  },
  {
    title: 'Sunrise Restaurant — Mumbai',
    subtitle: 'Scenario C: Opposite carriageway, uncertain access',
    finalStatus: 'needs_verification',
    summary: 'Restaurant is nearby and open, but road access is uncertain — may require crossing a divided highway.',
    rules: [
      { id: 'ROUTE_CORRIDOR',     label: 'Within 200 m of route',         status: 'pass', detail: '68 m from route' },
      { id: 'FORWARD_POSITION',   label: 'Forward route position',         status: 'pass', detail: 'Ahead at 22% along route' },
      { id: 'ACCESS_UNVERIFIED',  label: 'Road access verified',           status: 'warn', detail: 'Possible opposite carriageway — not confirmed' },
      { id: 'OPPOSITE_CARRIAGEWAY', label: 'Same carriageway',            status: 'warn', detail: 'Road geometry suggests opposite side — U-turn may be required' },
      { id: 'DISTANCE_BUDGET',    label: 'Within distance budget',         status: 'skip', detail: 'Not evaluated — access unverified' },
      { id: 'TIME_BUDGET',        label: 'Within time budget',             status: 'skip', detail: 'Not evaluated — access unverified' },
      { id: 'OPEN_AT_ETA',        label: 'Open at estimated arrival',      status: 'pass', detail: 'Open 08:00 – 23:00' },
      { id: 'MEAL_AVAILABLE',     label: 'Meal available at arrival',      status: 'pass' },
    ],
  },
];

function RuleRow({ rule }: { rule: DemoRule }) {
  const icons = {
    pass: <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />,
    fail: <XCircle    className="h-3.5 w-3.5 text-red-500    flex-shrink-0" />,
    warn: <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />,
    skip: <div className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0" />,
  };
  const textColors = { pass: 'text-slate-700', fail: 'text-red-700', warn: 'text-amber-700', skip: 'text-slate-400' };

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="mt-0.5">{icons[rule.status]}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium ${textColors[rule.status]}`}>{rule.label}</div>
        {rule.detail && (
          <div className="text-[10px] text-slate-400 mt-0.5">{rule.detail}</div>
        )}
      </div>
    </div>
  );
}

function DemoCardComp({ card, index }: { card: DemoCard; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
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

  const statusConfig = {
    recommended:       { label: 'Recommended', bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
    rejected:          { label: 'Rejected',     bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
    needs_verification:{ label: 'Verify',       bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  }[card.finalStatus];

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 0.15}s, transform 0.5s ease ${index * 0.15}s`,
      }}
    >
      {/* Card header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{ background: statusConfig.bg, color: statusConfig.text, border: `1px solid ${statusConfig.border}` }}
            >
              {statusConfig.label}
            </span>
            {card.score && (
              <span className="text-[10px] text-slate-400 font-medium">Score: {card.score}/100</span>
            )}
          </div>
          <h3 className="font-semibold text-[#1a2540] text-sm">{card.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Summary */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
        <p className="text-xs text-slate-600 leading-relaxed">{card.summary}</p>
      </div>

      {/* Rules */}
      {expanded && (
        <div className="px-5 py-3 divide-y divide-slate-50">
          {card.rules.map(rule => (
            <RuleRow key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RejectionDemoSection() {
  return (
    <section id="demo" className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#fef3c7] text-[#92400e] text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            Explainable results
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d1421] mb-4">
            Why this restaurant?
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Every result comes with a full rule evaluation — not a score you have to trust blindly.
            See exactly why a restaurant was recommended, rejected, or needs verification.
          </p>
        </div>

        {/* Demo cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {DEMOS.map((demo, i) => (
            <DemoCardComp key={demo.title} card={demo} index={i} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-10 text-xs text-slate-500">
          {[
            { color: 'bg-emerald-400', label: 'Passed' },
            { color: 'bg-red-400',     label: 'Failed — hard constraint' },
            { color: 'bg-amber-400',   label: 'Warning — verify manually' },
            { color: 'border-2 border-dashed border-slate-300', label: 'Skipped — prerequisite failed' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
