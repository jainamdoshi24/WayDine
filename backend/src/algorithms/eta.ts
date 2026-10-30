/**
 * ETA calculation and meal-window checking — Phase 2.
 *
 * Opening hours format: "HH:MM-HH:MM" (24h), "closed", "00:00-23:59" (all day).
 * Overnight ranges like "22:00-02:00" are handled correctly.
 * All local-time math is done via Intl.DateTimeFormat to avoid offset errors.
 */

import {
  EtaInfo,
  MealWindow,
  MealWindowDef,
  Restaurant,
} from '../types/index.js';
import { formatTime12h } from './geo.js';

// ── Meal windows ─────────────────────────────────────────────────────────────

export const MEAL_WINDOWS: MealWindowDef[] = [
  { name: 'breakfast', label: 'Breakfast', startHour: 6,  startMin: 0,  endHour: 10, endMin: 30 },
  { name: 'lunch',     label: 'Lunch',     startHour: 11, startMin: 30, endHour: 15, endMin: 0  },
  { name: 'snacks',    label: 'Snacks',    startHour: 15, startMin: 0,  endHour: 18, endMin: 30 },
  { name: 'dinner',    label: 'Dinner',    startHour: 18, startMin: 30, endHour: 22, endMin: 30 },
];

export const ALL_MEALS: MealWindow[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

// ── Local time helpers (pure Intl, no offset arithmetic) ─────────────────────

/**
 * Get local { hour, minute, dayAbbr } for a Date in the given timezone.
 */
function localTimeParts(date: Date, tz: string): { hour: number; minute: number; dayAbbr: string } {
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
  }).formatToParts(date);

  const hour   = parseInt(timeParts.find(p => p.type === 'hour')!.value, 10);
  const minute = parseInt(timeParts.find(p => p.type === 'minute')!.value, 10);

  const dayFull = date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: tz })
    .toLowerCase().slice(0, 3);

  return { hour, minute, dayAbbr: dayFull };
}

/**
 * Parse "HH:MM-HH:MM" into { openMin, closeMin } in minutes-of-day.
 * closeMin may be > 1440 for overnight ranges.
 */
function parseHoursToMinutes(str: string): { openMin: number; closeMin: number } | null {
  const m = str.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!m) return null;

  const [, oh, om, ch, cm] = m.map(Number);
  const openMin  = oh * 60 + om;
  let closeMin   = ch * 60 + cm;

  // Overnight: e.g. 22:00-02:00 means close at 02:00 next day (= 1560 min)
  if (closeMin <= openMin) closeMin += 1440;

  return { openMin, closeMin };
}

/**
 * Check if a given local time (in minutes-of-day) falls within opening hours.
 * Returns null when hours string is unparseable.
 */
function isOpenAt(hoursStr: string, localMinOfDay: number): boolean | null {
  const lower = hoursStr.toLowerCase().trim();
  if (lower === 'closed') return false;
  if (lower === '*' || lower === '00:00-23:59' || lower === '0:00-23:59') return true;

  const parsed = parseHoursToMinutes(hoursStr);
  if (!parsed) return null;

  const { openMin, closeMin } = parsed;

  // Overnight: also check next-day wrap
  if (localMinOfDay < openMin) {
    // Check if we're in the overnight tail (e.g. 01:00 when hours are 22:00-02:00)
    return (localMinOfDay + 1440) >= openMin && (localMinOfDay + 1440) < closeMin;
  }

  return localMinOfDay >= openMin && localMinOfDay < closeMin;
}

/**
 * Minutes until closing. Returns null if can't determine.
 */
function minutesUntilClose(hoursStr: string, localMinOfDay: number): number | null {
  const lower = hoursStr.toLowerCase().trim();
  if (lower === 'closed') return 0;
  if (lower === '*' || lower === '00:00-23:59') return 1440;

  const parsed = parseHoursToMinutes(hoursStr);
  if (!parsed) return null;

  const { openMin, closeMin } = parsed;
  if (localMinOfDay < openMin) {
    const wrapped = localMinOfDay + 1440;
    return wrapped < closeMin ? closeMin - wrapped : null;
  }

  return closeMin - localMinOfDay;
}

// ── Meal windows ──────────────────────────────────────────────────────────────

export function getMealWindowsAtTime(date: Date, tz = 'Asia/Kolkata'): MealWindow[] {
  const { hour, minute } = localTimeParts(date, tz);
  const totalMin = hour * 60 + minute;

  return MEAL_WINDOWS
    .filter(w => {
      const start = w.startHour * 60 + w.startMin;
      const end   = w.endHour   * 60 + w.endMin;
      return totalMin >= start && totalMin <= end;
    })
    .map(w => w.name);
}

// ── Main ETA computation ──────────────────────────────────────────────────────

export function computeEta(
  departure: Date,
  routePosition: number,
  totalRouteDistance: number,
  totalRouteDuration: number,
  detourDurationSeconds: number,
  restaurant: Restaurant,
  requestedMeal?: MealWindow | 'any',
  tz = 'Asia/Kolkata'
): EtaInfo {
  const fraction = totalRouteDistance > 0
    ? Math.min(1, routePosition / totalRouteDistance)
    : 0;

  const secondsToProjection = fraction * totalRouteDuration;
  const etaDate = new Date(
    departure.getTime() + (secondsToProjection + detourDurationSeconds) * 1000
  );
  const etaFormatted = formatTime12h(etaDate);

  // Local time at ETA
  const { hour, minute, dayAbbr } = localTimeParts(etaDate, tz);
  const localMinOfDay = hour * 60 + minute;

  // Opening hours check
  const hoursStr =
    restaurant.opening_hours[dayAbbr] ??
    restaurant.opening_hours['*'];

  let isOpenAtEta: boolean | null = null;
  let closingWarning = false;

  if (hoursStr !== undefined) {
    isOpenAtEta = isOpenAt(hoursStr, localMinOfDay);
    if (isOpenAtEta === true) {
      const minsLeft = minutesUntilClose(hoursStr, localMinOfDay);
      if (minsLeft !== null && minsLeft < 30) closingWarning = true;
    }
  }

  // Meal windows at ETA
  const activeMealWindows = getMealWindowsAtTime(etaDate, tz);
  let mealAvailable: MealWindow | null = null;

  const effectiveMeal = requestedMeal && requestedMeal !== 'any' ? requestedMeal : undefined;

  // Helper: safely read food_availability — 'all_day' is not a key in FoodAvailability
  const foodAvail = restaurant.food_availability as unknown as Record<string, boolean>;

  if (effectiveMeal) {
    if (
      activeMealWindows.includes(effectiveMeal) &&
      foodAvail[effectiveMeal] !== false
    ) {
      mealAvailable = effectiveMeal;
    }
  } else {
    for (const meal of ALL_MEALS) {
      if (activeMealWindows.includes(meal) && foodAvail[meal]) {
        mealAvailable = meal;
        break;
      }
    }
  }

  const availabilityLabel = buildAvailabilityLabel({
    isOpenAtEta, closingWarning, mealAvailable,
    requestedMeal: effectiveMeal, restaurant, activeMealWindows,
  });

  return {
    eta: etaDate.toISOString(),
    etaFormatted,
    mealAvailable,
    isOpenAtEta,
    closingWarning,
    availabilityLabel,
  };
}

// ── Label builder ─────────────────────────────────────────────────────────────

interface LabelArgs {
  isOpenAtEta: boolean | null;
  closingWarning: boolean;
  mealAvailable: MealWindow | null;
  requestedMeal?: MealWindow;
  restaurant: Restaurant;
  activeMealWindows: MealWindow[];
}

function buildAvailabilityLabel({
  isOpenAtEta, closingWarning, mealAvailable,
  requestedMeal, restaurant, activeMealWindows,
}: LabelArgs): string {
  if (isOpenAtEta === false) return 'Closed at estimated arrival';
  if (closingWarning)        return 'Closes soon after arrival — call ahead';

  if (requestedMeal) {
    if (mealAvailable) return `${cap(requestedMeal)} available at arrival`;
    if (!activeMealWindows.includes(requestedMeal)) {
      return `${cap(requestedMeal)} window missed at arrival`;
    }
    if ((restaurant.food_availability as unknown as Record<string, boolean>)[requestedMeal] === false) {
      return `${cap(requestedMeal)} not served here`;
    }
    return 'Meal availability unverified';
  }

  if (mealAvailable) return `${cap(mealAvailable)} available at arrival`;
  if (activeMealWindows.length === 0) return 'No standard meal window at arrival';
  if (isOpenAtEta === true) return 'Open at arrival — meal availability unverified';

  return 'Meal availability unverified';
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
