import { RESUME_ENDPOINTS } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';
import { getOnboardingProfile } from './profileService';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

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
  const isValidMime = !file.type || ALLOWED_MIME_TYPES.includes(file.type);

  if (!isValidExt && !isValidMime) {
    return {
      valid: false,
      error: 'Please upload a supported resume format (PDF, DOC, or DOCX).',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Resume file is too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
};

/**
 * Upload resume file and optional metadata to backend
 * POST /api/resumes
 *
 * @param {File} file - Resume file object
 * @param {Object|string|null} [metadata] - Optional resume metadata
 * @param {string|null} [token] - Optional explicit access token
 * @returns {Promise<Object>} Backend response data
 */
export const uploadResume = async (file, metadata = null, token = null) => {
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    const err = new Error(validation.error);
    err.status = 400;
    throw err;
  }

  // Prepare multipart/form-data
  const formData = new FormData();
  formData.append('file', file);

  if (metadata) {
    if (typeof metadata === 'string') {
      formData.append('metadata', metadata);
    } else {
      formData.append('metadata', JSON.stringify(metadata));
    }
  }

  let response;
  try {
    response = await fetchWithAuth(RESUME_ENDPOINTS.UPLOAD, {
      method: 'POST',
      body: formData,
      token,
    });
  } catch (netErr) {
    console.error('Resume upload network error:', netErr);
    const error = new Error('Unable to upload your resume. Please check your connection and try again.');
    error.status = 0;
    throw error;
  }

  const text = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text ? { message: text } : {};
  }

  if (!response.ok) {
    let message = 'Unable to upload your resume. Please try again.';

    if (response.status === 401) {
      message = 'Your session has expired. Please log in again.';
    } else if (response.status === 413) {
      message = 'Resume file is too large. Maximum allowed size is 10MB.';
    } else if (response.status === 415) {
      message = 'Please upload a supported resume format (PDF, DOC, or DOCX).';
    } else if (response.status === 400) {
      message =
        data?.message ||
        data?.error ||
        (typeof data === 'string' && data ? data : '') ||
        'Validation failed for uploaded resume. Please verify the file and try again.';
    } else if (response.status >= 500) {
      message = 'Server error processing your resume. Please try again later.';
    } else if (data?.message || data?.error) {
      message = data.message || data.error;
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Fetch existing resumes from backend
 * GET /api/resumes
 *
 * @param {string|null} [token] - Optional explicit access token
 * @returns {Promise<Array|Object|null>}
 */
export const getResumes = async (token = null) => {
  try {
    const response = await fetchWithAuth(RESUME_ENDPOINTS.GET, {
      method: 'GET',
      token,
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      const error = new Error(`Failed to fetch resumes (Status ${response.status})`);
      error.status = response.status;
      throw error;
    }

    const text = await response.text().catch(() => '');
    try {
      return JSON.parse(text);
    } catch {
      return text ? { data: text } : [];
    }
  } catch (err) {
    console.error('Fetch resumes error:', err);
    throw err;
  }
};

/**
 * Download a specific resume file
 * GET /api/resumes/{id}/download
 *
 * @param {string|number} id - Resume ID
 * @param {string} [fallbackFilename] - Fallback filename
 * @param {string|null} [token] - Optional explicit access token
 * @returns {Promise<Blob>}
 */
export const downloadResume = async (id, fallbackFilename = 'resume.pdf', token = null) => {
  if (!id && id !== 0) {
    throw new Error('Resume ID is required for download.');
  }

  const url = RESUME_ENDPOINTS.DOWNLOAD(id);

  let response;
  try {
    response = await fetchWithAuth(url, {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
      token,
    });
  } catch (netErr) {
    console.error('Resume download network error:', netErr);
    const error = new Error('Network error downloading resume. Please check your connection.');
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    let errMsg = `Failed to download resume (Status ${response.status})`;
    if (response.status === 401) {
      errMsg = 'Your session has expired. Please log in again.';
    } else if (response.status === 404) {
      errMsg = 'Resume file not found on server.';
    } else {
      try {
        const errJson = await response.json();
        if (errJson.message || errJson.error) {
          errMsg = errJson.message || errJson.error;
        }
      } catch {
        // ignore
      }
    }
    const err = new Error(errMsg);
    err.status = response.status;
    throw err;
  }

  const blob = await response.blob();

  // Extract filename from Content-Disposition header if available
  let filename = fallbackFilename || 'resume.pdf';
  const disposition = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
  if (disposition) {
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n\r]+)["']?/i);
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1].trim());
    }
  }

  // Trigger browser download via temporary blob URL
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
};

/**
 * Delete a specific resume
 * DELETE /api/resumes/{id}
 *
 * @param {string|number} id - Resume ID
 * @param {string|null} [token] - Optional explicit access token
 * @returns {Promise<Object>}
 */
export const deleteResume = async (id, token = null) => {
  if (!id && id !== 0) {
    throw new Error('Resume ID is required for deletion.');
  }

  const url = RESUME_ENDPOINTS.DELETE(id);

  let response;
  try {
    response = await fetchWithAuth(url, {
      method: 'DELETE',
      token,
    });
  } catch (netErr) {
    console.error('Delete resume network error:', netErr);
    const error = new Error('Network error deleting resume. Please check your connection.');
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    let errMsg = `Failed to delete resume (Status ${response.status})`;
    if (response.status === 401) {
      errMsg = 'Your session has expired. Please log in again.';
    } else if (response.status === 404) {
      errMsg = 'Resume not found or already deleted.';
    } else {
      try {
        const errJson = await response.json();
        if (errJson.message || errJson.error) {
          errMsg = errJson.message || errJson.error;
        }
      } catch {
        // ignore
      }
    }
    const err = new Error(errMsg);
    err.status = response.status;
    throw err;
  }

  const text = await response.text().catch(() => '');
  try {
    return JSON.parse(text);
  } catch {
    return { success: true, message: text || 'Resume deleted successfully' };
  }
};

/**
 * Mark a resume as the user's primary/priority resume
 * PATCH /api/resumes/{id}/set-primary
 *
 * @param {string|number} id - Resume ID
 * @param {string|null} [token] - Optional explicit access token
 * @returns {Promise<Object>}
 */
export const setPrimaryResume = async (id, token = null) => {
  if (!id && id !== 0) {
    throw new Error('Resume ID is required to set as primary.');
  }

  // Candidate paths to support both /set-primary and legacy variations
  const candidateUrls = [
    RESUME_ENDPOINTS.SET_PRIMARY(id),
    `/api/resumes/${id}/set-primary`,
    `/api/resumes/${id}/setprimary`,
    `/api/resumes/${id}/primary`,
    `/api/resumes/${id}/setPrimary`,
  ].filter((u, i, arr) => arr.indexOf(u) === i);

  let lastResponse = null;
  let lastData = null;
  let lastUrl = candidateUrls[0];

  for (const url of candidateUrls) {
    try {
      const response = await fetchWithAuth(url, {
        method: 'PATCH',
        token,
      });

      lastResponse = response;
      lastUrl = url;

      const text = await response.text().catch(() => '');
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text ? { message: text } : {};
      }
      lastData = data;

      if (response.ok) {
        return data || { success: true, message: 'Resume set as primary successfully' };
      }

      // If 401 (session expired), fetchWithAuth already tried refresh; do not loop
      if (response.status === 401) {
        break;
      }

      // If 403 or 404, candidate might be on an alternate route name, continue checking
      if (response.status !== 403 && response.status !== 404 && response.status !== 405) {
        break;
      }
    } catch (netErr) {
      console.error(`[resumeService] Network error on ${url}:`, netErr);
      if (url === candidateUrls[candidateUrls.length - 1]) {
        const error = new Error('Network error setting primary resume. Please check your connection.');
        error.status = 0;
        throw error;
      }
    }
  }

  const status = lastResponse ? lastResponse.status : 500;
  const backendMsg =
    (typeof lastData === 'object' && lastData ? (lastData.message || lastData.error) : '') ||
    (typeof lastData === 'string' && lastData ? lastData : '');

  let errMsg = `Failed to set primary resume (Status ${status})`;
  if (status === 401) {
    errMsg = 'Your session has expired. Please log in again.';
  } else if (status === 403) {
    errMsg = backendMsg || 'Unable to set this resume as primary.';
  } else if (status === 404) {
    errMsg = backendMsg || 'Resume not found.';
  } else if (status === 400) {
    errMsg = backendMsg || 'Invalid request to set primary resume.';
  } else if (status >= 500) {
    errMsg = 'Server error setting primary resume. Please try again later.';
  } else if (backendMsg) {
    errMsg = backendMsg;
  }

  console.debug('[resumeService] setPrimaryResume error:', {
    status,
    endpoint: lastUrl,
    method: 'PATCH',
    message: errMsg,
  });

  const err = new Error(errMsg);
  err.status = status;
  err.data = lastData;
  throw err;
};

/**
 * Check if the user already has a resume on file
 * Uses backend API responses as the source of truth
 *
 * @param {string|null} [token] - Optional explicit access token
 * @returns {Promise<boolean>} True if user has a resume, false otherwise
 */
export const checkUserHasResume = async (token = null) => {
  try {
    // 1. Try GET /api/resumes
    const resumeData = await getResumes(token).catch(() => null);
    if (resumeData) {
      if (Array.isArray(resumeData) && resumeData.length > 0) {
        return true;
      }
      if (
        resumeData.id ||
        resumeData.resumeId ||
        resumeData.fileName ||
        resumeData.filename ||
        resumeData.fileUrl ||
        (Array.isArray(resumeData.resumes) && resumeData.resumes.length > 0) ||
        (Array.isArray(resumeData.data) && resumeData.data.length > 0)
      ) {
        return true;
      }
    }

    // 2. Check profile onboarding state from GET /api/onboarding
    try {
      const profile = await getOnboardingProfile(token);
      if (profile) {
        if (
          profile.hasResume === true ||
          profile.resume ||
          profile.resumeName ||
          profile.resumeUrl ||
          (Array.isArray(profile.resumes) && profile.resumes.length > 0) ||
          profile.profile?.resume ||
          profile.profile?.resumeName ||
          profile.profile?.resumeUrl
        ) {
          return true;
        }
      }
    } catch {
      // ignore
    }

    return false;
  } catch (error) {
    console.warn('Error verifying resume status:', error);
    return false;
  }
};

export default {
  validateResumeFile,
  uploadResume,
  getResumes,
  downloadResume,
  deleteResume,
  setPrimaryResume,
  checkUserHasResume,
};
