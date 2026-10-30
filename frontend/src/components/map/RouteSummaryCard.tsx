import { Route, Clock, Navigation2, Zap, AlertTriangle } from 'lucide-react';
import { formatDistance, formatDuration } from '@/lib/utils';

interface RouteSummaryCardProps {
  distance: number;
  duration: number;
  waypointCount: number;
  source?: string;
  destination?: string;
  routeSource?: string;
  etaDestination?: string;
}

export function RouteSummaryCard({
  distance, duration, waypointCount, source, destination, routeSource, etaDestination,
}: RouteSummaryCardProps) {
  return (
    <div className="bg-white/96 backdrop-blur-sm rounded-xl border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden min-w-[220px] max-w-[290px]">
      {/* Route label */}
      {source && destination && (
        <div className="flex items-start gap-2 px-3.5 pt-3 pb-2.5 border-b border-slate-100">
          <Navigation2 className="h-3.5 w-3.5 text-[#2563eb] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-600 leading-tight min-w-0">
            <span className="font-semibold text-[#1a2540] truncate block">{source}</span>
            <span className="text-slate-400">↓</span>
            <span className="font-semibold text-[#1a2540] truncate block">{destination}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <Stat icon={<Route className="h-3.5 w-3.5 text-[#2563eb]" />} label="Distance" value={formatDistance(distance)} />
        <div className="w-px h-7 bg-slate-100" />
        <Stat icon={<Clock className="h-3.5 w-3.5 text-[#2563eb]" />} label="Drive time" value={formatDuration(duration)} />
        {waypointCount > 2 && (
          <>
            <div className="w-px h-7 bg-slate-100" />
            <Stat icon={<Zap className="h-3.5 w-3.5 text-slate-400" />} label="Points" value={String(waypointCount)} />
          </>
        )}
      </div>

      {/* ETA at destination */}
      {etaDestination && (
        <div className="px-3.5 pb-2.5 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>Arrive destination ~<span className="font-medium text-[#1a2540]">{etaDestination}</span></span>
        </div>
      )}

      {/* Fallback warning */}
      {routeSource === 'straight_line_fallback' && (
        <div className="mx-3 mb-2.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-100">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          Straight-line estimate — routing unavailable
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm font-bold text-[#1a2540]">{value}</div>
    </div>
  );
}
