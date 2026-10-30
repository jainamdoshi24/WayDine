import { useState } from 'react';
import { Recommendation } from '@/types';
import {
  formatDistance, priceLevelSymbol,
  getRatingColor, getScoreColor, getScoreRingColor, scoreLabel, cn,
} from '@/lib/utils';
import {
  X, Star, Clock, Navigation2, MapPin, ExternalLink,
  CheckCircle2, HelpCircle, Bookmark, BookmarkCheck,
  ChevronLeft, Utensils, TriangleAlert, Phone, Globe,
} from 'lucide-react';
import { AccessBadge, EtaStatusBadge } from './StatusBadges';

interface RestaurantDetailPanelProps {
  rec: Recommendation;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  routeContext?: string;
}

export function RestaurantDetailPanel({
  rec,
  onClose,
  isSaved,
  onToggleSave,
  routeContext,
}: RestaurantDetailPanelProps) {
  const { restaurant, detour, perpendicularDistance, eta, accessibility, score, scoreComponents, reasons, backward } = rec;
  const [imgError, setImgError] = useState(false);

  const ringColor = getScoreRingColor(score);
  const circumference = 2 * Math.PI * 28; // r=28 — large ring
  const dashOffset = circumference * (1 - score / 100);

  const detourMin = Math.ceil(detour.detourDurationSeconds / 60);
  const detourKm = (detour.detourDistanceMetres / 1000).toFixed(1);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;

  const COMPONENT_LABELS: Record<string, string> = {
    detourEfficiency: 'Detour efficiency',
    directionSuitability: 'Direction suitability',
    accessibility: 'Road accessibility',
    timeSuitability: 'Meal timing',
    preferenceMatch: 'Preference match',
  };
  const COMPONENT_WEIGHTS: Record<string, number> = {
    detourEfficiency: 0.35,
    directionSuitability: 0.25,
    accessibility: 0.20,
    timeSuitability: 0.10,
    preferenceMatch: 0.10,
  };

  return (
    <div className="absolute inset-0 bg-white flex flex-col z-30 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#1a2540] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 truncate">{routeContext ?? 'Route details'}</p>
        </div>
        <button
          onClick={onToggleSave}
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all border',
            isSaved
              ? 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
          )}
          title={isSaved ? 'Remove from saved' : 'Save this stop'}
        >
          {isSaved
            ? <><BookmarkCheck className="h-3.5 w-3.5" />Saved</>
            : <><Bookmark className="h-3.5 w-3.5" />Save</>
          }
        </button>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Hero image */}
        <div className="relative h-40 bg-slate-100 flex-shrink-0 overflow-hidden">
          {restaurant.image_url && !imgError ? (
            <img
              src={restaurant.image_url}
              alt={restaurant.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
              <Utensils className="h-10 w-10 text-slate-300" />
            </div>
          )}
          {restaurant.is_demo && (
            <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Demo data
            </div>
          )}
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Name + meta row */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-base font-semibold text-[#0d1421] leading-tight">{restaurant.name}</h2>
              {restaurant.rating !== null && (
                <div className={cn('flex items-center gap-0.5 flex-shrink-0 text-sm font-bold', getRatingColor(restaurant.rating))}>
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {restaurant.rating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>{restaurant.cuisine}</span>
              <span className="text-slate-300">·</span>
              <span className="font-medium text-slate-600">{priceLevelSymbol(restaurant.price_level)}</span>
              {restaurant.is_vegetarian && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Pure veg
                  </span>
                </>
              )}
              {restaurant.review_count > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{restaurant.review_count.toLocaleString()} reviews</span>
                </>
              )}
            </div>
            <div className="flex items-start gap-1 mt-1.5 text-xs text-slate-400">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{restaurant.address}</span>
            </div>
          </div>

          {/* Efficiency score */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-4">
              {/* Large score ring */}
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none" stroke={ringColor} strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 32 32)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn('text-lg font-bold leading-none', getScoreColor(score))}>{score}</span>
                  <span className="text-[9px] text-slate-400 font-medium">/100</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium mb-1">Pitstop Efficiency</p>
                <p className={cn('text-sm font-semibold', getScoreColor(score))}>{scoreLabel(score)} stop</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mode: <span className="font-medium text-slate-600 capitalize">{rec.mode}</span>
                </p>
              </div>
            </div>

            {/* Score breakdown bars */}
            <div className="mt-3 space-y-1.5">
              {(Object.keys(scoreComponents) as Array<keyof typeof scoreComponents>).map(key => {
                const val = scoreComponents[key];
                const weight = COMPONENT_WEIGHTS[key] ?? 0;
                const weighted = Math.round(val * weight * 100);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-28 text-[10px] text-slate-500 truncate flex-shrink-0">
                      {COMPONENT_LABELS[key] ?? key}
                    </div>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(val * 100, 100)}%`,
                          backgroundColor: val >= 0.75 ? '#16a34a' : val >= 0.5 ? '#d97706' : '#dc2626',
                        }}
                      />
                    </div>
                    <span className={cn('text-[10px] font-semibold w-6 text-right flex-shrink-0', getScoreColor(weighted))}>{weighted}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ETA & availability */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-[#1a2540]">Estimated arrival</p>
            </div>
            <div className="px-3 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#2563eb] flex-shrink-0" />
                <span className="text-sm font-semibold text-[#1a2540]">Arrives at {eta.etaFormatted}</span>
              </div>
              <EtaStatusBadge
                label={eta.availabilityLabel}
                isOpen={eta.isOpenAtEta}
                closingWarning={eta.closingWarning}
                size="sm"
              />
              {eta.mealAvailable && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium capitalize text-slate-700">{eta.mealAvailable}</span> available at arrival
                </p>
              )}
              {/* Food availability grid */}
              <div className="flex gap-2 pt-1 flex-wrap">
                {(['breakfast', 'lunch', 'snacks', 'dinner'] as const).map(meal => {
                  const available = restaurant.food_availability[meal];
                  return (
                    <span
                      key={meal}
                      className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full capitalize',
                        available
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-100 text-slate-400 line-through'
                      )}
                    >
                      {meal}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Route detour stats */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-[#1a2540]">Detour & route position</p>
            </div>
            <div className="px-3 py-3">
              <div className="grid grid-cols-3 gap-3">
                <DetailStat
                  label="Off route"
                  value={formatDistance(perpendicularDistance)}
                  highlight={perpendicularDistance < 50}
                />
                <DetailStat
                  label="Extra drive"
                  value={`+${detourKm} km`}
                  highlight={detour.detourDistanceMetres < 500}
                />
                <DetailStat
                  label="Extra time"
                  value={detourMin < 1 ? '<1 min' : `+${detourMin} min`}
                  highlight={detourMin <= 3}
                />
              </div>
              {detour.detourSource === 'estimated' && (
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 flex-shrink-0" />
                  Detour time is estimated (road routing unavailable)
                </p>
              )}
            </div>
          </div>

          {/* Access info */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-[#1a2540]">Road access</p>
            </div>
            <div className="px-3 py-3 space-y-2">
              <AccessBadge info={accessibility} size="sm" />
              {restaurant.highway_access && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Access notes: </span>
                  {restaurant.highway_access}
                </p>
              )}
              {backward?.hasBackwardTravel && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                  <TriangleAlert className="h-3 w-3 flex-shrink-0" />
                  <span>~{Math.round(backward.backtrackDistanceMetres)} m backtrack required</span>
                </div>
              )}
            </div>
          </div>

          {/* Why this stop */}
          {reasons.length > 0 && (
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-[#1a2540]">Why this stop</p>
              </div>
              <ul className="px-3 py-3 space-y-1.5">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact & links */}
          {(restaurant.phone || restaurant.website) && (
            <div className="flex gap-2">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {restaurant.phone}
                </a>
              )}
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
            </div>
          )}

          {/* Navigation CTA */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#2563eb] hover:bg-[#1e4fc2] text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            <Navigation2 className="h-4 w-4" />
            Navigate to this stop
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>

          <p className="text-[10px] text-slate-400 text-center pb-2">
            Opens Google Maps with directions
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={cn('text-sm font-bold', highlight ? 'text-emerald-600' : 'text-[#1a2540]')}>{value}</p>
    </div>
  );
}
