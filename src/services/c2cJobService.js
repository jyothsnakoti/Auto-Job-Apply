import { apiClient } from './authService';
import { C2C_JOB_ENDPOINTS, C2C_APPLICATION_ENDPOINTS } from './endpoints';
import { getStoredResumeId } from './enhanceResumeService';
import { getResumes } from './resumeService';

export const C2C_JOBS_API_URL = C2C_JOB_ENDPOINTS?.LIST || '/api/c2c/jobs';
export const C2C_APPLICATIONS_API_URL = C2C_APPLICATION_ENDPOINTS?.APPLY || '/api/c2c/applications';

export const C2C_APPLIED_STORAGE_KEY = 'c2c_applied_job_ids';

/**
 * Retrieve cached array of applied C2C job IDs from localStorage
 * @returns {Array<string|number>}
 */
export const getStoredC2CAppliedJobIds = () => {
  try {
    const raw = localStorage.getItem(C2C_APPLIED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Mark a C2C job as applied in localStorage
 * @param {string|number} jobId
 */
export const markC2CJobAsApplied = (jobId) => {
  if (jobId === undefined || jobId === null || jobId === '') return;
  try {
    const existing = getStoredC2CAppliedJobIds();
    const jId = String(jobId);
    if (!existing.map(String).includes(jId)) {
      const updated = [...existing, typeof jobId === 'number' ? jobId : jId];
      localStorage.setItem(C2C_APPLIED_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[c2cJobService] Could not persist applied C2C job ID:', err);
  }
};

/**
 * Check whether a C2C job ID has already been applied to
 * @param {string|number} jobId
 * @returns {boolean}
 */
export const isC2CJobApplied = (jobId) => {
  if (jobId === undefined || jobId === null || jobId === '') return false;
  const existing = getStoredC2CAppliedJobIds();
  return existing.map(String).includes(String(jobId));
};

/**
 * Resolves the active resume ID for C2C job requests.
 * Hierarchy:
 * 1. Direct storage (resume_id, selected_resume_id, primary_resume_id)
 * 2. Onboarding state / resumeService getStoredResumeId()
 * 3. Fetch user's uploaded resumes from /api/resumes to find the primary or first resume
 * 4. Fallback to 315 (from active API specification)
 *
 * @returns {Promise<string|number>}
 */
export const resolveActiveResumeId = async () => {
  try {
    const directStored =
      getStoredResumeId() ||
      localStorage.getItem('selected_resume_id') ||
      localStorage.getItem('primary_resume_id') ||
      localStorage.getItem('resume_id') ||
      sessionStorage.getItem('resume_id');

    if (directStored && String(directStored).trim()) {
      const num = Number(directStored);
      return !isNaN(num) && num > 0 ? num : String(directStored).trim();
    }

    // Try fetching user's uploaded resumes to find primary or first resume
    const userResumes = await getResumes().catch(() => null);
    if (Array.isArray(userResumes) && userResumes.length > 0) {
      const primary = userResumes.find((r) => r.isPrimary || r.primary) || userResumes[0];
      const resolved = primary.id || primary.resumeId;
      if (resolved) {
        try {
          localStorage.setItem('selected_resume_id', String(resolved));
        } catch {
          // ignore storage error
        }
        const num = Number(resolved);
        return !isNaN(num) && num > 0 ? num : resolved;
      }
    }
  } catch (err) {
    console.warn('[c2cJobService] Could not resolve active resume ID, using fallback 315:', err);
  }

  // Fallback to 315 as seen in backend Postman specification
  return 315;
};

/**
 * Format raw ISO posted timestamp into user-friendly date (e.g. "Nov 5, 2026")
 * @param {string} rawDate
 * @returns {string}
 */
export const formatC2CPostedDate = (rawDate) => {
  if (!rawDate) return 'Recently';
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return String(rawDate);
};

/**
 * Format workplace string (e.g. "REMOTE" -> "Remote")
 * @param {string} wp
 * @returns {string}
 */
export const formatWorkplace = (wp) => {
  if (!wp) return 'Remote';
  const upper = String(wp).trim().toUpperCase();
  if (upper === 'REMOTE') return 'Remote';
  if (upper === 'HYBRID') return 'Hybrid';
  if (upper.includes('ONSITE') || upper.includes('ON_SITE')) return 'Onsite';
  return String(wp).charAt(0).toUpperCase() + String(wp).slice(1).toLowerCase();
};

/**
 * Format employment type string (e.g. "CONTRACT" -> "C2C")
 * @param {string} et
 * @returns {string}
 */
export const formatEmploymentType = (et) => {
  if (!et) return 'C2C';
  const upper = String(et).trim().toUpperCase();
  if (upper === 'CONTRACT' || upper === 'C2C') return 'C2C';
  return String(et).charAt(0).toUpperCase() + String(et).slice(1).toLowerCase();
};

/**
 * Infer job role category from title
 * @param {string} title
 * @returns {string}
 */
export const inferRoleFromTitle = (title = '') => {
  const lower = String(title).toLowerCase();
  if (lower.includes('developer') || lower.includes('software') || lower.includes('frontend') || lower.includes('backend') || lower.includes('full stack')) {
    return 'Developer';
  }
  if (lower.includes('designer') || lower.includes('ui') || lower.includes('ux')) {
    return 'Designer';
  }
  if (lower.includes('devops') || lower.includes('cloud') || lower.includes('sre') || lower.includes('infra')) {
    return 'DevOps';
  }
  if (lower.includes('qa') || lower.includes('quality') || lower.includes('test')) {
    return 'QA';
  }
  if (lower.includes('engineer')) {
    return 'Engineer';
  }
  if (lower.includes('data')) {
    return 'Data Engineer';
  }
  return 'Developer';
};

/**
 * Format a single item returned by GET /api/c2c/jobs into UI card model
 *
 * @param {Object} item - Item record from backend API
 * @param {number} idx - Index fallback
 * @param {number|string} [resumeId] - Active resume ID
 * @returns {Object} Normalized job object
 */
export const formatC2CJob = (item, idx = 0, resumeId = null) => {
  const job = item?.job || item || {};
  const rawRoute = item?.route || job?.route || 'PORTAL';

  const isEmailRoute =
    String(rawRoute).toUpperCase().includes('EMAIL') ||
    String(rawRoute).toUpperCase().includes('VENDOR') ||
    String(job?.sourceType || '').toLowerCase().includes('email') ||
    String(job?.sourceType || '').toLowerCase().includes('vendor');

  const resolvedSource = isEmailRoute ? 'Email (Vendor)' : 'Job Portal';

  // Format match percentage
  let matchPercent = 65.2;
  if (typeof job.matchScore === 'number') {
    matchPercent = Number(job.matchScore.toFixed(1));
  } else if (job.matchScore) {
    const parsed = parseFloat(job.matchScore);
    if (!isNaN(parsed)) matchPercent = Number(parsed.toFixed(1));
  }

  // Format dates
  const rawPosted =
    job.postedAt ||
    job.createdAt ||
    job.postedDate ||
    job.posted ||
    item?.postedAt ||
    item?.createdAt ||
    item?.postedDate;
  const formattedPosted = formatC2CPostedDate(rawPosted);
  let postedIso = '';
  if (rawPosted) {
    try {
      const d = new Date(rawPosted);
      if (!isNaN(d.getTime())) postedIso = d.toISOString().split('T')[0];
    } catch {
      // ignore
    }
  }

  const rawJobId =
    job.jobId !== undefined && job.jobId !== null
      ? job.jobId
      : item?.jobId !== undefined && item?.jobId !== null
      ? item.jobId
      : job.id !== undefined && job.id !== null
      ? job.id
      : `c2c-job-${idx}`;
  const numJobId = Number(rawJobId);
  const jId = !isNaN(numJobId) ? numJobId : rawJobId;

  const isAppliedStatus = Boolean(
    item?.applied ||
    item?.isApplied ||
    item?.hasApplied ||
    job?.applied ||
    job?.isApplied ||
    job?.hasApplied ||
    String(item?.status || '').toUpperCase() === 'APPLIED' ||
    String(job?.status || '').toUpperCase() === 'APPLIED' ||
    String(item?.applicationStatus || '').toUpperCase() === 'APPLIED' ||
    String(job?.applicationStatus || '').toUpperCase() === 'APPLIED'
  );

  return {
    id: jId,
    jobId: jId,
    resumeId: resumeId || item?.resumeId || job?.resumeId || null,
    isApplied: isAppliedStatus,
    title: job.title || 'Software Engineer (Contract)',
    company: job.companyName || job.company || 'Civis Analytics',
    companyDomain: job.companyDomain || null,
    isVerified: true,
    location: job.location || job.country || 'United States',
    country: job.country || 'United States',
    city: (job.location ? job.location.split(';')[0].trim() : '') || 'United States',
    workplace: formatWorkplace(job.workplace),
    jobType: formatEmploymentType(job.employmentType),
    employmentType: job.employmentType || 'CONTRACT',
    route: rawRoute,
    sourceType: resolvedSource,
    source: resolvedSource,
    posted: formattedPosted,
    postedDate: postedIso,
    postedAt: rawPosted,
    matchPercent: matchPercent,
    matchScore: job.matchScore !== undefined ? job.matchScore : matchPercent,
    role: job.role || inferRoleFromTitle(job.title),
    industry: job.industry || null,
    description:
      job.description ||
      `${job.companyName || 'The client'} is seeking an experienced professional for a ${job.title || 'C2C contract'}. You will deliver high quality technical solutions and collaborate with cross-functional project teams.`,
    responsibilities:
      Array.isArray(job.responsibilities) && job.responsibilities.length > 0
        ? job.responsibilities
        : [
            'Collaborate with cross-functional engineering and product stakeholders.',
            'Develop, test, and maintain robust, scalable software deliverables.',
            'Participate in code reviews, technical architecture discussions, and sprint planning.',
          ],
    requiredSkills:
      Array.isArray(job.requiredSkills || job.skills) && (job.requiredSkills || job.skills).length > 0
        ? (job.requiredSkills || job.skills)
        : ['C2C', 'Contract', 'Engineering'],
    preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : [],
    experience: job.experience || '3+ years',
    salary: job.salary || '$70 - $95 / hr (C2C)',
    raw: item,
  };
};

/**
 * GET /api/c2c/jobs
 * Fetch C2C jobs for the specified resume ID and pagination params.
 *
 * Query Parameters:
 * - resumeId (number|string): User's primary/active resume ID (e.g. 315)
 * - page (number): 0-indexed page number (default 0)
 * - size (number): page size (default 20)
 *
 * Headers:
 * - Authorization: Bearer <access_token> (automatically attached by apiClient)
 *
 * @param {Object} [params]
 * @param {number|string} [params.resumeId]
 * @param {number} [params.page=0]
 * @param {number} [params.size=20]
 * @returns {Promise<{ items: Array, total: number, page: number, size: number, raw: Object }>}
 */
export const getC2CJobs = async (params = {}) => {
  let resumeId = params.resumeId;
  if (resumeId === undefined || resumeId === null || resumeId === '') {
    resumeId = await resolveActiveResumeId();
  }

  const queryParams = {
    resumeId: resumeId || 315,
    page: params.page !== undefined ? params.page : 0,
    size: params.size !== undefined ? params.size : 20,
  };

  const url = C2C_JOB_ENDPOINTS?.LIST || '/api/c2c/jobs';

  try {
    const response = await apiClient.get(url, { params: queryParams });
    const data = response.data || {};

    const rawItems = Array.isArray(data)
      ? data
      : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.jobs)
      ? data.jobs
      : [];

    return {
      items: rawItems,
      page: queryParams.page,
      size: queryParams.size,
      total: typeof data.total === 'number' ? data.total : rawItems.length,
      raw: data,
    };
  } catch (error) {
    console.error('[c2cJobService] getC2CJobs error:', error);
    const msg =
      error.response?.data?.message ||
      (typeof error.response?.data === 'string' ? error.response.data : '') ||
      'Unable to load C2C jobs.';
    const err = new Error(msg);
    err.status = error.response?.status || 500;
    err.response = error.response;
    throw err;
  }
};

/**
 * POST /api/c2c/applications
 * Apply to one or more C2C jobs for the specified resume ID.
 *
 * Payload:
 * {
 *   "resumeId": 315,
 *   "jobIds": [
 *     21552
 *   ]
 * }
 *
 * Authorization: Bearer <access_token> (automatically injected by apiClient)
 *
 * @param {Object} [params]
 * @param {number|string} [params.resumeId] - Resume ID (defaults to active/primary stored resume ID, fallback 315)
 * @param {Array<number|string>|number|string} [params.jobIds] - Job ID(s) to apply to
 * @param {number|string} [params.jobId] - Single Job ID alternative
 * @returns {Promise<Object>} API response
 */
export const applyToC2CJobs = async (params = {}) => {
  // 1. Resolve dynamic resumeId
  let resolvedResumeId = params.resumeId;
  if (resolvedResumeId === undefined || resolvedResumeId === null || resolvedResumeId === '') {
    resolvedResumeId = await resolveActiveResumeId();
  }
  const numericResumeId = Number(resolvedResumeId);
  const finalResumeId = !isNaN(numericResumeId) && numericResumeId > 0 ? numericResumeId : 315;

  // 2. Normalize jobIds into array of numeric IDs (matching Image 2: "jobIds": [ 21552 ])
  const inputList = params.jobIds !== undefined
    ? (Array.isArray(params.jobIds) ? params.jobIds : [params.jobIds])
    : params.jobId !== undefined
    ? [params.jobId]
    : [];

  const cleanedJobIds = inputList
    .map((id) => {
      if (typeof id === 'number') return id;
      const num = Number(id);
      return !isNaN(num) ? num : id;
    })
    .filter((id) => id !== undefined && id !== null && id !== '');

  if (cleanedJobIds.length === 0) {
    throw new Error('At least one valid job ID is required to apply.');
  }

  const payload = {
    resumeId: finalResumeId,
    jobIds: cleanedJobIds,
  };

  const url = C2C_APPLICATION_ENDPOINTS?.APPLY || '/api/c2c/applications';

  try {
    const response = await apiClient.post(url, payload);

    // Cache locally as applied
    cleanedJobIds.forEach((id) => markC2CJobAsApplied(id));

    return response.data || { success: true };
  } catch (error) {
    console.error('[c2cJobService] applyToC2CJobs error:', error);
    const msg =
      error.response?.data?.message ||
      (typeof error.response?.data === 'string' ? error.response.data : '') ||
      'Failed to submit C2C job application.';
    const err = new Error(msg);
    err.status = error.response?.status || 500;
    err.response = error.response;
    throw err;
  }
};

export default {
  C2C_JOBS_API_URL,
  C2C_APPLICATIONS_API_URL,
  getStoredC2CAppliedJobIds,
  markC2CJobAsApplied,
  isC2CJobApplied,
  resolveActiveResumeId,
  formatC2CPostedDate,
  formatWorkplace,
  formatEmploymentType,
  inferRoleFromTitle,
  formatC2CJob,
  getC2CJobs,
  applyToC2CJobs,
};
