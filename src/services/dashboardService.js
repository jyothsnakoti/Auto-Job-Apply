import { apiClient, fetchWithAuth } from './authService';
import { DASHBOARD_ENDPOINTS, API_BASE_URL } from './endpoints';

/**
 * Storage key for cached dashboard statistics
 */
const DASHBOARD_STORAGE_KEY = 'dashboardData';

/**
 * Helper to get cached dashboard data from localStorage/sessionStorage
 * @returns {Object|null}
 */
export const getStoredDashboardData = () => {
  try {
    const raw =
      localStorage.getItem(DASHBOARD_STORAGE_KEY) ||
      sessionStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[dashboardService] Error reading cached dashboard data:', err);
  }
  return null;
};

/**
 * Helper to update cached dashboard data
 * @param {Object} data
 */
export const setStoredDashboardData = (data) => {
  if (!data || typeof data !== 'object') return;
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(DASHBOARD_STORAGE_KEY, serialized);
    sessionStorage.setItem(DASHBOARD_STORAGE_KEY, serialized);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dashboardDataUpdated', { detail: data })
      );
    }
  } catch (err) {
    console.warn('[dashboardService] Error caching dashboard data:', err);
  }
};

/**
 * Fetch dynamic Dashboard Data from GET /api/dashboard
 * Includes: jobsFound, qualifiedMatches, applicationsSubmitted, applicationsRemaining, applicationAllowance, topMatches
 *
 * @returns {Promise<{
 *   jobsFound: number,
 *   qualifiedMatches: number,
 *   applicationsSubmitted: number,
 *   applicationsRemaining: number,
 *   applicationAllowance: number,
 *   topMatches: Array<Object>
 * }>}
 */
export const getDashboardData = async () => {
  const url = DASHBOARD_ENDPOINTS?.GET || `${API_BASE_URL}/api/dashboard`;

  try {
    console.log('[dashboardService] Fetching dashboard data from:', url);
    const response = await apiClient.get(url);

    if (response && response.data) {
      const data = response.data;
      setStoredDashboardData(data);
      return data;
    }

    throw new Error('No data received from dashboard API');
  } catch (error) {
    console.warn('[dashboardService] apiClient.get failed, trying fallback fetchWithAuth:', error?.message);

    try {
      const res = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStoredDashboardData(data);
        return data;
      }
    } catch (fallbackError) {
      console.error('[dashboardService] Fallback fetch also failed:', fallbackError?.message);
    }

    // Return cached data if available on network error
    const cached = getStoredDashboardData();
    if (cached) {
      console.info('[dashboardService] Returning cached dashboard data');
      return cached;
    }

    throw error;
  }
};

export default {
  getDashboardData,
  getStoredDashboardData,
  setStoredDashboardData,
};
