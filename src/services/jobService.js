import { apiClient } from './authService';
import { RESUME_API_BASE_URL, JOB_ENDPOINTS } from './endpoints';
import { getStoredResumeId } from './enhanceResumeService';
import { getUserPlan, getNByPlan, getStoredJobMatches } from './resumeService';

export const JOBS_API_URL = JOB_ENDPOINTS?.LIST || '/api/jobs';

/**
 * GET /api/jobs
 * List ONLY the authenticated user’s stored job matches at or above the configured minimum ATS score.
 *
 * Authorization: Bearer access JWT (Injected automatically by apiClient)
 * Request: No body; optional URL query parameters.
 *
 * @param {Object} [params]
 * @param {string} [params.q] - Keyword search
 * @param {string} [params.location] - Location query
 * @param {string} [params.role] - Role query
 * @param {string} [params.workplace] - 'remote', 'on-site', 'hybrid'
 * @param {string} [params.employmentType] - 'full-time', 'part-time', 'contract', 'internship', 'freelance'
 * @param {number|string|Array} [params.companyId] - Company ID(s)
 * @param {number} [params.postedWithinDays] - Positive integer (e.g. 7, 14, 30)
 * @param {string} [params.sort='best_match'] - 'best_match' (highest ATS score first) or 'newest' (newest first)
 * @param {number} [params.page=0] - 0-indexed page number
 * @param {number} [params.size=20] - Page size (1 to 50, default 20)
 * @returns {Promise<{ items: Array, page: number, size: number, totalItems: number, totalPages: number }>}
 */
export const getJobs = async (params = {}) => {
  // Clean and prepare query parameters
  const queryParams = {};

  if (params.resumeId !== undefined && params.resumeId !== null && params.resumeId !== '') {
    queryParams.resumeId = params.resumeId;
  }

  if (params.q && typeof params.q === 'string' && params.q.trim()) {
    queryParams.q = params.q.trim();
  }
  if (params.location && typeof params.location === 'string' && params.location.trim()) {
    queryParams.location = params.location.trim();
  }
  if (params.role && typeof params.role === 'string' && params.role.trim()) {
    queryParams.role = params.role.trim();
  }
  if (params.workplace && typeof params.workplace === 'string' && params.workplace.trim()) {
    queryParams.workplace = params.workplace.trim();
  }
  if (params.employmentType && typeof params.employmentType === 'string' && params.employmentType.trim()) {
    queryParams.employmentType = params.employmentType.trim();
  }
  if (params.companyId !== undefined && params.companyId !== null && params.companyId !== '') {
    queryParams.companyId = params.companyId;
  }
  if (typeof params.postedWithinDays === 'number' && params.postedWithinDays > 0) {
    queryParams.postedWithinDays = params.postedWithinDays;
  } else if (
    typeof params.postedWithinDays === 'string' &&
    !isNaN(parseInt(params.postedWithinDays, 10)) &&
    parseInt(params.postedWithinDays, 10) > 0
  ) {
    queryParams.postedWithinDays = parseInt(params.postedWithinDays, 10);
  }

  // Sort: sort=newest orders by newest posting first; any other sort including default best_match orders by highest ATS score first
  if (params.sort && typeof params.sort === 'string') {
    queryParams.sort = params.sort.trim();
  } else {
    queryParams.sort = 'best_match';
  }

  // Page starts at 0
  const page = typeof params.page === 'number' && params.page >= 0 ? params.page : 0;
  queryParams.page = page;

  // Size: default size=20, minimum 1, maximum 50
  let size = 20;
  if (typeof params.size === 'number' && !isNaN(params.size)) {
    size = Math.min(50, Math.max(1, params.size));
  }
  queryParams.size = size;

  console.log('[jobService] Calling GET /api/jobs with params:', queryParams);

  const response = await apiClient.get(JOBS_API_URL, {
    params: queryParams,
  });

  console.log('[jobService] GET /api/jobs Raw Response Data:', response.data);
  console.log('[jobService] GET /api/jobs Formatted Response:', JSON.stringify(response.data, null, 2));

  const data = response.data || {};
  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.matches)
    ? data.matches
    : Array.isArray(data.jobs)
    ? data.jobs
    : Array.isArray(data.content)
    ? data.content
    : Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];

  const responsePage = typeof data.page === 'number' ? data.page : page;
  const responseSize = typeof data.size === 'number' ? data.size : size;
  const totalItems =
    typeof data.totalItems === 'number'
      ? data.totalItems
      : typeof data.totalElements === 'number'
      ? data.totalElements
      : typeof data.total_elements === 'number'
      ? data.total_elements
      : typeof data.total === 'number'
      ? data.total
      : typeof data.totalCount === 'number'
      ? data.totalCount
      : typeof data.count === 'number'
      ? data.count
      : items.length;
  const totalPages =
    typeof data.totalPages === 'number'
      ? data.totalPages
      : typeof data.total_pages === 'number'
      ? data.total_pages
      : Math.max(1, Math.ceil(totalItems / (responseSize || 20)));

  return {
    items,
    page: responsePage,
    size: responseSize,
    totalItems,
    totalPages,
    raw: data,
  };
};

/**
 * GET /api/jobs/{jobId}
 * Fetch detailed job information for a specific job ID.
 *
 * Authorization: Bearer access JWT (Injected automatically by apiClient)
 * Request: No body.
 *
 * @param {string|number} jobId - Original job ID
 * @returns {Promise<Object>} Job details object
 */
export const getJobById = async (jobId) => {
  const cleanId = (jobId || '').toString().trim();
  if (!cleanId) {
    throw new Error('Job ID is required to fetch job details.');
  }

  const endpoint = JOB_ENDPOINTS?.GET_BY_ID?.(cleanId) || `${JOBS_API_URL}/${encodeURIComponent(cleanId)}`;
  console.log(`[jobService] Calling GET /api/jobs/${cleanId} (Target: http://192.168.1.13:8081/api/jobs/${cleanId})`);

  try {
    const response = await apiClient.get(endpoint);
    console.log(`[jobService] GET /api/jobs/${cleanId} Raw Response Data:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[jobService] Error fetching job details for ID ${cleanId}:`, error);
    throw error;
  }
};


/**
 * GET /api/dashboard
 * Fetch dashboard counters and top five matched jobs.
 *
 * Authorization: Bearer access JWT (Injected automatically by apiClient)
 * Request: No body.
 *
 * Response shape:
 * {
 *   "jobsFound": 1200,
 *   "qualifiedMatches": 85,
 *   "applicationsSubmitted": 0,
 *   "applicationsRemaining": 100,
 *   "applicationAllowance": 250,
 *   "topMatches": [
 *     {
 *       "jobId": 42,
 *       "title": "Java Developer",
 *       "companyName": "Example Inc",
 *       "companyDomain": "example.com",
 *       "location": "Austin, TX",
 *       "country": "US",
 *       "workplace": "remote",
 *       "employmentType": "full-time",
 *       "postedAt": "2026-10-02T12:30:00",
 *       "matchScore": 82.5
 *     }
 *   ]
 * }
 *
 * @returns {Promise<{ jobsFound: number, qualifiedMatches: number, applicationsSubmitted: number, applicationsRemaining: number, applicationAllowance: number, topMatches: Array, raw: Object }>}
 */
export const getDashboard = async () => {
  console.log('[jobService] Calling GET /api/dashboard');
  const response = await apiClient.get('/api/dashboard');
  console.log('[jobService] GET /api/dashboard Raw Response Data:', response.data);
  console.log('[jobService] GET /api/dashboard Formatted Response:', JSON.stringify(response.data, null, 2));

  const data = response.data || {};
  return {
    jobsFound: typeof data.jobsFound === 'number' ? data.jobsFound : 0,
    qualifiedMatches: typeof data.qualifiedMatches === 'number' ? data.qualifiedMatches : 0,
    applicationsSubmitted: typeof data.applicationsSubmitted === 'number' ? data.applicationsSubmitted : 0,
    applicationsRemaining: typeof data.applicationsRemaining === 'number' ? data.applicationsRemaining : 0,
    applicationAllowance: typeof data.applicationAllowance === 'number' ? data.applicationAllowance : 0,
    topMatches: Array.isArray(data.topMatches) ? data.topMatches : [],
    raw: data,
  };
};

export const getDashboardData = getDashboard;
export const fetchDashboard = getDashboard;
export const fetchJobs = getJobs;
export const fetchStoredJobs = getJobs;
export const listJobs = getJobs;

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
  getJobs,
  getJobById,
  getDashboard,
  getDashboardData,
  fetchDashboard,
  fetchJobs,
  fetchStoredJobs,
  listJobs,
  JOBS_API_URL,
  getMoreJobs,
  getMoreJobsForResume,
  getPrimaryResumeId,
  getNMoreJDsForResume,
  getMoreJDs,
  getLastJobId,
  getLastStoredJobId,
  GET_MORE_JOBS_URL,
};
