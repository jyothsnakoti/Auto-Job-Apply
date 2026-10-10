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

    // Automatically mark queued and skipped (already submitted/in-progress) jobs as applied
    const appliedIdsToMark = [...queued];
    for (const item of skipped) {
      const reason = String(item?.reason || '').toUpperCase();
      if (
        reason.includes('SUBMITTED') ||
        reason.includes('PROGRESS') ||
        reason.includes('APPLIED') ||
        reason.includes('DUPLICATE')
      ) {
        const itemJobId = extractNumericJobId({ jobId: item.jobId || item.job_id });
        if (itemJobId !== null) {
          appliedIdsToMark.push(itemJobId);
        }
      }
    }
    if (appliedIdsToMark.length === 0 && validNumericJobIds.length === 1) {
      // If single request returned 202 accepted with empty queued/skipped arrays, mark the job as applied
      appliedIdsToMark.push(validNumericJobIds[0]);
    }
    const updatedAppliedList = markJobsAsApplied(appliedIdsToMark);
    console.log('💾 Updated Local Applied Job IDs List:', updatedAppliedList);
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
      if (Array.isArray(data.items)) rawList = data.items;
      else if (Array.isArray(data.content)) rawList = data.content;
      else if (Array.isArray(data.applications)) rawList = data.applications;
      else if (Array.isArray(data.data)) rawList = data.data;
      else if (Array.isArray(data.results)) rawList = data.results;
    }

    // Check pagination metadata if available
    const totalPages = data?.totalPages || data?.page?.totalPages || 1;
    if (totalPages > 1) {
      console.log(`📑 Total pages available: ${totalPages}. Fetching remaining pages...`);
      for (let p = 1; p < totalPages && p < 10; p++) {
        try {
          const pageRes = await apiClient.get(`${APPLICATIONS_API_URL}?tab=all&page=${p}&size=50`);
          const pData = pageRes.data;
          let pList = [];
          if (Array.isArray(pData)) pList = pData;
          else if (pData && typeof pData === 'object') {
            pList = pData.items || pData.content || pData.applications || pData.data || pData.results || [];
          }
          rawList.push(...pList);
        } catch (pErr) {
          console.warn(`[applicationService] Failed to fetch page ${p} of applications:`, pErr);
        }
      }
    }

    console.log(`📋 Total application records retrieved: ${rawList.length}`);

    // Map each numeric jobId and string job_id to its latest application record
    const applicationMap = new Map();

    const getRecordTime = (rec) => {
      const time = rec?.updatedAt || rec?.updated_at || rec?.createdAt || rec?.created_at || rec?.timestamp || rec?.date;
      if (time) {
        const t = new Date(time).getTime();
        if (!isNaN(t)) return t;
      }
      const idNum = Number(rec?.id);
      if (!isNaN(idNum) && idNum > 0) return idNum;
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
      const numericJobId =
        extractNumericJobId(record) ||
        extractNumericJobId({ jobId: record.jobId || record.job_id || record.job?.id || record.jd_id });

      const stringJobId =
        (typeof record.job_id === 'string' && record.job_id.trim()) ||
        (typeof record.jobId === 'string' && record.jobId.trim()) ||
        (typeof record.id === 'string' && record.id.trim()) ||
        (typeof record.job?.job_id === 'string' && record.job.job_id.trim()) ||
        (typeof record.job?.id === 'string' && record.job.id.trim()) ||
        null;

      if (numericJobId !== null) {
        updateMapForId(numericJobId, record, i);
      }
      if (stringJobId) {
        updateMapForId(stringJobId, record, i);
      }
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
 * Strictly driven by backend application status API response.
 *
 * @param {Object} job
 * @param {Map<number|string, Object>} [applicationMap]
 * @returns {boolean} True if Apply Now button should be HIDDEN.
 */
export const isApplyNowHiddenForJob = (job, applicationMap = new Map()) => {
  if (!job || !applicationMap || typeof applicationMap.has !== 'function') return false;

  let record = null;

  // 1. Try numeric ID lookup
  const numericJobId = extractNumericJobId(job);
  if (numericJobId !== null && applicationMap.has(numericJobId)) {
    record = applicationMap.get(numericJobId);
  }

  // 2. Try string / UUID lookup if no record found by numeric ID
  if (!record) {
    const stringCandidates = [
      job.job_id,
      job.jobId,
      job.id,
      job.JDid,
      job.jd_id,
      job.rawMatch?.job_id,
      job.rawMatch?.jobId,
      job.rawMatch?.id,
    ];
    for (const cand of stringCandidates) {
      if (cand !== undefined && cand !== null && cand !== '') {
        const strCand = String(cand).trim();
        if (applicationMap.has(strCand)) {
          record = applicationMap.get(strCand);
          break;
        }
      }
    }
  }

  if (!record) {
    return false;
  }

  const rawStatus = record?.status || record?.state || record?.applicationStatus;
  const norm = normalizeApplicationStatus(rawStatus);

  if (!norm) return false;

  if (['PREPARING', 'QUEUED', 'IN_PROGRESS', 'NEEDS_ACTION', 'SUBMITTED', 'COMPLETED', 'SUCCESS', 'APPLIED'].includes(norm)) {
    return true;
  }

  if (['FAILED', 'SKIPPED'].includes(norm)) {
    return false;
  }

  return false;
};

export default {
  APPLICATIONS_API_URL,
  getStoredAppliedJobIds,
  markJobsAsApplied,
  isJobAlreadyApplied,
  extractNumericJobId,
  extractNumericResumeId,
  applyToJobs,
  applyToJobsInBatches,
  normalizeApplicationStatus,
  isApplicationStatusActiveOrCompleted,
  getApplicationStatuses,
  isApplyNowHiddenForJob,
};
