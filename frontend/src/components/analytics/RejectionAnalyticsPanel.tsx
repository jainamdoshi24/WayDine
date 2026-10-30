/**
 * RejectionAnalyticsPanel — shows counts per status and top rejection reasons.
 */
import { RejectionAnalytics } from '@/types';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const RULE_LABELS: Record<string, string> = {
  OUTSIDE_ROUTE_CORRIDOR:    'Outside 200 m corridor',
  DISTANCE_BUDGET_EXCEEDED:  'Distance budget exceeded',
  TIME_BUDGET_EXCEEDED:      'Time budget exceeded',
  RESTAURANT_CLOSED_AT_ETA:  'Closed at arrival',
  MEAL_UNAVAILABLE:          'Meal not served',
  PREFERENCE_MISMATCH:       'Dietary mismatch',
  PRICE_CONSTRAINT_EXCEEDED: 'Price too high',
  EXCESSIVE_BACKWARD_TRAVEL: 'Excessive backtrack',
  BEHIND_CURRENT_POSITION:   'Behind route start',
  ROAD_RESTRICTION:          'Road restriction',
  INVALID_COORDINATES:       'Invalid coordinates',
};

interface Props {
  analytics: RejectionAnalytics;
}

export function RejectionAnalyticsPanel({ analytics }: Props) {
  const topRejections = Object.entries(analytics.rejectionsByRule)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="h-4 w-4 text-[#2563eb]" />
        <p className="text-sm font-semibold text-[#1a2540]">Route Analysis</p>
        <span className="ml-auto text-xs text-slate-400">{analytics.totalEvaluated} evaluated</span>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatusBadge icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          label="Recommended" count={analytics.recommended} color="emerald" />
        <StatusBadge icon={<CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
          label="Eligible" count={analytics.eligible} color="blue" />
        <StatusBadge icon={<XCircle className="h-3.5 w-3.5 text-red-500" />}
          label="Rejected" count={analytics.rejected} color="red" />
        <StatusBadge icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          label="Unverified" count={analytics.needsVerification} color="amber" />
      </div>

      {/* Top rejection reasons */}
      {topRejections.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Top rejection reasons</p>
          <div className="space-y-1.5">
            {topRejections.map(([ruleId, count]) => (
              <div key={ruleId} className="flex items-center gap-2">
                <HelpCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                <span className="text-xs text-slate-600 flex-1 truncate">
                  {RULE_LABELS[ruleId] ?? ruleId}
                </span>
                <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-1.5 rounded">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ icon, label, count, color }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'emerald' | 'blue' | 'red' | 'amber';
}) {
  const bg = {
    emerald: 'bg-emerald-50 border-emerald-100',
    blue:    'bg-blue-50 border-blue-100',
    red:     'bg-red-50 border-red-100',
    amber:   'bg-amber-50 border-amber-100',
  }[color];

  const textColor = {
    emerald: 'text-emerald-700',
    blue:    'text-blue-700',
    red:     'text-red-700',
    amber:   'text-amber-700',
  }[color];

  return (
    <div className={cn('flex items-center gap-1.5 p-2 rounded-lg border', bg)}>
      {icon}
      <div className="min-w-0">
        <p className={cn('text-base font-bold leading-none', textColor)}>{count}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
