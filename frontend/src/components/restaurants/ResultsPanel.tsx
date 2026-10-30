import { Recommendation, SortMode, UserPreferences, RuleEvaluation, RejectionAnalytics } from '@/types';
import { RestaurantCard } from './RestaurantCard';
import { SkeletonGroup } from '@/components/ui/Skeleton';
import { RejectionAnalyticsPanel } from '@/components/analytics/RejectionAnalyticsPanel';
import {
  SlidersHorizontal, MapPin, AlertCircle, Utensils, TrendingUp,
  Navigation2, Star, Clock, Filter,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ResultsPanelProps {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
  onSelectRestaurant: (id: number) => void;
  hasRoute: boolean;
  onOpenFilters: () => void;
  preferences: UserPreferences;
  ruleEvaluations?: RuleEvaluation[];
  analytics?: RejectionAnalytics | null;
}

const SORT_OPTIONS: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: 'score',  label: 'Best match',      icon: <TrendingUp className="h-3 w-3" /> },
  { value: 'detour', label: 'Least detour',    icon: <Navigation2 className="h-3 w-3" /> },
  { value: 'rating', label: 'Top rated',       icon: <Star className="h-3 w-3" /> },
  { value: 'eta',    label: 'Earliest arrival',icon: <Clock className="h-3 w-3" /> },
];

export function ResultsPanel({
  recommendations,
  loading,
  error,
  selectedId,
  onSelectRestaurant,
  hasRoute,
  onOpenFilters,
  preferences,
  ruleEvaluations = [],
  analytics = null,
}: ResultsPanelProps) {
  const [sortMode, setSortMode] = useState<SortMode>('score');

  const sorted = [...recommendations].sort((a, b) => {
    switch (sortMode) {
      case 'score':  return b.score - a.score;
      case 'detour': return a.detour.detourDistanceMetres - b.detour.detourDistanceMetres;
      case 'rating': return (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0);
      case 'eta':    return new Date(a.eta.eta).getTime() - new Date(b.eta.eta).getTime();
      default:       return 0;
    }
  });

  // Count active filters
  const activeFilters = [
    preferences.vegetarianOnly,
    (preferences.cuisines?.length ?? 0) > 0,
    (preferences.maxPriceLevel ?? 4) < 4,
    (preferences.maxDetourMetres ?? 5000) < 5000,
    preferences.meal && preferences.meal !== 'any',
    preferences.mode === 'relaxed',
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Panel header */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-sm font-semibold text-[#1a2540]">
              {loading ? 'Finding pitstops…'
                : recommendations.length > 0 ? `${recommendations.length} pitstops found`
                : 'Pitstops'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Within 200 m of your route</p>
          </div>

          <button
            onClick={onOpenFilters}
            className={cn(
              'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
              activeFilters > 0
                ? 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#2563eb] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Active filter pills */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {preferences.meal && preferences.meal !== 'any' && (
              <Badge variant="default" size="sm">{preferences.meal}</Badge>
            )}
            {preferences.vegetarianOnly && (
              <Badge variant="success" size="sm">Veg only</Badge>
            )}
            {(preferences.cuisines?.length ?? 0) > 0 && (
              <Badge variant="subtle" size="sm">{preferences.cuisines!.length} cuisines</Badge>
            )}
            {(preferences.maxDetourMetres ?? 5000) < 5000 && (
              <Badge variant="subtle" size="sm">
                ≤{((preferences.maxDetourMetres ?? 5000) / 1000).toFixed(1)} km detour
              </Badge>
            )}
          </div>
        )}

        {/* Sort tabs */}
        {recommendations.length > 1 && (
          <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortMode(opt.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-md transition-all',
                  sortMode === opt.value
                    ? 'bg-white text-[#1a2540] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
                title={opt.label}
              >
                {opt.icon}
                <span className="hidden sm:inline">{opt.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3">
        {loading && <SkeletonGroup count={4} />}

        {!loading && error && (
          <EmptyState
            icon={<AlertCircle className="h-8 w-8 text-red-400" />}
            title="Something went wrong"
            description={error}
            accent="red"
          />
        )}

        {!loading && !error && !hasRoute && (
          <EmptyState
            icon={<MapPin className="h-8 w-8 text-slate-300" />}
            title="Plan your route"
            description="Enter a start and destination above to discover the best pitstops along your journey."
          />
        )}

        {!loading && !error && hasRoute && recommendations.length === 0 && (
          <EmptyState
            icon={<Utensils className="h-8 w-8 text-slate-300" />}
            title="No pitstops found"
            description="No restaurants within 200 m of your route match your filters. Try relaxing the detour limit or adjusting preferences."
          />
        )}

        {/* Analytics panel */}
        {!loading && analytics && analytics.totalEvaluated > 0 && (
          <RejectionAnalyticsPanel analytics={analytics} />
        )}

        {!loading && sorted.map((rec, i) => (
          <RestaurantCard
            key={rec.restaurant.id}
            rec={rec}
            rank={i + 1}
            selected={selectedId === rec.restaurant.id}
            onSelect={() => onSelectRestaurant(rec.restaurant.id)}
            ruleEvaluation={ruleEvaluations.find(e => e.restaurantId === rec.restaurant.id)}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, accent = 'blue' }: {
  icon: React.ReactNode; title: string; description: string; accent?: 'blue' | 'red';
}) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
        accent === 'red' ? 'bg-red-50' : 'bg-slate-50'
      )}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#1a2540] mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">{description}</p>
    </div>
  );
}
