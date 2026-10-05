import { apiClient } from './authService';
import { RESUME_ENDPOINTS } from './endpoints';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validate resume file format and size
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateResumeFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Please select a resume file to upload.' };
  }

  const extension = (file.name || '').split('.').pop()?.toLowerCase();
  const isValidExt = extension && ALLOWED_EXTENSIONS.includes(extension);

  if (!isValidExt) {
    return {
      valid: false,
      error: 'Please upload a PDF, DOC, or DOCX file.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Resume must be smaller than 10 MB.',
    };
  }

  return { valid: true };
};

/**
 * Retrieve the current authenticated user's plan/subscription
 * @returns {string} Normalized plan key ('free', 'basic', 'pro')
 */
export const getUserPlan = () => {
  try {
    const rawBilling =
      localStorage.getItem('billingStatus') ||
      sessionStorage.getItem('billingStatus');
    if (rawBilling) {
      const billing = JSON.parse(rawBilling);
      const planVal =
        billing?.planCode ||
        billing?.plancode ||
        billing?.planName ||
        billing?.plan ||
        billing?.subscriptionPlan ||
        billing?.subscription ||
        billing?.tier;
      if (planVal) return String(planVal).trim();
      if (billing?.hasPlan === false) return 'free';
    }
  } catch {
    // ignore parse error
  }
  return 'free';
};

/**
 * Map plan to N count
 * @param {string} plan
 * @returns {number}
 */
export const getNByPlan = (plan = 'free') => {
  const normalized = String(plan).toLowerCase().trim();
  if (normalized.includes('pro')) return 1000;
  if (normalized.includes('basic')) return 10;
  return 1;
};

/**
 * Retrieve saved job matches from storage
 * @returns {Array}
 */
export const getStoredJobMatches = () => {
  try {
    const raw = sessionStorage.getItem('auto_job_apply_stored_matches');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
};

/**
 * GET /api/resumes
 * List user's uploaded resumes
 * Authorization: Bearer <access_token> (automatically attached by apiClient)
 * @returns {Promise<Array>} JSON array of resumes
 */
export const getResumes = async () => {
  try {
    const response = await apiClient.get(RESUME_ENDPOINTS.GET || '/api/resumes');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.resumes)) return data.resumes;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && typeof data === 'object') return [data];
    return [];
  } catch (error) {
    console.error('[resumeService] getResumes error:', error);
    const msg =
      error.response?.data?.message ||
      (typeof error.response?.data === 'string' ? error.response.data : '') ||
      'Unable to load resumes.';
    const err = new Error(msg);
    err.status = error.response?.status || 500;
    throw err;
  }
};

/**
 * POST /api/resumes
 * Upload a new resume file
 * Request: multipart/form-data with field name 'file'
 * Authorization: Bearer <access_token>
 * @param {File} file
 * @returns {Promise<Object>} JSON resume metadata
 */
export const uploadResume = async (file) => {
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    const err = new Error(validation.error);
    err.status = 400;
    throw err;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post(
      RESUME_ENDPOINTS.UPLOAD || '/api/resumes',
      formData
    );
    return response.data;
  } catch (error) {
    console.error('[resumeService] uploadResume error:', error);
    const msg =
      error.response?.data?.message ||
      (typeof error.response?.data === 'string' ? error.response.data : '') ||
      'Unable to upload resume.';
    const err = new Error(msg);
    err.status = error.response?.status || 500;
    throw err;
  }
};

/**
 * PATCH /api/resumes/{id}/set-primary
 * Change primary resume
 * Request body: NONE (do NOT send JSON or {})
 * Authorization: Bearer <access_token>
 * Response: Plain text "Primary resume updated."
 * @param {number|string} id - Numeric resume ID
 * @returns {Promise<string>} Plain text response
 */
export const setPrimaryResume = async (id) => {
  if (id === undefined || id === null || id === '') {
    throw new Error('Resume ID is required to set as primary.');
  }

  const url =
    typeof RESUME_ENDPOINTS.SET_PRIMARY === 'function'
      ? RESUME_ENDPOINTS.SET_PRIMARY(id)
      : `/api/resumes/${id}/set-primary`;

  try {
    const response = await apiClient.patch(url, null, {
      responseType: 'text',
    });
    return response.data || 'Primary resume updated.';
  } catch (error) {
    console.error('[resumeService] setPrimaryResume error:', error);
    const msg =
      error.response?.data?.message ||
      (typeof error.response?.data === 'string' ? error.response.data : '') ||
      'Unable to set primary resume.';
    const err = new Error(msg);
    err.status = error.response?.status || 500;
    throw err;
  }
};

/**
 * DELETE /api/resumes/{id}
 * Delete resume
 * Request body: NONE
 * Authorization: Bearer <access_token>
 * Response: Plain text "Resume deleted."
 * @param {number|string} id - Numeric resume ID
 * @returns {Promise<string>} Plain text response
 */
export const deleteResume = async (id) => {
  if (id === undefined || id === null || id === '') {
    throw new Error('Resume ID is required for deletion.');
  }

  const url =
    typeof RESUME_ENDPOINTS.DELETE === 'function'
      ? RESUME_ENDPOINTS.DELETE(id)
      : `/api/resumes/${id}`;

  try {
    const response = await apiClient.delete(url, {
      responseType: 'text',
    });
    return response.data || 'Resume deleted.';
  } catch (error) {
    console.error('[resumeService] deleteResume error:', error);
    const msg =
      error.response?.data?.message ||
      (typeof error.response?.data === 'string' ? error.response.data : '') ||
      'Unable to delete resume.';
    const err = new Error(msg);
    err.status = error.response?.status || 500;
    throw err;
  }
};

/**
 * GET /api/resumes/{id}/download
 * Download resume binary blob
 * Authorization: Bearer <access_token>
 * Response: Binary Blob
 * @param {number|string} id - Numeric resume ID
 * @param {string} [fallbackFilename] - Fallback file name
 * @returns {Promise<Blob>}
 */
export const downloadResume = async (id, fallbackFilename = 'resume.pdf') => {
  if (id === undefined || id === null || id === '') {
    throw new Error('Resume ID is required for download.');
  }

  const url =
    typeof RESUME_ENDPOINTS.DOWNLOAD === 'function'
      ? RESUME_ENDPOINTS.DOWNLOAD(id)
      : `/api/resumes/${id}/download`;

  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    const blob = response.data;

    let filename = fallbackFilename || 'resume.pdf';
    const disposition =
      response.headers?.['content-disposition'] ||
      response.headers?.['Content-Disposition'];
    if (disposition) {
      const filenameMatch = disposition.match(
        /filename\*?=(?:UTF-8'')?["']?([^"';\n\r]+)["']?/i
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1].trim());
      }
    }

    if (typeof window !== 'undefined' && window.document) {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 200);
    }

    return blob;
  } catch (error) {
    console.error('[resumeService] downloadResume error:', error);
    let errMsg = 'Unable to download resume.';
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text);
        errMsg = parsed.message || parsed.error || text;
      } catch {
        // default
      }
    } else if (typeof error.response?.data === 'string') {
      errMsg = error.response.data;
    } else if (error.response?.data?.message) {
      errMsg = error.response.data.message;
    }
    const err = new Error(errMsg);
    err.status = error.response?.status || 500;
    throw err;
  }
};

/**
 * Check if user has a resume uploaded
 * @returns {Promise<boolean>}
 */
export const checkUserHasResume = async () => {
  try {
    const resumes = await getResumes();
    return Array.isArray(resumes) && resumes.length > 0;
  } catch {
    return false;
  }
};

export default {
  validateResumeFile,
  getUserPlan,
  getNByPlan,
  getStoredJobMatches,
  getResumes,
  uploadResume,
  setPrimaryResume,
  deleteResume,
  downloadResume,
  checkUserHasResume,
};
