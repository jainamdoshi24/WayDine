import { SavedStop } from '@/hooks/useSavedStops';
import { priceLevelSymbol, getRatingColor, cn } from '@/lib/utils';
import { X, Bookmark, Star, Navigation2, Trash2, MapPin } from 'lucide-react';

interface SavedStopsDrawerProps {
  open: boolean;
  onClose: () => void;
  savedStops: SavedStop[];
  onClearAll: () => void;
  onRemove: (id: number) => void;
}

export function SavedStopsDrawer({
  open,
  onClose,
  savedStops,
  onClearAll,
  onRemove,
}: SavedStopsDrawerProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-[#2563eb]" />
            <h2 className="text-sm font-semibold text-[#1a2540]">Saved Stops</h2>
            {savedStops.length > 0 && (
              <span className="bg-[#2563eb] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {savedStops.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {savedStops.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {savedStops.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12 px-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <Bookmark className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-[#1a2540] mb-1">No saved stops yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Find pitstops on your route and tap Save to keep them here.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {savedStops.map(({ restaurant, savedAt: _savedAt, routeContext }) => (
                <div
                  key={restaurant.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      {restaurant.image_url ? (
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <MapPin className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs font-semibold text-[#1a2540] leading-tight truncate">
                          {restaurant.name}
                        </h3>
                        <button
                          onClick={() => onRemove(restaurant.id)}
                          className="p-0.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{restaurant.cuisine} · {priceLevelSymbol(restaurant.price_level)}</p>
                      {routeContext && (
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                          <Navigation2 className="h-2.5 w-2.5" />
                          {routeContext}
                        </p>
                      )}
                      {restaurant.rating !== null && (
                        <div className={cn('flex items-center gap-0.5 mt-0.5 text-[10px] font-semibold', getRatingColor(restaurant.rating))}>
                          <Star className="h-2.5 w-2.5 fill-current" />
                          {restaurant.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigate CTA */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-medium text-[#2563eb] border border-[#bfdbfe] bg-[#eff6ff] rounded-lg py-1.5 hover:bg-[#dbeafe] transition-colors"
                  >
                    <Navigation2 className="h-3 w-3" />
                    Navigate
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-[10px] text-slate-400 text-center">
            Stops saved locally in your browser
          </p>
        </div>
      </div>
    </>
  );
}
