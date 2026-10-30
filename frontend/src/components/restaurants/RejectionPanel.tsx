/**
 * RejectionPanel — "Why this result?" expandable panel per restaurant card.
 * Shows passed/failed rules, budget utilization, ETA, and final explanation.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, HelpCircle, Info } from 'lucide-react';
import { RuleEvaluation, RuleResult, BudgetUtilization, FinalStatus } from '@/types';
import { cn } from '@/lib/utils';

interface RejectionPanelProps {
  evaluation: RuleEvaluation;
}

export function RejectionPanel({ evaluation }: RejectionPanelProps) {
  const [open, setOpen] = useState(false);

  const statusColor: Record<FinalStatus, string> = {
    recommended:       'text-emerald-600 bg-emerald-50 border-emerald-200',
    eligible:          'text-blue-600 bg-blue-50 border-blue-200',
    rejected:          'text-red-600 bg-red-50 border-red-200',
    needs_verification:'text-amber-600 bg-amber-50 border-amber-200',
  };

  const statusLabel: Record<FinalStatus, string> = {
    recommended:       'Recommended',
    eligible:          'Eligible',
    rejected:          'Rejected',
    needs_verification:'Needs verification',
  };

  return (
    <div className="border-t border-slate-100 mt-2">
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors rounded-b-xl"
      >
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-500">Why this result?</span>
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded border',
            statusColor[evaluation.finalStatus]
          )}>
            {statusLabel[evaluation.finalStatus]}
          </span>
        </div>
        {open
          ? <ChevronUp className="h-3 w-3 text-slate-400" />
          : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3" onClick={e => e.stopPropagation()}>
          {/* Explanation */}
          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
            {evaluation.explanation}
          </p>

          {/* Budget utilization bars */}
          {evaluation.budgetUtilization && (
            <BudgetBar util={evaluation.budgetUtilization} />
          )}

          {/* Failed rules */}
          {evaluation.failedRules.length > 0 && (
            <RuleGroup
              title="Failed checks"
              rules={evaluation.rules.filter(r => r.status === 'failed')}
            />
          )}

          {/* Warnings */}
          {evaluation.warningRules.length > 0 && (
            <RuleGroup
              title="Warnings"
              rules={evaluation.rules.filter(r => r.status === 'warning')}
            />
          )}

          {/* Passed rules */}
          {evaluation.passedRules.length > 0 && (
            <RuleGroup
              title="Passed checks"
              rules={evaluation.rules.filter(r => r.status === 'passed')}
              collapsed
            />
          )}

          {/* Missing data */}
          {evaluation.missingData.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Unverified</p>
              <div className="flex flex-wrap gap-1">
                {evaluation.missingData.map(d => (
                  <span key={d} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RuleGroup({ title, rules, collapsed = false }: {
  title: string;
  rules: RuleResult[];
  collapsed?: boolean;
}) {
  const [expanded, setExpanded] = useState(!collapsed);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mb-1 w-full text-left"
      >
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex-1">{title}</p>
        <span className="text-[10px] text-slate-300">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="space-y-1">
          {rules.map(rule => (
            <RuleRow key={rule.ruleId} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}

function RuleRow({ rule }: { rule: RuleResult }) {
  const icon = {
    passed:        <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />,
    failed:        <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />,
    warning:       <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />,
    not_evaluated: <HelpCircle className="h-3 w-3 text-slate-300 flex-shrink-0" />,
  }[rule.status];

  return (
    <div className="flex items-start gap-1.5">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className={cn(
          'text-[11px] font-medium',
          rule.status === 'passed'        ? 'text-slate-600'
          : rule.status === 'failed'      ? 'text-red-600'
          : rule.status === 'warning'     ? 'text-amber-600'
          : 'text-slate-400'
        )}>
          {rule.label}
        </p>
        {rule.reason && (
          <p className="text-[10px] text-slate-400 leading-snug">{rule.reason}</p>
        )}
        {rule.actualValue !== undefined && rule.allowedValue !== undefined && (
          <p className="text-[10px] text-slate-400">
            Actual: <span className="font-medium">{rule.actualValue}</span>
            {' · '}
            Limit: <span className="font-medium">{rule.allowedValue}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function BudgetBar({ util }: { util: BudgetUtilization }) {
  const distPct = util.distancePct !== null ? Math.min(100, util.distancePct) : null;
  const timePct = util.timePct !== null     ? Math.min(100, util.timePct)     : null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Budget utilization</p>

      {distPct !== null && isFinite(util.distanceLimitMetres) && (
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Distance</span>
            <span className={distPct > 100 ? 'text-red-500 font-semibold' : ''}>
              {(util.distanceActualMetres / 1000).toFixed(1)} / {(util.distanceLimitMetres / 1000).toFixed(1)} km ({util.distancePct}%)
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', distPct > 100 ? 'bg-red-500' : distPct > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(100, distPct)}%` }}
            />
          </div>
        </div>
      )}

      {timePct !== null && isFinite(util.timeLimitSeconds) && (
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Time</span>
            <span className={timePct > 100 ? 'text-red-500 font-semibold' : ''}>
              {Math.round(util.timeActualSeconds / 60)} / {Math.round(util.timeLimitSeconds / 60)} min ({util.timePct}%)
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', timePct > 100 ? 'bg-red-500' : timePct > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(100, timePct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
