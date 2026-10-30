import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Coordinate, Recommendation } from '@/types';
import { formatDistance, getScoreRingColor } from '@/lib/utils';
import { Star, Navigation, Clock } from 'lucide-react';

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Score-ring restaurant marker.
 * Shows the efficiency score number inside a coloured SVG ring.
 * Selected = larger, white ring background, drop shadow.
 */
function createRestaurantIcon(score: number, selected: boolean) {
  const ringColor = getScoreRingColor(score);
  const size     = selected ? 44 : 36;
  const r        = selected ? 20 : 16;
  const cx       = size / 2;
  const circ     = 2 * Math.PI * r;
  const dashOffset = circ * (1 - score / 100);
  const fontSize   = selected ? 11 : 9;
  const bgFill     = selected ? '#fff' : '#fff';
  const shadow     = selected
    ? '0 4px 16px rgba(0,0,0,0.28)'
    : '0 2px 8px rgba(0,0,0,0.18)';
  const border = selected ? `2px solid ${ringColor}` : '1.5px solid #e2e8f0';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px; height:${size}px;
        border-radius:50%;
        background:${bgFill};
        border:${border};
        box-shadow:${shadow};
        position:relative;
        cursor:pointer;
        transition:all 0.2s;
      ">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position:absolute;inset:0;">
          <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${selected ? 3 : 2.5}" />
          <circle cx="${cx}" cy="${cx}" r="${r}"
            fill="none" stroke="${ringColor}" stroke-width="${selected ? 3 : 2.5}"
            stroke-linecap="round"
            stroke-dasharray="${circ}"
            stroke-dashoffset="${dashOffset}"
            transform="rotate(-90 ${cx} ${cx})"
          />
        </svg>
        <div style="
          position:absolute; inset:0;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          font-family:system-ui,sans-serif;
        ">
          <span style="font-size:${fontSize}px; font-weight:700; color:${ringColor}; line-height:1;">${score}</span>
        </div>
      </div>
    `,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createEndpointIcon(type: 'source' | 'destination') {
  const color = type === 'source' ? '#2563eb' : '#ef4444';
  const label = type === 'source' ? 'A' : 'B';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 2.5px solid white;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 8px rgba(0,0,0,0.25);
        color: white;
        font-size: 11px;
        font-weight: 700;
        font-family: system-ui;
      ">${label}</div>
    `,
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
  });
}

interface MapViewProps {
  routeGeometry: Coordinate[] | null;
  recommendations: Recommendation[];
  selectedId: number | null;
  onSelectRestaurant: (id: number) => void;
  sourceCoord?: Coordinate | null;
  destCoord?: Coordinate | null;
}

function FitBounds({ coords }: { coords: Coordinate[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (coords.length < 2) return;
    const bounds = L.latLngBounds(coords.map(c => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
    fitted.current = true;
  }, [coords, map]);

  return null;
}

export function MapView({
  routeGeometry,
  recommendations,
  selectedId,
  onSelectRestaurant,
  sourceCoord,
  destCoord,
}: MapViewProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

  const allCoords: Coordinate[] = routeGeometry ?? [];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {allCoords.length >= 2 && <FitBounds coords={allCoords} />}

      {/* Route polyline */}
      {routeGeometry && routeGeometry.length >= 2 && (
        <Polyline
          positions={routeGeometry.map(c => [c.lat, c.lng] as [number, number])}
          color="#2563eb"
          weight={4}
          opacity={0.85}
        />
      )}

      {/* Source marker */}
      {sourceCoord && (
        <Marker
          position={[sourceCoord.lat, sourceCoord.lng]}
          icon={createEndpointIcon('source')}
        >
          <Popup className="waydine-popup">
            <div className="text-xs font-semibold text-[#1a2540]">Starting Point</div>
          </Popup>
        </Marker>
      )}

      {/* Destination marker */}
      {destCoord && (
        <Marker
          position={[destCoord.lat, destCoord.lng]}
          icon={createEndpointIcon('destination')}
        >
          <Popup>
            <div className="text-xs font-semibold text-[#1a2540]">Destination</div>
          </Popup>
        </Marker>
      )}

      {/* Restaurant markers */}
      {recommendations.map((rec) => (
        <Marker
          key={rec.restaurant.id}
          position={[rec.restaurant.latitude, rec.restaurant.longitude]}
          icon={createRestaurantIcon(rec.score, selectedId === rec.restaurant.id)}
          eventHandlers={{
            click: () => onSelectRestaurant(rec.restaurant.id),
          }}
        >
          <Popup maxWidth={240}>
            <div className="p-1 min-w-[180px]">
              <div className="font-semibold text-sm text-[#1a2540] mb-0.5">
                {rec.restaurant.name}
              </div>
              <div className="text-xs text-slate-500 mb-2">{rec.restaurant.cuisine}</div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                {rec.restaurant.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {rec.restaurant.rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <Navigation className="h-3 w-3 text-blue-500" />
                  +{formatDistance(rec.detour.detourDistanceMetres)} detour
                </span>
              </div>
              {rec.eta?.eta && (
                <div className="flex items-center gap-0.5 text-xs text-slate-500 mt-1">
                  <Clock className="h-3 w-3" />
                  Arrive ~{new Date(rec.eta.eta).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
