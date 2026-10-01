import axios from 'axios';
import { JOB_ENDPOINTS } from './endpoints';
import { getStoredTokens, apiClient } from './authService';
import { getResumes } from './resumeService';
import { getOnboardingState } from './onboardingService';

/**
 * Resolves the primary/default resume ID for the current authenticated user.
 * Tries:
 * 1. Onboarding state in sessionStorage (from recent upload)
 * 2. GET /api/resumes (inspecting isPrimary / primary / isDefault / default flags)
 * 3. Stored storage keys
 *
 * @param {string|null} [token] - Optional explicit access token
 * @returns {Promise<string|null>} Resolved resume ID string or null
 */
export const getPrimaryResumeId = async (token = null) => {
  // 1. Inspect onboarding state
  try {
    const onboarding = getOnboardingState();
    if (onboarding?.resumeId) {
      return String(onboarding.resumeId);
    }
  } catch {
    // ignore
  }

  // 2. Fetch user's resumes from backend
  try {
    const data = await getResumes(token);
    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && Array.isArray(data.resumes)) {
      list = data.resumes;
    } else if (data && Array.isArray(data.data)) {
      list = data.data;
    } else if (data && (data.id || data.resumeId || data._id || data.resume_id)) {
      list = [data];
    }

    if (list.length > 0) {
      // Find explicitly designated primary/default resume or fallback to the first
      const primaryResume =
        list.find(
          (r) =>
            r.isPrimary === true ||
            r.primary === true ||
            r.isDefault === true ||
            r.default === true
        ) || list[0];

      const id =
        primaryResume?.id ??
        primaryResume?.resumeId ??
        primaryResume?.resume_id ??
        primaryResume?._id ??
        primaryResume?.fileId ??
        primaryResume?.uuid;

      if (id !== undefined && id !== null && String(id).trim() !== '') {
        return String(id).trim();
      }
    }
  } catch (err) {
    console.warn('[jobService] Could not resolve primary resume from API:', err);
  }

  // 3. Fallback to localStorage/sessionStorage
  try {
    const storedResumeId =
      localStorage.getItem('resumeId') ||
      sessionStorage.getItem('resumeId') ||
      localStorage.getItem('primaryResumeId') ||
      sessionStorage.getItem('primaryResumeId');
    if (storedResumeId) return String(storedResumeId).trim();
  } catch {
    // ignore
  }

  return null;
};

/**
 * Fetch more job matches for a specific resume using dynamic pagination
 * Endpoint: POST https://fog-slacked-prankster.ngrok-free.dev/api/v1/Get_N_moreJDs_for_Res
 *
 * Request Body:
 * {
 *   "N": 10,
 *   "LastJDid": "<DYNAMIC_LAST_JOB_ID>",
 *   "top_k": 1000,
 *   "ResumeID": "<DYNAMIC_RESUME_ID>"
 * }
 *
 * @param {Object} params
 * @param {number} [params.N=10] - Number of jobs to fetch (default: 10)
 * @param {string|null} [params.LastJDid=null] - Dynamic cursor / last returned job ID
 * @param {number} [params.top_k=1000] - Matching pool size (default: 1000)
 * @param {string} params.ResumeID - Dynamic authenticated user's resume ID
 * @param {string|null} [token] - Optional explicit auth token
 * @returns {Promise<{ status: string, matches: Array }>}
 */
export const getMoreJobsForResume = async ({
  N = 10,
  LastJDid = null,
  top_k = 1000,
  ResumeID,
}, token = null) => {
  if (!ResumeID && ResumeID !== 0) {
    throw new Error('ResumeID is required to fetch job matches.');
  }

  const payload = {
    N: typeof N === 'number' ? N : parseInt(N, 10) || 10,
    LastJDid: LastJDid ? String(LastJDid) : '',
    top_k: typeof top_k === 'number' ? top_k : parseInt(top_k, 10) || 1000,
    ResumeID: String(ResumeID),
  };

  const { accessToken } = getStoredTokens();
  const activeToken = token || accessToken;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'ngrok-skip-browser-warning': 'true',
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
  };

  console.log(`[jobService] Fetching more jobs from: ${JOB_ENDPOINTS.GET_MORE_JOBS}`);
  console.log('[jobService] Request payload:', payload);

  try {
    const response = await axios.post(JOB_ENDPOINTS.GET_MORE_JOBS, payload, {
      headers,
    });

    console.log('[jobService] Response status:', response.status);
    console.log('[jobService] Response data:', response.data);

    const data = response.data;
    return {
      status: data?.status || 'success',
      matches: Array.isArray(data?.matches) ? data.matches : [],
      data: data,
    };
  } catch (error) {
    console.error('[jobService] Error fetching more jobs:', error);

    const backendMessage =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.response?.data?.error;

    let message = 'Unable to load more jobs. Please try again.';

    if (error.response?.status === 401) {
      message = 'Your session has expired. Please log in again.';
    } else if (error.response?.status === 403) {
      message = backendMessage || 'Access denied. Please check your active subscription.';
    } else if (error.response?.status === 404) {
      message = backendMessage || 'No matching jobs found for this resume.';
    } else if (backendMessage) {
      message = backendMessage;
    }

    const customErr = new Error(message);
    customErr.status = error.response?.status || 0;
    customErr.data = error.response?.data;
    throw customErr;
  }
};

export default {
  getPrimaryResumeId,
  getMoreJobsForResume,
};
