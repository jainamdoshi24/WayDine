import { useState } from 'react';
import { Recommendation, RuleEvaluation } from '@/types';
import {
  formatDistance, formatDuration, priceLevelSymbol,
  getRatingColor, getScoreColor, getScoreRingColor, scoreLabel, cn,
} from '@/lib/utils';
import { Star, Navigation2, Clock, Leaf, ChevronRight, BarChart2, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AccessBadge, EtaStatusBadge } from './StatusBadges';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';
import { RejectionPanel } from './RejectionPanel';

interface RestaurantCardProps {
  rec: Recommendation;
  rank: number;
  selected?: boolean;
  onSelect: () => void;
  ruleEvaluation?: RuleEvaluation;
}

export function RestaurantCard({ rec, rank, selected, onSelect, ruleEvaluation }: RestaurantCardProps) {
  const { restaurant, detour, perpendicularDistance, eta, accessibility, score, scoreComponents, reasons, backward } = rec;
  const [imgError, setImgError] = useState(false);
  const [showScore, setShowScore] = useState(false);

  const ringColor = getScoreRingColor(score);
  const circumference = 2 * Math.PI * 14; // r=14, small ring
  const dashOffset = circumference * (1 - score / 100);

  const detourMin = Math.ceil(detour.detourDurationSeconds / 60);
  const detourKm  = (detour.detourDistanceMetres / 1000).toFixed(1);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'bg-white rounded-xl border overflow-hidden cursor-pointer relative',
        'transition-all duration-200 group',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
        selected
          ? 'border-[#2563eb] ring-2 ring-blue-500/15 shadow-[0_4px_12px_rgba(37,99,235,0.1)]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)]'
      )}
    >
      {/* Score detail overlay */}
      {showScore && (
        <ScoreBreakdownPanel
          score={score}
          components={scoreComponents}
          reasons={reasons}
          restaurantName={restaurant.name}
          onClose={() => { setShowScore(false); }}
        />
      )}

      {/* Image */}
      <div className="relative h-36 bg-slate-100 overflow-hidden flex-shrink-0">
        {restaurant.image_url && !imgError ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
            <Leaf className="h-8 w-8 text-slate-300" />
          </div>
        )}

        {/* Rank */}
        <div className="absolute top-2 left-2 bg-[#1a2540]/80 backdrop-blur-sm text-white rounded-md px-1.5 py-0.5 text-xs font-semibold">
          #{rank}
        </div>

        {/* Score ring (top-right) */}
        <button
          onClick={e => { e.stopPropagation(); setShowScore(true); }}
          className="absolute top-2 right-2 group/score"
          title="View score breakdown"
        >
          <div className="relative w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
            <svg width="36" height="36" viewBox="0 0 36 36" className="absolute inset-0">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14"
                fill="none" stroke={ringColor} strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 18 18)"
              />
            </svg>
            <span className={cn('text-[10px] font-bold relative z-10', getScoreColor(score))}>{score}</span>
          </div>
        </button>

        {/* Veg dot */}
        {restaurant.is_vegetarian && (
          <div className="absolute bottom-2 left-2 bg-[#f0fdf4] border border-[#86efac] rounded-full w-5 h-5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
          </div>
        )}

        {/* Demo badge */}
        {restaurant.is_demo && (
          <div className="absolute bottom-2 right-2 bg-amber-500/85 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
            Demo
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Row 1: Name + rating */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#0d1421] leading-tight truncate">{restaurant.name}</h3>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
              <span className="truncate">{restaurant.cuisine}</span>
              <span className="text-slate-300">·</span>
              <span className="font-medium text-slate-600">{priceLevelSymbol(restaurant.price_level)}</span>
            </div>
          </div>
          {restaurant.rating !== null && (
            <div className={cn('flex items-center gap-0.5 flex-shrink-0 text-xs font-semibold', getRatingColor(restaurant.rating))}>
              <Star className="h-3 w-3 fill-current" />
              {restaurant.rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Row 2: ETA + arrival time */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
          <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
          <span className="font-medium text-[#1a2540]">Arrives {eta.etaFormatted}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">+{detourMin} min</span>
        </div>

        {/* Row 3: Status badges */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          <EtaStatusBadge
            label={eta.availabilityLabel}
            isOpen={eta.isOpenAtEta}
            closingWarning={eta.closingWarning}
            size="xs"
          />
          <AccessBadge info={accessibility} size="xs" />
        </div>

        {/* Row 4: Key stats */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-lg mb-2.5">
          <MiniStat
            label="Off route"
            value={formatDistance(perpendicularDistance)}
            highlight={perpendicularDistance < 50}
          />
          <MiniStat
            label="Detour"
            value={`+${detourKm} km`}
            highlight={detour.detourDistanceMetres < 500}
          />
          <MiniStat
            label="Drive+"
            value={detourMin < 1 ? '<1 min' : `+${detourMin} min`}
            highlight={detourMin <= 3}
          />
        </div>

        {/* Backward travel warning */}
        {backward?.hasBackwardTravel && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mb-2.5">
            <TriangleAlert className="h-3 w-3 flex-shrink-0" />
            <span>Requires ~{Math.round(backward.backtrackDistanceMetres)} m backtrack</span>
          </div>
        )}

        {/* Footer: Score label + View button */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={e => { e.stopPropagation(); setShowScore(true); }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#2563eb] transition-colors"
          >
            <BarChart2 className="h-3 w-3" />
            <span className={cn('font-medium', getScoreColor(score))}>{scoreLabel(score)}</span>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onSelect(); }}
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all',
              selected
                ? 'bg-[#2563eb] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-[#eff6ff] hover:text-[#2563eb]'
            )}
          >
            View stop
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Why this result? */}
      {ruleEvaluation && <RejectionPanel evaluation={ruleEvaluation} />}
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className={cn('text-xs font-semibold', highlight ? 'text-emerald-600' : 'text-[#1a2540]')}>{value}</p>
    </div>
  );
}
