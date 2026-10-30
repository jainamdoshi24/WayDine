import { RouteResponse, Recommendation, UserPreferences, RuleEvaluation, RejectionAnalytics } from '@/types';

const BASE_URL = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  health: () =>
    request<{ status: string; version: string }>('/health'),

  getRoute: (payload: { source: string | { lat: number; lng: number }; destination: string | { lat: number; lng: number } }) =>
    request<{
      data: RouteResponse;
      resolvedSource: { lat: number; lng: number };
      resolvedDestination: { lat: number; lng: number };
      warning?: string;
    }>('/routes', { method: 'POST', body: JSON.stringify(payload) }),

  getRecommendations: (route: RouteResponse, preferences?: UserPreferences) =>
    request<{
      data: Recommendation[];
      total: number;
      ruleEvaluations: RuleEvaluation[];
      analytics: RejectionAnalytics;
      budgetApplied: { maxDetourMetres: number; maxDetourTimeSeconds: number; preset: string | null };
      routeSummary: { distanceMetres: number; durationSeconds: number };
      weights: Record<string, number>;
    }>('/recommendations', {
      method: 'POST',
      body: JSON.stringify({ route, preferences }),
    }),

  getRestaurants: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: unknown[]; total: number }>(`/restaurants${qs}`);
  },

  getDemoScenario: (scenarioId: string, preferences?: UserPreferences) =>
    request<{
      data: Recommendation[];
      total: number;
      routeSummary: { distanceMetres: number; durationSeconds: number };
      weights: Record<string, number>;
    }>('/demo/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenarioId, preferences }),
    }),
};
