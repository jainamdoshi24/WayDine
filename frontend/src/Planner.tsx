import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Coordinate, Recommendation, RouteResponse, AppState, UserPreferences,
  DetourBudget, RuleEvaluation, RejectionAnalytics,
} from '@/types';
import { MapView } from '@/components/map/MapView';
import { RouteSummaryCard } from '@/components/map/RouteSummaryCard';
import { ResultsPanel } from '@/components/restaurants/ResultsPanel';
import { RestaurantDetailPanel } from '@/components/restaurants/RestaurantDetailPanel';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { DemoModal, DemoScenario } from '@/components/demo/DemoModal';
import { SavedStopsDrawer } from '@/components/saved/SavedStopsDrawer';
import { useSavedStops } from '@/hooks/useSavedStops';
import { DetourWalletPanel } from '@/components/wallet/DetourWalletPanel';
import { api } from '@/lib/api';

const DEFAULT_PREFS: UserPreferences = {
  meal: 'any',
  maxDetourMetres: 5000,
  maxPriceLevel: 4,
  vegetarianOnly: false,
  cuisines: [],
  mode: 'strict',
};

const DEFAULT_BUDGET: DetourBudget = {
  maxDistanceKm: 5,
  maxTimeMinutes: 10,
  mode: 'both',
  preset: 'balanced',
};

interface PlannerProps {
  /** Injected from LandingPage when the hero search triggers a search */
  initialSource?: string;
  initialDest?: string;
  onRouteFound?: () => void;
  plannerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function Planner({
  initialSource = '',
  initialDest = '',
  onRouteFound,
  plannerRef,
}: PlannerProps) {
  const [appState, setAppState]               = useState<AppState>('idle');
  const [routeData, setRouteData]             = useState<RouteResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [ruleEvaluations, setRuleEvaluations] = useState<RuleEvaluation[]>([]);
  const [analytics, setAnalytics]             = useState<RejectionAnalytics | null>(null);
  const [selectedId, setSelectedId]           = useState<number | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [sourceCoord, setSourceCoord]         = useState<Coordinate | null>(null);
  const [destCoord, setDestCoord]             = useState<Coordinate | null>(null);
  const [sourceLabel, setSourceLabel]         = useState(initialSource);
  const [destLabel, setDestLabel]             = useState(initialDest);
  const [filterOpen, setFilterOpen]           = useState(false);
  const [preferences, setPreferences]         = useState<UserPreferences>(DEFAULT_PREFS);
  const [detourBudget, setDetourBudget]       = useState<DetourBudget>(DEFAULT_BUDGET);
  const [lastRoute, setLastRoute]             = useState<RouteResponse | null>(null);
  const [demoOpen, setDemoOpen]               = useState(false);
  const [savedOpen, setSavedOpen]             = useState(false);
  const [routeWarning, setRouteWarning]       = useState<string | null>(null);

  const { savedStops, isSaved, toggleSave, clearAll } = useSavedStops();

  // ── Fetch recommendations ────────────────────────────────────────────────

  const fetchRecommendations = useCallback(async (
    route: RouteResponse,
    prefs: UserPreferences,
    budget: DetourBudget,
  ) => {
    setAppState('recommending');
    setRecommendations([]);
    setRuleEvaluations([]);
    setAnalytics(null);
    setSelectedId(null);

    try {
      const prefsWithBudget: UserPreferences = {
        ...prefs,
        departureTime:  prefs.departureTime ?? new Date().toISOString(),
        detourBudget:   budget,
        maxDetourMetres: budget.mode !== 'time'     ? budget.maxDistanceKm  * 1000 : 999_999,
        maxDetourTimeSeconds: budget.mode !== 'distance' ? budget.maxTimeMinutes * 60 : 999_999,
      };
      const recsRes = await api.getRecommendations(route, prefsWithBudget);
      setRecommendations(recsRes.data);
      setRuleEvaluations(recsRes.ruleEvaluations ?? []);
      setAnalytics(recsRes.analytics ?? null);
      setAppState('results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recommendation fetch failed.';
      setError(msg);
      setAppState('error');
    }
  }, []);

  const handleSearch = useCallback(async (source: string, destination: string) => {
    setError(null);
    setRecommendations([]);
    setRuleEvaluations([]);
    setAnalytics(null);
    setSelectedId(null);
    setRouteWarning(null);
    setAppState('routing');
    setSourceLabel(source);
    setDestLabel(destination);

    try {
      const routeRes = await api.getRoute({ source, destination });
      const route = routeRes.data;
      setRouteData(route);
      setLastRoute(route);
      setSourceCoord(routeRes.resolvedSource);
      setDestCoord(routeRes.resolvedDestination);
      if (routeRes.warning) setRouteWarning(routeRes.warning);
      onRouteFound?.();
      await fetchRecommendations(route, preferences, detourBudget);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      setAppState('error');
    }
  }, [preferences, detourBudget, fetchRecommendations, onRouteFound]);

  const handleApplyFilters = useCallback(async (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    if (lastRoute) await fetchRecommendations(lastRoute, newPrefs, detourBudget);
  }, [lastRoute, detourBudget, fetchRecommendations]);

  const handleBudgetChange = useCallback(async (newBudget: DetourBudget) => {
    setDetourBudget(newBudget);
    if (lastRoute) await fetchRecommendations(lastRoute, preferences, newBudget);
  }, [lastRoute, preferences, fetchRecommendations]);

  // ── Auto-trigger search when hero passes new source/dest ─────────────────
  const heroSearchKeyRef = useRef<string>('');
  useEffect(() => {
    const key = `${initialSource}||${initialDest}`;
    if (initialSource && initialDest && key !== heroSearchKeyRef.current) {
      heroSearchKeyRef.current = key;
      handleSearch(initialSource, initialDest);
    }
  // handleSearch is stable (useCallback), safe to include
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSource, initialDest]);

  const handleLoadDemo = useCallback((scenario: DemoScenario) => {
    const prefOverride: UserPreferences = { ...DEFAULT_PREFS };
    if (scenario.preferenceHint === 'vegetarianOnly=true') prefOverride.vegetarianOnly = true;
    if (scenario.preferenceHint?.startsWith('meal=')) {
      const m = scenario.preferenceHint.split('=')[1];
      if (m !== 'any') prefOverride.meal = m as UserPreferences['meal'];
    }
    setPreferences(prefOverride);
    handleSearch(scenario.source, scenario.destination);
  }, [handleSearch]);

  const isLoading    = appState === 'routing' || appState === 'recommending';
  const hasRoute     = routeData !== null;
  const selectedRec  = recommendations.find(r => r.restaurant.id === selectedId) ?? null;
  const routeContext = sourceLabel && destLabel ? `${sourceLabel} → ${destLabel}` : undefined;

  const etaDestination = routeData
    ? (() => {
        const arrival = new Date(
          (preferences.departureTime ? new Date(preferences.departureTime) : new Date()).getTime()
          + routeData.duration * 1000
        );
        return arrival.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      })()
    : undefined;

  return (
    <div ref={plannerRef} className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">

      {/* Route warning banner */}
      {routeWarning && !isLoading && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <span className="text-amber-700 text-xs font-medium flex-1">{routeWarning}</span>
          <button onClick={() => setRouteWarning(null)} className="text-amber-500 hover:text-amber-700 text-xs">Dismiss</button>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <MapView
            routeGeometry={routeData?.geometry ?? null}
            recommendations={recommendations}
            selectedId={selectedId}
            onSelectRestaurant={setSelectedId}
            sourceCoord={sourceCoord}
            destCoord={destCoord}
          />

          {/* Route summary */}
          {routeData && (
            <div className="absolute top-3 left-3 z-10">
              <RouteSummaryCard
                distance={routeData.distance}
                duration={routeData.duration}
                waypointCount={routeData.geometry.length}
                source={sourceLabel}
                destination={destLabel}
                routeSource={routeData.source}
                etaDestination={etaDestination}
              />
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-white rounded-xl px-5 py-4 shadow-lg border border-slate-200 flex items-center gap-3 pointer-events-auto">
                <div className="w-4 h-4 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-sm font-medium text-[#1a2540]">
                  {appState === 'routing' ? 'Calculating route…' : 'Finding pitstops…'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Results sidebar */}
        <div className="w-80 lg:w-[22rem] flex-shrink-0 border-l border-slate-200 flex flex-col overflow-hidden shadow-[-2px_0_8px_rgba(0,0,0,0.04)] relative">

          {/* Detour wallet (collapsible, inside sidebar) */}
          <div className="px-3 pt-3 flex-shrink-0">
            <DetourWalletPanel
              budget={detourBudget}
              onChange={handleBudgetChange}
              compact
            />
          </div>

          <ResultsPanel
            recommendations={recommendations}
            loading={isLoading}
            error={appState === 'error' ? error : null}
            selectedId={selectedId}
            onSelectRestaurant={setSelectedId}
            hasRoute={hasRoute || isLoading}
            onOpenFilters={() => setFilterOpen(true)}
            preferences={preferences}
            ruleEvaluations={ruleEvaluations}
            analytics={analytics}
          />

          {/* Detail panel overlay */}
          {selectedRec && (
            <RestaurantDetailPanel
              rec={selectedRec}
              onClose={() => setSelectedId(null)}
              isSaved={isSaved(selectedRec.restaurant.id)}
              onToggleSave={() => toggleSave(selectedRec.restaurant, routeContext)}
              routeContext={routeContext}
            />
          )}
        </div>
      </div>

      {/* Overlays */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        preferences={preferences}
        onApply={handleApplyFilters}
      />

      <DemoModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onLoadScenario={handleLoadDemo}
      />

      <SavedStopsDrawer
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        savedStops={savedStops}
        onClearAll={clearAll}
        onRemove={(id) => {
          const stop = savedStops.find(s => s.restaurant.id === id);
          if (stop) toggleSave(stop.restaurant);
        }}
      />
    </div>
  );
}

export { Planner };
