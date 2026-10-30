import { useState } from 'react';
import { X, ChevronRight, Zap, Clock, Leaf, MapPin, BarChart2 } from 'lucide-react';

export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  badge: string;
  source: string;
  destination: string;
  preferenceHint?: string;
}

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
  onLoadScenario: (scenario: DemoScenario) => void;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  'Access confirmed': <MapPin className="h-3 w-3" />,
  'Score comparison': <BarChart2 className="h-3 w-3" />,
  'ETA-aware': <Clock className="h-3 w-3" />,
  'Veg only': <Leaf className="h-3 w-3" />,
  'NH275': <MapPin className="h-3 w-3" />,
};

const SCENARIO_COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#d97706', '#0891b2'];

const HARDCODED_SCENARIOS: DemoScenario[] = [
  {
    id: 'A',
    label: 'Same-side pitstop',
    description: 'A well-placed roadside dhaba with excellent access directly on the travel lane — zero crossing required.',
    badge: 'Access confirmed',
    source: 'Mumbai, Maharashtra',
    destination: 'Pune, Maharashtra',
    preferenceHint: 'meal=lunch',
  },
  {
    id: 'B',
    label: 'Efficiency ranking',
    description: 'Multiple stops ranked by our 5-component efficiency score — see how detour, direction and timing combine.',
    badge: 'Score comparison',
    source: 'Panvel, Navi Mumbai',
    destination: 'Lonavala, Maharashtra',
    preferenceHint: 'meal=any',
  },
  {
    id: 'C',
    label: 'ETA & meal window',
    description: 'Departure timed so pitstop arrival falls exactly in the lunch window — see meal availability assessment.',
    badge: 'ETA-aware',
    source: 'Khopoli, Maharashtra',
    destination: 'Pune, Maharashtra',
    preferenceHint: 'meal=lunch',
  },
  {
    id: 'D',
    label: 'Vegetarian filter',
    description: 'Route filtered for fully-vegetarian establishments, with cuisine and price-level constraints applied.',
    badge: 'Veg only',
    source: 'Navi Mumbai',
    destination: 'Pune, Maharashtra',
    preferenceHint: 'vegetarianOnly=true',
  },
  {
    id: 'E',
    label: 'Bangalore–Mysore highway',
    description: 'Demonstrates algorithm on a different corridor — NH275, Southern India corridor.',
    badge: 'NH275',
    source: 'Bangalore, Karnataka',
    destination: 'Mysore, Karnataka',
    preferenceHint: 'meal=any',
  },
];

export function DemoModal({ open, onClose, onLoadScenario }: DemoModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!open) return null;

  const handleSelect = async (scenario: DemoScenario) => {
    setLoading(scenario.id);
    await new Promise(r => setTimeout(r, 300)); // brief visual feedback
    setLoading(null);
    onLoadScenario(scenario);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1a2540]">Demo Scenarios</h2>
                  <p className="text-xs text-slate-400">Live algorithm demonstrations</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scenarios */}
          <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <p className="text-xs text-slate-400 mb-3">
              Each scenario pre-loads a route and demonstrates a specific algorithm feature. All data is synthetic and clearly labelled.
            </p>
            {HARDCODED_SCENARIOS.map((scenario, idx) => (
              <button
                key={scenario.id}
                onClick={() => handleSelect(scenario)}
                disabled={loading !== null}
                className="w-full text-left border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 hover:shadow-sm transition-all group relative overflow-hidden"
              >
                {/* Accent stripe */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                  style={{ backgroundColor: SCENARIO_COLORS[idx] }}
                />

                <div className="pl-3 flex items-start gap-3">
                  {/* Scenario letter */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold mt-0.5"
                    style={{ backgroundColor: SCENARIO_COLORS[idx] }}
                  >
                    {scenario.id}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-[#1a2540]">{scenario.label}</h3>
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {BADGE_ICONS[scenario.badge]}
                        {scenario.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{scenario.description}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{scenario.source} → {scenario.destination}</span>
                    </div>
                  </div>

                  {/* Arrow / loading */}
                  <div className="flex-shrink-0 flex items-center">
                    {loading === scenario.id ? (
                      <div className="w-4 h-4 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#2563eb] transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-[10px] text-slate-400 text-center">
              Synthetic demo data · No real restaurant data is used · Algorithm results are live calculations
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
