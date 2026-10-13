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
  if (
    job.isApplied === true ||
    job.applied === true ||
    job.alreadyApplied === true ||
    job.applicationId ||
    job.application_id
  ) {
    return true;
  }
  if (job.status) {
    const norm = String(job.status).trim().toUpperCase();
    if (
      [
        'APPLIED',
        'SUBMITTED',
        'IN_PROGRESS',
        'QUEUED',
        'PREPARING',
        'NEEDS_ACTION',
        'FAILED',
        'ERROR',
        'SKIPPED',
        'COMPLETED',
        'SUCCESS',
      ].includes(norm)
    ) {
      return true;
    }
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
  const str = String(rawStatus)
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return str || null;
};

export const isApplicationSubmittedStatus = (rawStatus) => {
  const norm = normalizeApplicationStatus(rawStatus);
  if (!norm) return false;
  return ['SUBMITTED', 'COMPLETED', 'SUCCESS', 'APPLIED'].includes(norm);
};

export const isApplicationActiveStatus = (rawStatus) => {
  const norm = normalizeApplicationStatus(rawStatus);
  if (!norm) return false;
  return ['PREPARING', 'QUEUED', 'IN_PROGRESS', 'NEEDS_ACTION'].includes(norm);
};

export const isApplicationRetryableStatus = (rawStatus) => {
  const norm = normalizeApplicationStatus(rawStatus);
  if (!norm) return false;
  return ['SKIPPED', 'FAILED', 'ERROR'].includes(norm);
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
  return isApplicationSubmittedStatus(norm) || isApplicationActiveStatus(norm);
};

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
    record.job?.id, // Only inside record.job
    record.jobDetails?.jobId,
    record.jobDetails?.job_id,
    record.jobDetails?.id,
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
    job.id, // Only on job card (never application record)
    job.numericId,
    job.backendJobId,
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
      const num = Number(strCand);
      if (!isNaN(num) && num > 0 && applicationMap.has(num)) {
        return applicationMap.get(num);
      }
    }
  }

  return null;
};

/**
 * Determines whether a job has a matching application with SUBMITTED status.
 * Evaluates against the authoritative submittedJobIdSet and applicationMap from GET /api/applications.
 *
 * Rules:
 * - Always matches using the actual jobId (never application record id).
 * - If multiple application records exist for the same job, considers the job submitted if at least one is SUBMITTED.
 * - Does not hide unrelated jobs.
 *
 * @param {Object} job
 * @param {Set<number|string>} [submittedJobIdSet]
 * @param {Map<number|string, Object>} [applicationMap]
 * @returns {boolean}
 */
export const isJobSubmitted = (job, submittedJobIdSet = new Set(), applicationMap = new Map()) => {
  if (!job) return false;

  const numericId = extractNumericJobId(job);
  if (numericId !== null && submittedJobIdSet) {
    if (submittedJobIdSet.has(numericId) || submittedJobIdSet.has(String(numericId))) {
      return true;
    }
  }

  const candidates = [
    job.jobId,
    job.job_id,
    job.JDid,
    job.jd_id,
    job.id, // Only for job cards
    job.numericId,
    job.backendJobId,
    job.rawMatch?.jobId,
    job.rawMatch?.job_id,
    job.rawMatch?.JDid,
    job.rawMatch?.jd_id,
    job.rawMatch?.id,
  ];

  for (const cand of candidates) {
    if (cand !== undefined && cand !== null && cand !== '') {
      const str = String(cand).trim();
      const num = Number(str);
      if (submittedJobIdSet) {
        if (submittedJobIdSet.has(str)) return true;
        if (!isNaN(num) && num > 0 && submittedJobIdSet.has(num)) return true;
      }
    }
  }

  // Fallback: Check matching record in applicationMap
  if (applicationMap && applicationMap.size > 0) {
    const record = getMatchingApplicationForJob(job, applicationMap);
    if (record) {
      const rawStatus = record.status || record.state || record.applicationStatus;
      if (isApplicationSubmittedStatus(rawStatus)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Shared in-memory cache and inflight promise for getApplicationStatuses
 */
let cachedApplicationStatusResult = null;
let inflightApplicationStatusPromise = null;

export const clearApplicationStatusCache = () => {
  cachedApplicationStatusResult = null;
};

/**
 * GET /api/applications?tab=all&page=0&size=50
 * Fetches user application records across all pages to determine per-job status.
 * Handles nested response shapes (data.applications.items, data.items, etc.)
 *
 * Returns authoritative submittedJobIdSet, activeJobIdSet, applicationMap, and rawList.
 *
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false]
 * @returns {Promise<{
 *   applicationMap: Map<number|string, Object>,
 *   submittedJobIdSet: Set<number|string>,
 *   activeJobIdSet: Set<number|string>,
 *   recordsByJobId: Map<number|string, Array<Object>>,
 *   rawList: Array<Object>
 * }>}
 */
export const getApplicationStatuses = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && cachedApplicationStatusResult) {
    return cachedApplicationStatusResult;
  }

  if (inflightApplicationStatusPromise) {
    return inflightApplicationStatusPromise;
  }

  inflightApplicationStatusPromise = (async () => {
    console.group('🔍 [API CALL] GET /api/applications (Status Sync)');
    try {
      const url = `${APPLICATIONS_API_URL}?tab=all&page=0&size=50`;
      console.log('📍 Endpoint URL:', url);
      const response = await apiClient.get(url);
      console.log('📥 Response Status Code:', response.status);

      let rawList = [];
      const data = response.data;
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.applications?.items)) rawList = data.applications.items;
        else if (Array.isArray(data.items)) rawList = data.items;
        else if (Array.isArray(data.content)) rawList = data.content;
        else if (Array.isArray(data.applications)) rawList = data.applications;
        else if (Array.isArray(data.data?.items)) rawList = data.data.items;
        else if (Array.isArray(data.data)) rawList = data.data;
        else if (Array.isArray(data.results)) rawList = data.results;
      }

      // Check pagination metadata if available to fetch all remaining pages
      const totalPages =
        data?.applications?.totalPages ||
        data?.applications?.page?.totalPages ||
        data?.totalPages ||
        data?.page?.totalPages ||
        1;

      if (totalPages > 1) {
        console.log(`📑 Total application pages available: ${totalPages}. Fetching remaining pages...`);
        for (let p = 1; p < totalPages && p < 20; p++) {
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
                pData.data?.items ||
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

      console.log(`📋 Total application records retrieved across all pages: ${rawList.length}`);

      const applicationMap = new Map();
      const submittedJobIdSet = new Set();
      const activeJobIdSet = new Set();
      const recordsByJobId = new Map();

      const getStatusPriority = (rec) => {
        const norm = normalizeApplicationStatus(rec?.status || rec?.state || rec?.applicationStatus);
        if (isApplicationSubmittedStatus(norm)) return 3;
        if (isApplicationActiveStatus(norm)) return 2;
        return 1; // SKIPPED, FAILED, ERROR
      };

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
          const existingPriority = getStatusPriority(existing);
          const currentPriority = getStatusPriority(record);
          if (currentPriority > existingPriority) {
            applicationMap.set(key, record);
          } else if (currentPriority === existingPriority) {
            const existingTime = getRecordTime(existing);
            const currentTime = getRecordTime(record);
            if (currentTime > existingTime || (currentTime === existingTime && idx >= rawList.indexOf(existing))) {
              applicationMap.set(key, record);
            }
          }
        }
      };

      for (let i = 0; i < rawList.length; i++) {
        const record = rawList[i];
        // ALWAYS match using actual jobId, NEVER record.id!
        const actualJobId = extractJobIdFromApplicationRecord(record);

        if (actualJobId !== null && actualJobId !== undefined && actualJobId !== '') {
          const strJobId = String(actualJobId).trim();
          const numJobId = Number(strJobId);
          const hasNumeric = !isNaN(numJobId) && numJobId > 0;

          // Group all records for this job
          if (!recordsByJobId.has(strJobId)) {
            recordsByJobId.set(strJobId, []);
          }
          recordsByJobId.get(strJobId).push(record);
          if (hasNumeric && !recordsByJobId.has(numJobId)) {
            recordsByJobId.set(numJobId, recordsByJobId.get(strJobId));
          }

          const norm = normalizeApplicationStatus(record?.status || record?.state || record?.applicationStatus);

          // If at least one matching application record has status SUBMITTED:
          if (isApplicationSubmittedStatus(norm)) {
            submittedJobIdSet.add(strJobId);
            if (hasNumeric) submittedJobIdSet.add(numJobId);
          } else if (isApplicationActiveStatus(norm)) {
            activeJobIdSet.add(strJobId);
            if (hasNumeric) activeJobIdSet.add(numJobId);
          }

          updateMapForId(actualJobId, record, i);
          updateMapForId(strJobId, record, i);
          if (hasNumeric) {
            updateMapForId(numJobId, record, i);
          }
        }
      }

      // Sync local storage applied_job_ids with authoritative submitted job IDs
      try {
        const submittedNumeric = [];
        submittedJobIdSet.forEach((id) => {
          if (typeof id === 'number' && id > 0) submittedNumeric.push(id);
        });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('applied_job_ids', JSON.stringify(submittedNumeric));
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('applied_job_ids', JSON.stringify(submittedNumeric));
        }
      } catch {
        // ignore
      }

      console.log(`🎯 Unique submitted jobs: ${submittedJobIdSet.size / 2}, active jobs: ${activeJobIdSet.size / 2}`);
      console.groupEnd();

      const result = {
        applicationMap,
        submittedJobIdSet,
        activeJobIdSet,
        recordsByJobId,
        rawList,
      };

      cachedApplicationStatusResult = result;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('applicationStatusesUpdated', { detail: result }));
      }

      return result;
    } catch (error) {
      console.error('❌ [API ERROR] GET /api/applications status sync failed:', error);
      console.groupEnd();

      // Return existing cache or empty fallback without throwing fatal error
      const fallback = cachedApplicationStatusResult || {
        applicationMap: new Map(),
        submittedJobIdSet: new Set(),
        activeJobIdSet: new Set(),
        recordsByJobId: new Map(),
        rawList: [],
      };
      return fallback;
    } finally {
      inflightApplicationStatusPromise = null;
    }
  })();

  return inflightApplicationStatusPromise;
};

/**
 * Determines whether the Apply Now button should be HIDDEN for a given job object.
 * Driven strictly by backend application status API response.
 *
 * @param {Object} job
 * @param {Map<number|string, Object>} [applicationMap]
 * @param {Set<number|string>} [submittedJobIdSet]
 * @returns {boolean} True if Apply Now button should be HIDDEN.
 */
export const isApplyNowHiddenForJob = (job, applicationMap = new Map(), submittedJobIdSet = null) => {
  if (!job) return false;

  // 1. If already submitted -> Hide Apply Now
  if (submittedJobIdSet && isJobSubmitted(job, submittedJobIdSet, applicationMap)) {
    return true;
  }

  // 2. Retrieve matching application record using actual jobId candidates
  const record = getMatchingApplicationForJob(job, applicationMap);

  if (record) {
    const rawStatus = record?.status || record?.state || record?.applicationStatus;
    const norm = normalizeApplicationStatus(rawStatus);

    // SUBMITTED or ACTIVE (PREPARING, QUEUED, IN_PROGRESS, NEEDS_ACTION) -> HIDE Apply Now
    if (norm && (isApplicationSubmittedStatus(norm) || isApplicationActiveStatus(norm))) {
      return true;
    }
    // SKIPPED or FAILED -> SHOW Apply Now (eligible for retry/reapplication)
    return false;
  }

  // Job is NOT in backend applicationMap -> SHOW Apply Now
  return false;
};

/**
 * Extract the actual Application ID (id) from an application record object.
 *
 * @param {Object|number|string} record
 * @returns {number|string|null}
 */
export const extractApplicationId = (record) => {
  if (!record) return null;
  if (typeof record === 'number' && !isNaN(record) && record > 0) return record;
  if (typeof record === 'string' && record.trim() !== '') {
    const num = Number(record.trim());
    return !isNaN(num) && num > 0 ? num : record.trim();
  }
  if (typeof record !== 'object') return null;

  const candidates = [
    record.id,
    record.applicationId,
    record.application_id,
    record._id,
  ];

  for (const cand of candidates) {
    if (cand === undefined || cand === null || cand === '') continue;
    if (typeof cand === 'number' && !isNaN(cand) && cand > 0) return cand;
    if (typeof cand === 'string' && cand.trim() !== '') {
      const num = Number(cand.trim());
      return !isNaN(num) && num > 0 ? num : cand.trim();
    }
  }

  return null;
};

/**
 * POST /api/applications/{id}/retry
 * Triggers a retry for a specific application record.
 * Backend contract:
 * - Method: POST
 * - Auth: Required
 * - Body: None
 * - Response: 202 + text
 *
 * @param {number|string|Object} applicationOrId - The application ID or application record object
 * @returns {Promise<{ status: number, data: any, message: string }>}
 */
export const retryApplication = async (applicationOrId) => {
  const id =
    extractApplicationId(applicationOrId) ||
    (typeof applicationOrId !== 'object' && applicationOrId ? applicationOrId : null);

  if (!id) {
    throw new Error('Application ID is required to retry application.');
  }

  const endpoint = `/api/applications/${id}/retry`;
  const url = `${APPLICATIONS_API_URL}/${id}/retry`;
  console.group(`🔄 [API CALL] POST ${endpoint}`);
  console.log('📍 Endpoint URL:', url);
  console.log('🆔 Target Application ID:', id);

  try {
    const response = await apiClient.post(endpoint);
    console.log('📥 Response Status Code:', response.status);
    console.log('📊 Response Data:', response.data);
    console.groupEnd();

    return {
      status: response.status,
      data: response.data,
      message:
        typeof response.data === 'string' && response.data.trim()
          ? response.data
          : response.status === 202
          ? 'Application queued for retry'
          : 'Application retry initiated successfully',
    };
  } catch (error) {
    console.error(`❌ [API ERROR] POST ${endpoint} failed:`, error);
    console.groupEnd();

    const status = error.response?.status;
    let message = error.response?.data?.message || error.response?.data?.error;
    if (typeof error.response?.data === 'string' && error.response.data.trim()) {
      message = error.response.data;
    }

    if (!message) {
      if (status === 401) {
        message = 'Authentication required. Please log in again.';
      } else if (status === 402) {
        message = 'Insufficient application credits. Please upgrade your plan.';
      } else if (status === 404) {
        message = 'Application record not found.';
      } else {
        message = error.message || 'Failed to retry application. Please try again.';
      }
    }

    const customErr = new Error(message);
    customErr.status = status;
    customErr.response = error.response;
    throw customErr;
  }
};

/**
 * GET /api/applications?tab={tab}&page={page}&size={size}
 * Fetches applications for a specific tab with pagination metadata and counts.
 *
 * @param {Object} [params]
 * @param {string} [params.tab='all'] - One of: 'all', 'submitted', 'in_progress', 'needs_action', 'failed', 'skipped'
 * @param {number} [params.page=0] - Zero-based page index
 * @param {number} [params.size=10] - Number of items per page (1 to 50)
 * @returns {Promise<{
 *   items: Array<Object>,
 *   counts: { all: number, submitted: number, inProgress: number, needsAction: number, failed: number, skipped: number },
 *   pagination: { page: number, size: number, totalItems: number, totalPages: number },
 *   raw: any
 * }>}
 */
export const getApplications = async ({ tab = 'all', page = 0, size = 10 } = {}) => {
  // Normalize tab parameter according to backend contract
  const normalizedTab = String(tab || 'all').toLowerCase().trim();
  const validTabs = ['all', 'submitted', 'in_progress', 'needs_action', 'failed', 'skipped'];
  const effectiveTab = validTabs.includes(normalizedTab) ? normalizedTab : 'all';

  const validPage = Math.max(0, parseInt(page, 10) || 0);
  const validSize = Math.max(1, Math.min(50, parseInt(size, 10) || 10));

  const endpoint = `/api/applications?tab=${effectiveTab}&page=${validPage}&size=${validSize}`;
  const url = `${APPLICATIONS_API_URL}?tab=${effectiveTab}&page=${validPage}&size=${validSize}`;

  console.group(`🔍 [API CALL] GET ${endpoint}`);
  console.log('📍 Endpoint URL:', url);

  try {
    const response = await apiClient.get(url);
    const data = response.data || {};

    console.log('📥 Response Status Code:', response.status);
    console.log('📊 Raw Response Body:', data);

    // 1. Parse items (Handling nested structures and arrays without mistaking objects for arrays)
    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.applications?.items)) {
        items = data.applications.items;
      } else if (Array.isArray(data.applications)) {
        items = data.applications;
      } else if (Array.isArray(data.items)) {
        items = data.items;
      } else if (Array.isArray(data.content)) {
        items = data.content;
      } else if (Array.isArray(data.data?.items)) {
        items = data.data.items;
      } else if (Array.isArray(data.data)) {
        items = data.data;
      } else if (Array.isArray(data.results)) {
        items = data.results;
      }
    }

    // Ensure all application items have resumeType / resume in all-caps (TAILORED, ORIGINAL)
    items = items.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const rawResume =
        item.resumeType ||
        item.resume_type ||
        item.resume ||
        item.job?.resumeType ||
        item.job?.resume_type ||
        item.job?.resume ||
        item.jobDetails?.resumeType ||
        item.jobDetails?.resume ||
        'TAILORED';
      let cleanResume = 'TAILORED';
      if (typeof rawResume === 'string' && rawResume.trim()) {
        const upper = rawResume.trim().toUpperCase();
        if (upper.includes('TAILOR')) cleanResume = 'TAILORED';
        else if (upper.includes('ORIGIN')) cleanResume = 'ORIGINAL';
        else cleanResume = upper;
      }
      return {
        ...item,
        resumeType: cleanResume,
        resume: cleanResume,
      };
    });

    // 2. Parse counts
    const rawCounts = data.counts || data.applicationCounts || data.countsByTab || {};
    const counts = {
      all:
        typeof rawCounts.all === 'number'
          ? rawCounts.all
          : typeof rawCounts.total === 'number'
          ? rawCounts.total
          : items.length,
      submitted:
        typeof rawCounts.submitted === 'number'
          ? rawCounts.submitted
          : typeof rawCounts.SUBMITTED === 'number'
          ? rawCounts.SUBMITTED
          : 0,
      inProgress:
        typeof rawCounts.inProgress === 'number'
          ? rawCounts.inProgress
          : typeof rawCounts.in_progress === 'number'
          ? rawCounts.in_progress
          : typeof rawCounts.IN_PROGRESS === 'number'
          ? rawCounts.IN_PROGRESS
          : 0,
      needsAction:
        typeof rawCounts.needsAction === 'number'
          ? rawCounts.needsAction
          : typeof rawCounts.needs_action === 'number'
          ? rawCounts.needs_action
          : typeof rawCounts.NEEDS_ACTION === 'number'
          ? rawCounts.NEEDS_ACTION
          : 0,
      failed:
        typeof rawCounts.failed === 'number'
          ? rawCounts.failed
          : typeof rawCounts.FAILED === 'number'
          ? rawCounts.FAILED
          : 0,
      skipped:
        typeof rawCounts.skipped === 'number'
          ? rawCounts.skipped
          : typeof rawCounts.SKIPPED === 'number'
          ? rawCounts.SKIPPED
          : 0,
    };

    // 3. Parse pagination metadata
    const pageObj = data.applications || data.pagination || data.page || {};
    const totalItems =
      typeof pageObj.totalItems === 'number'
        ? pageObj.totalItems
        : typeof pageObj.totalElements === 'number'
        ? pageObj.totalElements
        : typeof data.totalItems === 'number'
        ? data.totalItems
        : typeof data.totalElements === 'number'
        ? data.totalElements
        : (effectiveTab === 'all' && counts.all > 0 ? counts.all : items.length);

    const totalPages =
      typeof pageObj.totalPages === 'number'
        ? pageObj.totalPages
        : typeof data.totalPages === 'number'
        ? data.totalPages
        : Math.max(1, Math.ceil(totalItems / validSize));

    const currentPage =
      typeof pageObj.page === 'number'
        ? pageObj.page
        : typeof pageObj.number === 'number'
        ? pageObj.number
        : typeof data.page === 'number'
        ? data.page
        : validPage;

    const currentSize =
      typeof pageObj.size === 'number'
        ? pageObj.size
        : typeof data.size === 'number'
        ? data.size
        : validSize;

    const pagination = {
      page: currentPage,
      size: currentSize,
      totalItems,
      totalPages,
    };

    console.log(`📋 Extracted ${items.length} items (Page ${currentPage + 1}/${totalPages}, Total: ${totalItems})`);
    console.log('📊 Tab Counts:', counts);
    console.groupEnd();

    return {
      items,
      counts,
      pagination,
      raw: data,
    };
  } catch (error) {
    console.error(`❌ [API ERROR] GET ${endpoint} failed:`, error);
    console.groupEnd();
    throw error;
  }
};

/**
 * POST /api/applications/{id}/approve
 * Approves a Needs Action application.
 *
 * @param {number|string|Object} applicationOrId
 * @returns {Promise<any>}
 */
export const approveApplication = async (applicationOrId) => {
  const id =
    extractApplicationId(applicationOrId) ||
    (typeof applicationOrId !== 'object' && applicationOrId ? applicationOrId : null);

  if (!id) {
    throw new Error('Application ID is required to approve application.');
  }

  const endpoint = `/api/applications/${id}/approve`;
  const url = `${APPLICATIONS_API_URL}/${id}/approve`;
  console.group(`✅ [API CALL] POST ${endpoint}`);
  console.log('📍 Endpoint URL:', url);
  console.log('🆔 Target Application ID:', id);

  try {
    const response = await apiClient.post(endpoint);
    console.log('📥 Response Status Code:', response.status);
    console.log('📊 Response Data:', response.data);
    console.groupEnd();
    return response.data;
  } catch (error) {
    console.error(`❌ [API ERROR] POST ${endpoint} failed:`, error);
    console.groupEnd();
    const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to approve application.';
    const err = new Error(msg);
    err.status = error.response?.status;
    err.response = error.response;
    throw err;
  }
};

/**
 * POST /api/applications/{id}/skip
 * Skips an application (from Needs Action, Failed, or Queued).
 *
 * @param {number|string|Object} applicationOrId
 * @returns {Promise<any>}
 */
export const skipApplication = async (applicationOrId) => {
  const id =
    extractApplicationId(applicationOrId) ||
    (typeof applicationOrId !== 'object' && applicationOrId ? applicationOrId : null);

  if (!id) {
    throw new Error('Application ID is required to skip application.');
  }

  const endpoint = `/api/applications/${id}/skip`;
  const url = `${APPLICATIONS_API_URL}/${id}/skip`;
  console.group(`⏭️ [API CALL] POST ${endpoint}`);
  console.log('📍 Endpoint URL:', url);
  console.log('🆔 Target Application ID:', id);

  try {
    const response = await apiClient.post(endpoint);
    console.log('📥 Response Status Code:', response.status);
    console.log('📊 Response Data:', response.data);
    console.groupEnd();
    return response.data;
  } catch (error) {
    console.error(`❌ [API ERROR] POST ${endpoint} failed:`, error);
    console.groupEnd();
    const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to skip application.';
    const err = new Error(msg);
    err.status = error.response?.status;
    err.response = error.response;
    throw err;
  }
};

export default {
  APPLICATIONS_API_URL,
  getStoredAppliedJobIds,
  markJobsAsApplied,
  isJobAlreadyApplied,
  extractNumericJobId,
  extractNumericResumeId,
  extractJobIdFromApplicationRecord,
  extractApplicationId,
  retryApplication,
  approveApplication,
  skipApplication,
  getApplications,
  getMatchingApplicationForJob,
  applyToJobs,
  applyToJobsInBatches,
  normalizeApplicationStatus,
  isApplicationStatusActiveOrCompleted,
  getApplicationStatuses,
  isApplyNowHiddenForJob,
};
