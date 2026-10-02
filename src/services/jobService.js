import { apiClient } from './authService';
import { RESUME_API_BASE_URL } from './endpoints';
import { getStoredResumeId } from './enhanceResumeService';
import { getUserPlan, getNByPlan, getStoredJobMatches } from './resumeService';

/**
 * Endpoint for fetching additional matching Job Descriptions for a Resume
 * POST https://fog-slacked-prankster.ngrok-free.dev/api/v1/Get_N_moreJDs_for_Res
 */
export const GET_MORE_JOBS_URL = `${RESUME_API_BASE_URL || 'https://fog-slacked-prankster.ngrok-free.dev'}/api/v1/Get_N_moreJDs_for_Res`;

/**
 * Helper to extract the unique Job ID (LastJDid) from a job card or match object
 * @param {Object|string} job
 * @returns {string}
 */
export const getLastJobId = (job) => {
  if (!job) return '';
  if (typeof job === 'string') return job.trim();
  return (
    job.job_id ||
    job.JDid ||
    job.jd_id ||
    job.rawMatch?.job_id ||
    job.rawMatch?.JDid ||
    job.id ||
    ''
  ).toString().trim();
};

/**
 * Helper to get the last matched job ID from the provided list or stored matches
 * @param {Array} [jobsList]
 * @returns {string}
 */
export const getLastStoredJobId = (jobsList = null) => {
  if (Array.isArray(jobsList) && jobsList.length > 0) {
    return getLastJobId(jobsList[jobsList.length - 1]);
  }
  const stored = getStoredJobMatches();
  if (Array.isArray(stored) && stored.length > 0) {
    return getLastJobId(stored[stored.length - 1]);
  }
  return '';
};

/**
 * Fetch more matching jobs for a given resume
 * POST https://fog-slacked-prankster.ngrok-free.dev/api/v1/Get_N_moreJDs_for_Res
 *
 * @param {Object} [payload] - Optional payload overrides
 * @param {number} [payload.N] - Number of jobs to fetch (default: 10 or based on user plan)
 * @param {string} [payload.LastJDid] - ID of the last fetched job description
 * @param {number} [payload.top_k] - Top K matches pool (default: 1000)
 * @param {string} [payload.ResumeID] - Uploaded Resume ID
 * @returns {Promise<Object>} Backend response { status: "success", matches: [...] }
 */
export const getMoreJobs = async (payload = {}) => {
  // 1. Dynamically resolve ResumeID
  const ResumeID =
    payload?.ResumeID ||
    payload?.resumeId ||
    payload?.resume_id ||
    getStoredResumeId();

  if (!ResumeID) {
    console.error('[jobService] ResumeID is missing. Make sure resume has been uploaded.');
    throw new Error('Resume ID (ResumeID) is missing. Please upload a resume first.');
  }

  // 2. Dynamically resolve LastJDid from provided argument or storage
  const LastJDid =
    payload?.LastJDid ||
    payload?.lastJDid ||
    payload?.lastJobId ||
    payload?.last_job_id ||
    getLastStoredJobId();

  // 3. Dynamically resolve batch size N (default 10 or plan limit)
  const plan = getUserPlan();
  const planN = getNByPlan(plan);
  const N =
    typeof payload?.N === 'number'
      ? payload.N
      : planN > 1
      ? planN
      : 10;

  // 4. Resolve top_k (default 1000)
  const top_k =
    typeof payload?.top_k === 'number'
      ? payload.top_k
      : typeof payload?.topK === 'number'
      ? payload.topK
      : 1000;

  const requestBody = {
    N,
    LastJDid: LastJDid || '',
    top_k,
    ResumeID,
  };

  console.log('[jobService] Calling Get_N_moreJDs_for_Res API:', {
    endpoint: GET_MORE_JOBS_URL,
    body: requestBody,
  });

  const response = await apiClient.post(GET_MORE_JOBS_URL, requestBody, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Content-Type': 'application/json',
    },
  });

  console.log('[jobService] Get_N_moreJDs_for_Res Response:', response.data);

  const data = response.data || {};

  // If response has new matches, sync/append to stored matches cache
  if (Array.isArray(data.matches) && data.matches.length > 0) {
    try {
      const existing = getStoredJobMatches();
      const existingIds = new Set(
        existing.map((m) => m.job_id || m.JDid || m.id).filter(Boolean)
      );
      const newMatches = data.matches.filter(
        (m) => !existingIds.has(m.job_id || m.JDid || m.id)
      );
      const updated = [...existing, ...newMatches];
      localStorage.setItem('jobMatches', JSON.stringify(updated));
      sessionStorage.setItem('jobMatches', JSON.stringify(updated));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('jobMatchesUpdated', { detail: updated })
        );
      }
    } catch {
      // ignore storage errors
    }
  }

  return data;
};

// Aliases for compatibility
export const getNMoreJDsForResume = getMoreJobs;
export const getMoreJDs = getMoreJobs;
export const getMoreJobsForResume = getMoreJobs;
export const getPrimaryResumeId = getStoredResumeId;

export default {
  getMoreJobs,
  getMoreJobsForResume,
  getPrimaryResumeId,
  getNMoreJDsForResume,
  getMoreJDs,
  getLastJobId,
  getLastStoredJobId,
  GET_MORE_JOBS_URL,
};
