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


import { apiClient } from './authService';
import { API_BASE_URL } from './endpoints';

export const APPLICATIONS_API_URL = `${API_BASE_URL}/api/applications`;

/**
 * Retrieve saved list of applied numeric job IDs from local client storage.
 * @returns {Array<number>}
 */
export const getStoredAppliedJobIds = () => {
  try {
    const raw =
      (typeof localStorage !== 'undefined' && (localStorage.getItem('applied_job_ids') || localStorage.getItem('appliedJobIds'))) ||
      (typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('applied_job_ids') || sessionStorage.getItem('appliedJobIds')));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !isNaN(n) && n > 0);
    }
  } catch {
    // ignore
  }
  return [];
};

/**
 * Persist one or multiple job IDs into storage as applied.
 * @param {Array<number|string|Object>} jobIds
 * @returns {Array<number>}
 */
export const markJobsAsApplied = (jobIds) => {
  if (!Array.isArray(jobIds) || jobIds.length === 0) return getStoredAppliedJobIds();
  try {
    const current = getStoredAppliedJobIds();
    const numericIds = jobIds.map((item) => typeof item === 'object' ? extractNumericJobId(item) : extractNumericJobId({ jobId: item })).filter((n) => n !== null);
    const set = new Set([...current, ...numericIds]);
    const updated = Array.from(set);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('applied_job_ids', JSON.stringify(updated));
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('applied_job_ids', JSON.stringify(updated));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appliedJobIdsUpdated', { detail: updated }));
    }
    return updated;
  } catch {
    return getStoredAppliedJobIds();
  }
};

/**
 * Check if a job has already been applied to or submitted.
 * @param {Object} job
 * @param {Array<number>} [appliedIdsList]
 * @returns {boolean}
 */
export const isJobAlreadyApplied = (job, appliedIdsList = []) => {
  if (!job) return false;
  if (job.isApplied === true || job.applied === true || job.status === 'Applied' || job.status === 'Submitted') {
    return true;
  }
  const numericId = extractNumericJobId(job);
  if (numericId !== null) {
    if (Array.isArray(appliedIdsList) && appliedIdsList.length > 0) {
      if (appliedIdsList.includes(numericId)) return true;
    }
    const stored = getStoredAppliedJobIds();
    if (stored.includes(numericId)) return true;
  }
  return false;
};

/**
 * Extract a numeric job ID from various job object shapes.
 * Handles:
 * - job.jobId, job.job_id, job.id, job.JDid, job.jd_id
 * - job.rawMatch?.jobId, job.rawMatch?.job_id, job.rawMatch?.id, job.rawMatch?.JDid, job.rawMatch?.jd_id
 * - job.numericId, job.backendJobId, job.numeric_id, job.backend_job_id
 * Returns a valid positive integer number, or null if no numeric ID is available.
 *
 * @param {Object} job
 * @returns {number|null}
 */
export const extractNumericJobId = (job) => {
  if (!job) return null;

  const candidates = [
    job.jobId,
    job.job_id,
    job.id,
    job.JDid,
    job.jd_id,
    job.numericId,
    job.numeric_id,
    job.backendJobId,
    job.backend_job_id,
    job.rawMatch?.jobId,
    job.rawMatch?.job_id,
    job.rawMatch?.id,
    job.rawMatch?.JDid,
    job.rawMatch?.jd_id,
    job.rawMatch?.numericId,
    job.rawMatch?.backendJobId,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;

    if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate > 0) {
      return candidate;
    }

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed !== '' && !isNaN(Number(trimmed)) && Number.isInteger(Number(trimmed)) && Number(trimmed) > 0) {
        return Number(trimmed);
      }
    }
  }

  return null;
};

/**
 * Extract numeric resume ID from resume object or numeric ID value.
 *
 * @param {Object|number|string} resumeOrId
 * @returns {number|null}
 */
export const extractNumericResumeId = (resumeOrId) => {
  if (resumeOrId === undefined || resumeOrId === null) return null;

  if (typeof resumeOrId === 'number' && Number.isInteger(resumeOrId) && resumeOrId > 0) {
    return resumeOrId;
  }

  if (typeof resumeOrId === 'string') {
    const trimmed = resumeOrId.trim();
    if (trimmed !== '' && !isNaN(Number(trimmed)) && Number.isInteger(Number(trimmed)) && Number(trimmed) > 0) {
      return Number(trimmed);
    }
  }

  if (typeof resumeOrId === 'object') {
    const candidates = [
      resumeOrId.id,
      resumeOrId.resumeId,
      resumeOrId.resume_id,
      resumeOrId._id,
      resumeOrId.fileId,
      resumeOrId.numericId,
    ];
    for (const candidate of candidates) {
      const parsed = extractNumericResumeId(candidate);
      if (parsed !== null) return parsed;
    }
  }

  return null;
};

/**
 * POST /api/applications
 * Queue job applications for one or multiple jobs.
 *
 * Request Payload:
 * {
 *   "resumeId": 12,
 *   "jobIds": [101, 102]
 * }
 *
 * Response: 202 Accepted
 * {
 *   "queued": [501, 502],
 *   "skipped": [
 *     {
 *       "jobId": 103,
 *       "reason": "ALREADY_SUBMITTED"
 *     }
 *   ]
 * }
 *
 * @param {Object} params
 * @param {number|string|Object} params.resumeId - Numeric resume ID
 * @param {Array<number|string|Object>} params.jobIds - Array of job IDs or job objects
 * @returns {Promise<{ queued: Array<number>, skipped: Array<{ jobId: number, reason: string }> }>}
 */
export const applyToJobs = async ({ resumeId, jobIds }) => {
  const numericResumeId = extractNumericResumeId(resumeId);

  if (!numericResumeId) {
    const err = new Error('No valid numeric resume ID provided. Please select or upload a resume in Profile.');
    err.code = 'MISSING_RESUME_ID';
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    const err = new Error('No jobs selected for application.');
    err.code = 'MISSING_JOB_IDS';
    err.status = 400;
    throw err;
  }

  // Map input job items to numeric job IDs
  const validNumericJobIds = [];
  const invalidJobItems = [];

  for (const item of jobIds) {
    const numericId = typeof item === 'object' ? extractNumericJobId(item) : extractNumericJobId({ jobId: item });
    if (numericId !== null) {
      validNumericJobIds.push(numericId);
    } else {
      invalidJobItems.push(item);
    }
  }

  if (validNumericJobIds.length === 0) {
    const err = new Error('None of the selected jobs contain a valid numeric backend Job ID.');
    err.code = 'INVALID_JOB_IDS';
    err.status = 400;
    err.invalidItems = invalidJobItems;
    throw err;
  }

  // Enforce max batch size of 50 per backend API specification
  if (validNumericJobIds.length > 50) {
    const err = new Error('Cannot apply to more than 50 jobs per single request. Use batching for larger requests.');
    err.code = 'EXCEEDS_BATCH_LIMIT';
    err.status = 400;
    throw err;
  }

  const payload = {
    resumeId: numericResumeId,
    jobIds: validNumericJobIds,
  };

  console.group('🚀 [API CALL] POST /api/applications');
  console.log('📍 Endpoint URL:', APPLICATIONS_API_URL);
  console.log('📄 Resume ID (Input):', resumeId, '-> Extracted Numeric Resume ID:', numericResumeId);
  console.log('💼 Job IDs (Input):', jobIds);
  console.log('🔢 Valid Numeric Job IDs:', validNumericJobIds, `(Count: ${validNumericJobIds.length})`);
  console.log('📤 Request Body Payload:', payload);

  try {
    const response = await apiClient.post(APPLICATIONS_API_URL, payload);
    
    console.log('📥 Response Status Code:', response.status, response.statusText || '');
    console.log('📊 Raw Response Body:', response.data);

    const data = response.data || {};
    const queued = Array.isArray(data.queued) ? data.queued : [];
    const skipped = Array.isArray(data.skipped) ? data.skipped : [];

    console.log(`✅ Queued Jobs (${queued.length}):`, queued);
    if (skipped.length > 0) {
      console.warn(`⚠️ Skipped Jobs (${skipped.length}):`, skipped);
    } else {
      console.log('⚠️ Skipped Jobs (0): []');
    }

    console.groupEnd();

    return {
      queued,
      skipped,
      raw: data,
      status: response.status,
    };
  } catch (error) {
    console.error('❌ [API ERROR] POST /api/applications request failed:');
    console.error('Status:', error.response?.status || 500);
    console.error('Error Code:', error.response?.data?.code || error.code || 'APPLICATION_ERROR');
    console.error('Server Response Data:', error.response?.data || error.message);
    console.error('Full Error Object:', error);
    console.groupEnd();

    const status = error.response?.status || 500;
    let message = error.response?.data?.message || error.response?.data?.error;

    if (!message) {
      if (status === 401) {
        message = 'Authentication required. Please log in again.';
      } else if (status === 402 || status === 403) {
        message = 'Insufficient application credits. Please upgrade your plan.';
      } else if (status === 404) {
        message = 'Specified resume or job endpoint not found on server.';
      } else {
        message = error.message || 'Failed to submit applications. Please try again.';
      }
    }

    const customErr = new Error(message);
    customErr.status = status;
    customErr.response = error.response;
    customErr.code = error.response?.data?.code || error.code || 'APPLICATION_ERROR';
    throw customErr;
  }
};

/**
 * Apply to jobs in batches of at most 50 IDs per request.
 * Useful for bulk applications when total eligible jobs exceeds 50.
 *
 * @param {Object} params
 * @param {number|string|Object} params.resumeId - Numeric resume ID
 * @param {Array<number|string|Object>} params.jobIds - Array of job IDs or job objects
 * @param {number} [params.batchSize=50] - Maximum jobs per request (default 50)
 * @returns {Promise<{ queued: Array<number>, skipped: Array<{ jobId: number, reason: string }>, totalBatches: number }>}
 */
export const applyToJobsInBatches = async ({ resumeId, jobIds, batchSize = 50 }) => {
  const numericResumeId = extractNumericResumeId(resumeId);

  if (!numericResumeId) {
    const err = new Error('No valid numeric resume ID provided. Please select or upload a resume in Profile.');
    err.code = 'MISSING_RESUME_ID';
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    const err = new Error('No jobs selected for application.');
    err.code = 'MISSING_JOB_IDS';
    err.status = 400;
    throw err;
  }

  // Extract all valid numeric IDs
  const validNumericJobIds = [];
  for (const item of jobIds) {
    const numericId = typeof item === 'object' ? extractNumericJobId(item) : extractNumericJobId({ jobId: item });
    if (numericId !== null && !validNumericJobIds.includes(numericId)) {
      validNumericJobIds.push(numericId);
    }
  }

  if (validNumericJobIds.length === 0) {
    const err = new Error('None of the selected jobs contain a valid numeric backend Job ID.');
    err.code = 'INVALID_JOB_IDS';
    err.status = 400;
    throw err;
  }

  const effectiveBatchSize = Math.min(50, Math.max(1, batchSize));
  const batches = [];
  for (let i = 0; i < validNumericJobIds.length; i += effectiveBatchSize) {
    batches.push(validNumericJobIds.slice(i, i + effectiveBatchSize));
  }

  console.group(`📦 [BATCH APPLY] Processing ${validNumericJobIds.length} jobs across ${batches.length} batch(es)`);
  console.log('Total Jobs to apply:', validNumericJobIds.length);
  console.log('Batch size:', effectiveBatchSize);
  console.log('Batches array:', batches);

  const allQueued = [];
  const allSkipped = [];

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch = batches[bIdx];
    console.log(`▶️ Processing Batch ${bIdx + 1}/${batches.length} (${batch.length} job IDs)...`);
    const result = await applyToJobs({ resumeId: numericResumeId, jobIds: batch });
    if (Array.isArray(result.queued)) {
      allQueued.push(...result.queued);
    }
    if (Array.isArray(result.skipped)) {
      allSkipped.push(...result.skipped);
    }
  }

  console.log('🎉 [BATCH APPLY COMPLETED]');
  console.log(`Total Queued: ${allQueued.length}`, allQueued);
  console.log(`Total Skipped: ${allSkipped.length}`, allSkipped);
  console.groupEnd();

  return {
    queued: allQueued,
    skipped: allSkipped,
    totalBatches: batches.length,
    totalProcessed: validNumericJobIds.length,
  };
};

/**
 * Normalizes a raw status string into a clean uppercase token.
 * E.g., "in_progress", "In Progress", "in-progress" -> "IN_PROGRESS"
 * @param {string} rawStatus
 * @returns {string|null}
 */
export const normalizeApplicationStatus = (rawStatus) => {
  if (rawStatus === undefined || rawStatus === null) return null;
  const str = String(rawStatus).trim().toUpperCase().replace(/[\s-]/g, '_');
  return str || null;
};

/**
 * Checks whether an application status represents an active or completed submission
 * where the user should NOT be allowed to click Apply Now.
 * 
 * Rules per backend contract:
 * - PREPARING, QUEUED, IN_PROGRESS, NEEDS_ACTION, SUBMITTED -> HIDE Apply Now (true)
 * - FAILED, SKIPPED -> SHOW Apply Now (false)
 * - No existing application -> SHOW Apply Now (false)
 *
 * @param {string} rawStatus
 * @returns {boolean}
 */
export const isApplicationStatusActiveOrCompleted = (rawStatus) => {
  const norm = normalizeApplicationStatus(rawStatus);
  if (!norm) return false;

  const activeOrCompletedStatuses = [
    'PREPARING',
    'QUEUED',
    'IN_PROGRESS',
    'NEEDS_ACTION',
    'SUBMITTED',
    'COMPLETED',
    'SUCCESS',
    'APPLIED',
  ];

  return activeOrCompletedStatuses.includes(norm);
};

/**
 * GET /api/applications?tab=all&page=0&size=50
 * Fetches user application records to determine per-job status.
 * Handles duplicate application records for a job by picking the latest record.
 *
 * @returns {Promise<{
 *   applicationMap: Map<number, Object>,
 *   rawList: Array<Object>
 * }>}
/**
 * Extract the actual Job ID (jobId) from an application record object.
 * NEVER returns the application record's own primary key (id).
 *
 * @param {Object} record
 * @returns {number|string|null}
 */
export const extractJobIdFromApplicationRecord = (record) => {
  if (!record || typeof record !== 'object') return null;

  const candidates = [
    record.jobId,
    record.job_id,
    record.job?.jobId,
    record.job?.job_id,
    record.job?.id,
    record.job?.JDid,
    record.job?.jd_id,
    record.jd_id,
    record.JDid,
  ];

  for (const cand of candidates) {
    if (cand === undefined || cand === null || cand === '') continue;
    if (typeof cand === 'number' && !isNaN(cand) && cand > 0) return cand;
    if (typeof cand === 'string' && cand.trim() !== '') {
      const num = Number(cand.trim());
      if (!isNaN(num) && num > 0) return num;
      return cand.trim();
    }
  }

  return null;
};

/**
 * Retrieve the matching backend application record for a job card object.
 * Maps card job ID candidates to application.jobId. NEVER matches application.id.
 *
 * @param {Object} job
 * @param {Map<number|string, Object>} [applicationMap]
 * @returns {Object|null}
 */
export const getMatchingApplicationForJob = (job, applicationMap) => {
  if (!job || !applicationMap || typeof applicationMap.has !== 'function' || applicationMap.size === 0) {
    return null;
  }

  const numericJobId = extractNumericJobId(job);
  if (numericJobId !== null && applicationMap.has(numericJobId)) {
    return applicationMap.get(numericJobId);
  }

  const stringCandidates = [
    job.jobId,
    job.job_id,
    job.JDid,
    job.jd_id,
    job.id,
    job.rawMatch?.jobId,
    job.rawMatch?.job_id,
    job.rawMatch?.JDid,
    job.rawMatch?.jd_id,
    job.rawMatch?.id,
  ];

  for (const cand of stringCandidates) {
    if (cand !== undefined && cand !== null && cand !== '') {
      const strCand = String(cand).trim();
      if (applicationMap.has(strCand)) {
        return applicationMap.get(strCand);
      }
    }
  }

  return null;
};

/**
 * GET /api/applications?tab=all&page=0&size=50
 * Fetches user application records to determine per-job status.
 * Handles nested response shapes (data.applications.items, data.items, etc.)
 *
 * @returns {Promise<{
 *   applicationMap: Map<number|string, Object>,
 *   rawList: Array<Object>
 * }>}
 */
export const getApplicationStatuses = async () => {
  console.group('🔍 [API CALL] GET /api/applications');
  try {
    const url = `${APPLICATIONS_API_URL}?tab=all&page=0&size=50`;
    console.log('📍 Endpoint URL:', url);
    const response = await apiClient.get(url);
    console.log('📥 Response Status Code:', response.status);
    console.log('📊 Raw Response Body:', response.data);

    let rawList = [];
    const data = response.data;
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.applications?.items)) rawList = data.applications.items;
      else if (Array.isArray(data.items)) rawList = data.items;
      else if (Array.isArray(data.content)) rawList = data.content;
      else if (Array.isArray(data.applications)) rawList = data.applications;
      else if (Array.isArray(data.data)) rawList = data.data;
      else if (Array.isArray(data.results)) rawList = data.results;
    }

    // Check pagination metadata if available
    const totalPages =
      data?.applications?.totalPages ||
      data?.applications?.page?.totalPages ||
      data?.totalPages ||
      data?.page?.totalPages ||
      1;

    if (totalPages > 1) {
      console.log(`📑 Total pages available: ${totalPages}. Fetching remaining pages...`);
      for (let p = 1; p < totalPages && p < 10; p++) {
        try {
          const pageRes = await apiClient.get(`${APPLICATIONS_API_URL}?tab=all&page=${p}&size=50`);
          const pData = pageRes.data;
          let pList = [];
          if (Array.isArray(pData)) pList = pData;
          else if (pData && typeof pData === 'object') {
            pList =
              pData.applications?.items ||
              pData.items ||
              pData.content ||
              pData.applications ||
              pData.data ||
              pData.results ||
              [];
          }
          rawList.push(...pList);
        } catch (pErr) {
          console.warn(`[applicationService] Failed to fetch page ${p} of applications:`, pErr);
        }
      }
    }

    console.log(`📋 Total application records retrieved: ${rawList.length}`);

    // Map each actual job ID (jobId) to its latest application record.
    // NEVER map by application ID (record.id).
    const applicationMap = new Map();

    const getRecordTime = (rec) => {
      const time = rec?.updatedAt || rec?.updated_at || rec?.createdAt || rec?.created_at || rec?.timestamp || rec?.date;
      if (time) {
        const t = new Date(time).getTime();
        if (!isNaN(t)) return t;
      }
      return 0;
    };

    const updateMapForId = (key, record, idx) => {
      if (key === undefined || key === null || key === '') return;
      if (!applicationMap.has(key)) {
        applicationMap.set(key, record);
      } else {
        const existing = applicationMap.get(key);
        const existingTime = getRecordTime(existing);
        const currentTime = getRecordTime(record);
        if (currentTime > existingTime || (currentTime === existingTime && idx >= rawList.indexOf(existing))) {
          applicationMap.set(key, record);
        }
      }
    };

    for (let i = 0; i < rawList.length; i++) {
      const record = rawList[i];
      const actualJobId = extractJobIdFromApplicationRecord(record);

      if (actualJobId !== null && actualJobId !== undefined && actualJobId !== '') {
        updateMapForId(actualJobId, record, i);
        updateMapForId(String(actualJobId), record, i);
        if (typeof actualJobId === 'string' && !isNaN(Number(actualJobId)) && Number(actualJobId) > 0) {
          updateMapForId(Number(actualJobId), record, i);
        }
      }
    }

    // Sync local storage applied_job_ids with authoritative backend applications list
    try {
      const activeNumericJobIds = [];
      applicationMap.forEach((rec, key) => {
        const norm = normalizeApplicationStatus(rec?.status || rec?.state || rec?.applicationStatus);
        if (norm && ['PREPARING', 'QUEUED', 'IN_PROGRESS', 'NEEDS_ACTION', 'SUBMITTED', 'COMPLETED', 'SUCCESS', 'APPLIED'].includes(norm)) {
          const numId = typeof key === 'number' ? key : extractJobIdFromApplicationRecord(rec);
          if (typeof numId === 'number' && !isNaN(numId) && numId > 0 && !activeNumericJobIds.includes(numId)) {
            activeNumericJobIds.push(numId);
          }
        }
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('applied_job_ids', JSON.stringify(activeNumericJobIds));
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('applied_job_ids', JSON.stringify(activeNumericJobIds));
      }
    } catch {
      // ignore
    }

    console.log(`🎯 Unique jobs mapped to latest status: ${applicationMap.size}`);
    console.groupEnd();

    return {
      applicationMap,
      rawList,
    };
  } catch (error) {
    console.error('❌ [API ERROR] GET /api/applications failed:', error);
    console.groupEnd();
    throw error;
  }
};

/**
 * Determines whether the Apply Now button should be HIDDEN for a given job object.
 * Driven strictly by backend application status API response (applicationMap).
 *
 * @param {Object} job
 * @param {Map<number|string, Object>} [applicationMap]
 * @returns {boolean} True if Apply Now button should be HIDDEN.
 */
export const isApplyNowHiddenForJob = (job, applicationMap = new Map()) => {
  if (!job) return false;

  // Retrieve matching application record using actual jobId candidates
  const record = getMatchingApplicationForJob(job, applicationMap);

  if (record) {
    const rawStatus = record?.status || record?.state || record?.applicationStatus;
    const norm = normalizeApplicationStatus(rawStatus);

    if (norm && ['PREPARING', 'QUEUED', 'IN_PROGRESS', 'NEEDS_ACTION', 'SUBMITTED', 'COMPLETED', 'SUCCESS', 'APPLIED'].includes(norm)) {
      return true;
    }
    return false; // Found record, but status is FAILED or SKIPPED
  }

  // Job is NOT in backend applicationMap -> SHOW Apply Now
  return false;
};

export default {
  APPLICATIONS_API_URL,
  getStoredAppliedJobIds,
  markJobsAsApplied,
  isJobAlreadyApplied,
  extractNumericJobId,
  extractNumericResumeId,
  extractJobIdFromApplicationRecord,
  getMatchingApplicationForJob,
  applyToJobs,
  applyToJobsInBatches,
  normalizeApplicationStatus,
  isApplicationStatusActiveOrCompleted,
  getApplicationStatuses,
  isApplyNowHiddenForJob,
};
