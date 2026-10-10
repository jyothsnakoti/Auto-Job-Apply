import { apiClient, fetchWithAuth } from './authService';
import { APPLICATION_ENDPOINTS, API_BASE_URL } from './endpoints';

/**
 * Storage key for cached applications data
 */
const APPLICATIONS_STORAGE_KEY = 'applicationsData';

/**
 * Helper to get cached applications data from localStorage / sessionStorage
 * @returns {Object|null}
 */
export const getStoredApplicationsData = () => {
  try {
    const raw =
      localStorage.getItem(APPLICATIONS_STORAGE_KEY) ||
      sessionStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[applicationService] Error reading cached applications data:', err);
  }
  return null;
};

/**
 * Helper to cache applications data and dispatch update events
 * @param {Object} data
 */
export const setStoredApplicationsData = (data) => {
  if (!data || typeof data !== 'object') return;
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, serialized);
    sessionStorage.setItem(APPLICATIONS_STORAGE_KEY, serialized);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('applicationsDataUpdated', { detail: data })
      );
      window.dispatchEvent(new CustomEvent('applicationsUpdated'));
    }
  } catch (err) {
    console.warn('[applicationService] Error caching applications data:', err);
  }
};

/**
 * Normalizes raw status string to one of the tab category names:
 * 'All' | 'Submitted' | 'In Progress' | 'Needs Action' | 'Failed' | 'Skipped'
 *
 * @param {string} status
 * @returns {string}
 */
export const getApplicationStatusCategory = (appOrStatus, maybeTab) => {
  let status = appOrStatus;
  let tab = maybeTab;

  if (appOrStatus && typeof appOrStatus === 'object') {
    tab = appOrStatus.tab || maybeTab;
    status = appOrStatus.status || appOrStatus.statusCategory || appOrStatus.applicationStatus || appOrStatus.state;
  }

  // 1. If explicit 'tab' is provided by backend (e.g. tab: "IN_PROGRESS" or "NEEDS_ACTION")
  if (tab) {
    const t = String(tab).trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (['IN_PROGRESS', 'INPROGRESS', 'QUEUED', 'PREPARING', 'PROCESSING', 'PENDING'].includes(t)) {
      return 'In Progress';
    }
    if (['NEEDS_ACTION', 'NEED_ACTION', 'ACTION_REQUIRED', 'ACTION_NEEDED', 'REQUIRES_ACTION'].includes(t)) {
      return 'Needs Action';
    }
    if (['SUBMITTED', 'APPLIED', 'COMPLETE', 'COMPLETED', 'SUCCESS'].includes(t)) {
      return 'Submitted';
    }
    if (['FAILED', 'ERROR', 'REJECTED', 'UNSUCCESSFUL'].includes(t)) {
      return 'Failed';
    }
    if (['SKIPPED', 'IGNORED', 'CANCELLED', 'CANCELED'].includes(t)) {
      return 'Skipped';
    }
  }

  if (!status) return 'In Progress';
  const s = String(status).trim().toUpperCase().replace(/[\s-]+/g, '_');

  // Check Needs Action statuses
  if (['NEEDS_ACTION', 'NEED_ACTION', 'ACTION_REQUIRED', 'ACTION_NEEDED', 'REQUIRES_ACTION'].includes(s)) {
    return 'Needs Action';
  }

  // Check In Progress statuses (QUEUED, PREPARING, IN_PROGRESS, APPLYING, PENDING, PROCESSING)
  if (['IN_PROGRESS', 'INPROGRESS', 'QUEUED', 'QUED', 'PREPARING', 'APPLYING', 'PENDING', 'PROCESSING'].includes(s)) {
    return 'In Progress';
  }

  // Check Submitted statuses
  if (['SUBMITTED', 'APPLIED', 'SUCCESS', 'COMPLETE', 'COMPLETED'].includes(s)) {
    return 'Submitted';
  }

  // Check Failed statuses
  if (['FAILED', 'ERROR', 'REJECTED', 'UNSUCCESSFUL'].includes(s)) {
    return 'Failed';
  }

  // Check Skipped statuses
  if (['SKIPPED', 'IGNORED', 'CANCELLED', 'CANCELED'].includes(s)) {
    return 'Skipped';
  }

  return 'In Progress';
};

/**
 * GET /api/applications
 * Fetch applications and summary counts for the authenticated user
 *
 * Authorization: Bearer <access_token> (Automatically attached by apiClient)
 * Response structure:
 * {
 *   counts: {
 *     all: number,
 *     submitted: number,
 *     inProgress: number,
 *     needsAction: number,
 *     failed: number,
 *     skipped: number
 *   },
 *   applications: {
 *     items: [
 *       {
 *         id: number,
 *         jobId: number,
 *         jobTitle: string,
 *         companyName: string,
 *         companyDomain: string|null,
 *         atsScore: number,
 *         resumeType: string|null,
 *         status: string
 *       }
 *     ]
 *   }
 * }
 *
 * @param {Object} [params] - Optional query parameters
 * @returns {Promise<{
 *   counts: { all: number, submitted: number, inProgress: number, needsAction: number, failed: number, skipped: number },
 *   applications: { items: Array<Object> },
 *   items: Array<Object>
 * }>}
 */
export const getApplications = async (params = {}) => {
  const url = APPLICATION_ENDPOINTS?.GET || `${API_BASE_URL}/api/applications`;

  try {
    console.log('[applicationService] Fetching applications from:', url);
    const response = await apiClient.get(url, { params });

    if (response && response.data) {
      const rawData = response.data;
      const data =
        rawData?.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)
          ? { ...rawData.data, ...rawData }
          : rawData;

      // Extract array of application items
      const items = Array.isArray(data?.applications?.items)
        ? data.applications.items
        : Array.isArray(data?.applications)
          ? data.applications
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(rawData?.data?.applications?.items)
              ? rawData.data.applications.items
              : Array.isArray(rawData?.data?.items)
                ? rawData.data.items
                : Array.isArray(data)
                  ? data
                  : [];

      // Extract raw counts object from API response if present
      const rawCounts = data?.counts || rawData?.data?.counts || null;

      let counts;
      if (rawCounts && typeof rawCounts === 'object') {
        const allVal = typeof rawCounts.all === 'number' ? rawCounts.all : items.length;
        const submittedVal = typeof rawCounts.submitted === 'number'
          ? rawCounts.submitted
          : items.filter((i) => getApplicationStatusCategory(i) === 'Submitted').length;
        const inProgressVal = typeof rawCounts.inProgress === 'number'
          ? rawCounts.inProgress
          : typeof rawCounts.in_progress === 'number'
            ? rawCounts.in_progress
            : items.filter((i) => getApplicationStatusCategory(i) === 'In Progress').length;
        const needsActionVal = typeof rawCounts.needsAction === 'number'
          ? rawCounts.needsAction
          : typeof rawCounts.needs_action === 'number'
            ? rawCounts.needs_action
            : items.filter((i) => getApplicationStatusCategory(i) === 'Needs Action').length;
        const failedVal = typeof rawCounts.failed === 'number'
          ? rawCounts.failed
          : items.filter((i) => getApplicationStatusCategory(i) === 'Failed').length;
        const skippedVal = typeof rawCounts.skipped === 'number'
          ? rawCounts.skipped
          : items.filter((i) => getApplicationStatusCategory(i) === 'Skipped').length;

        counts = {
          all: allVal,
          submitted: submittedVal,
          inProgress: inProgressVal,
          needsAction: needsActionVal,
          failed: failedVal,
          skipped: skippedVal,
        };
      } else {
        // Fallback: compute counts directly from application items
        counts = {
          all: items.length,
          submitted: items.filter((i) => getApplicationStatusCategory(i) === 'Submitted').length,
          inProgress: items.filter((i) => getApplicationStatusCategory(i) === 'In Progress').length,
          needsAction: items.filter((i) => getApplicationStatusCategory(i) === 'Needs Action').length,
          failed: items.filter((i) => getApplicationStatusCategory(i) === 'Failed').length,
          skipped: items.filter((i) => getApplicationStatusCategory(i) === 'Skipped').length,
        };
      }

      const normalizedResult = {
        ...data,
        counts,
        applications: {
          ...(typeof data?.applications === 'object' ? data.applications : {}),
          items,
        },
        items,
      };

      setStoredApplicationsData(normalizedResult);
      return normalizedResult;
    }

    throw new Error('No data received from /api/applications');
  } catch (error) {
    console.warn('[applicationService] apiClient.get failed, trying fallback fetchWithAuth:', error?.message);

    try {
      const res = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const rawData = await res.json();
        const data =
          rawData?.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)
            ? { ...rawData.data, ...rawData }
            : rawData;

        const items = Array.isArray(data?.applications?.items)
          ? data.applications.items
          : Array.isArray(data?.applications)
            ? data.applications
            : Array.isArray(data?.items)
              ? data.items
              : Array.isArray(rawData?.data?.applications?.items)
                ? rawData.data.applications.items
                : Array.isArray(rawData?.data?.items)
                  ? rawData.data.items
                  : Array.isArray(data)
                    ? data
                    : [];

        const rawCounts = data?.counts || rawData?.data?.counts || null;
        let counts;
        if (rawCounts && typeof rawCounts === 'object') {
          const allVal = typeof rawCounts.all === 'number' ? rawCounts.all : items.length;
          const submittedVal = typeof rawCounts.submitted === 'number'
            ? rawCounts.submitted
            : items.filter((i) => getApplicationStatusCategory(i) === 'Submitted').length;
          const inProgressVal = typeof rawCounts.inProgress === 'number'
            ? rawCounts.inProgress
            : typeof rawCounts.in_progress === 'number'
              ? rawCounts.in_progress
              : items.filter((i) => getApplicationStatusCategory(i) === 'In Progress').length;
          const needsActionVal = typeof rawCounts.needsAction === 'number'
            ? rawCounts.needsAction
            : typeof rawCounts.needs_action === 'number'
              ? rawCounts.needs_action
              : items.filter((i) => getApplicationStatusCategory(i) === 'Needs Action').length;
          const failedVal = typeof rawCounts.failed === 'number'
            ? rawCounts.failed
            : items.filter((i) => getApplicationStatusCategory(i) === 'Failed').length;
          const skippedVal = typeof rawCounts.skipped === 'number'
            ? rawCounts.skipped
            : items.filter((i) => getApplicationStatusCategory(i) === 'Skipped').length;

          counts = {
            all: allVal,
            submitted: submittedVal,
            inProgress: inProgressVal,
            needsAction: needsActionVal,
            failed: failedVal,
            skipped: skippedVal,
          };
        } else {
          counts = {
            all: items.length,
            submitted: items.filter((i) => getApplicationStatusCategory(i) === 'Submitted').length,
            inProgress: items.filter((i) => getApplicationStatusCategory(i) === 'In Progress').length,
            needsAction: items.filter((i) => getApplicationStatusCategory(i) === 'Needs Action').length,
            failed: items.filter((i) => getApplicationStatusCategory(i) === 'Failed').length,
            skipped: items.filter((i) => getApplicationStatusCategory(i) === 'Skipped').length,
          };
        }

        const normalizedResult = {
          ...data,
          counts,
          applications: {
            ...(typeof data?.applications === 'object' ? data.applications : {}),
            items,
          },
          items,
        };

        setStoredApplicationsData(normalizedResult);
        return normalizedResult;
      }
    } catch (fallbackError) {
      console.error('[applicationService] Fallback fetch failed:', fallbackError?.message);
    }

    // Return cached data if available on network error
    const cached = getStoredApplicationsData();
    if (cached) {
      console.info('[applicationService] Returning cached applications data');
      return cached;
    }

    throw error;
  }
};

/**
 * Fetch application counts directly
 * @returns {Promise<{ all: number, submitted: number, inProgress: number, needsAction: number, failed: number, skipped: number }>}
 */
export const getApplicationCounts = async () => {
  try {
    const data = await getApplications();
    return data?.counts || {
      all: 0,
      submitted: 0,
      inProgress: 0,
      needsAction: 0,
      failed: 0,
      skipped: 0,
    };
  } catch (err) {
    console.warn('[applicationService] Error getting application counts:', err);
    const cached = getStoredApplicationsData();
    return cached?.counts || {
      all: 0,
      submitted: 0,
      inProgress: 0,
      needsAction: 0,
      failed: 0,
      skipped: 0,
    };
  }
};

export default {
  getApplications,
  getApplicationCounts,
  getStoredApplicationsData,
  setStoredApplicationsData,
  getApplicationStatusCategory,
};
