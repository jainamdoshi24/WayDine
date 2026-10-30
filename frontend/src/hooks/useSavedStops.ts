import { useState, useCallback, useEffect } from 'react';
import { Restaurant } from '@/types';

const STORAGE_KEY = 'waydine_saved_stops';

export interface SavedStop {
  restaurant: Restaurant;
  savedAt: string;
  routeContext?: string; // e.g. "Mumbai → Pune"
}

export function useSavedStops() {
  const [savedStops, setSavedStops] = useState<SavedStop[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStops));
    } catch {
      // localStorage may be unavailable
    }
  }, [savedStops]);

  const isSaved = useCallback(
    (id: number) => savedStops.some(s => s.restaurant.id === id),
    [savedStops],
  );

  const toggleSave = useCallback((restaurant: Restaurant, routeContext?: string) => {
    setSavedStops(prev => {
      if (prev.some(s => s.restaurant.id === restaurant.id)) {
        return prev.filter(s => s.restaurant.id !== restaurant.id);
      }
      return [...prev, { restaurant, savedAt: new Date().toISOString(), routeContext }];
    });
  }, []);

  const clearAll = useCallback(() => setSavedStops([]), []);

  return { savedStops, isSaved, toggleSave, clearAll };
}
