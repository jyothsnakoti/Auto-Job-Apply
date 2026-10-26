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

export const getDashboardData = async (resumeId = null) => {
  const url = DASHBOARD_ENDPOINTS?.GET || `${API_BASE_URL}/api/dashboard`;

  // Add resumeId only when a specific resume is selected.
  const config =
    resumeId !== null && resumeId !== undefined
      ? { params: { resumeId } }
      : {};

  try {
    console.log("[dashboardService] Fetching dashboard data:", {
      url,
      resumeId,
    });

    const response = await apiClient.get(url, config);
    const data = response?.data;

    if (!data) {
      throw new Error("No data received from dashboard API");
    }

    // Cache only the All Resumes response.
    // Do not overwrite global dashboard data with filtered data.
    if (resumeId === null || resumeId === undefined) {
      setStoredDashboardData(data);
    }

    console.log("[dashboardService] Dashboard response:", data);

    return data;
  } catch (error) {
    console.error(
      "[dashboardService] Dashboard API failed:",
      error?.response?.data || error?.message
    );

    throw error;
  }
};


export default {
  getDashboardData,
  getStoredDashboardData,
  setStoredDashboardData,
};
