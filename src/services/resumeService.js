import { RESUME_ENDPOINTS } from './endpoints';
import { getStoredTokens, getStoredUser, fetchWithAuth } from './authService';
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
 * Retrieve the current authenticated user's plan/subscription from the frontend source of truth
 * Inspects:
 * 1. Stored billing status (billingStatus in localStorage/sessionStorage)
 * 2. Authenticated user object (authUser/user in localStorage/sessionStorage)
 * 3. hasPlan storage flag
 *
 * @returns {string} Normalized plan name or key ('free', 'basic', 'pro')
 */
export const getUserPlan = () => {
  // 1. Inspect stored billing status from backend API / storage
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

  // 2. Inspect authenticated user profile in storage
  try {
    const user = getStoredUser();
    const userPlan =
      user?.plan ||
      user?.subscriptionPlan ||
      user?.subscription ||
      user?.planName ||
      user?.plancode ||
      user?.planCode ||
      user?.tier ||
      user?.membership;
    if (userPlan) return String(userPlan).trim();
  } catch {
    // ignore
  }

  // 3. Inspect hasPlan storage indicator
  try {
    const hasPlan =
      localStorage.getItem('hasPlan') === 'true' ||
      sessionStorage.getItem('hasPlan') === 'true';
    if (!hasPlan) return 'free';
  } catch {
    // ignore
  }

  return 'free';
};

/**
 * Dynamically map subscription plan to N parameter:
 * - FREE  → 1
 * - BASIC → 10
 * - PRO   → 1000
 *
 * @param {string|null} plan - Plan name or code
 * @returns {number} Dynamic N value
 */
export const getNByPlan = (plan) => {
  if (!plan) return 1;
  const p = String(plan).toLowerCase().trim();
  if (p.includes('pro')) {
    return 1000;
  }
  if (p.includes('basic')) {
    return 10;
  }
  // Free, Trial, Trial Pack, Free Trial, None, or default
  return 1;
};

/**
 * Retrieve the current authenticated user ID from the frontend auth source of truth
 * Inspects:
 * 1. getStoredUser() object (id, userId, user_id, _id, sub)
 * 2. JWT Access Token decoded payload (user_id, userId, id, _id, sub)
 * 3. Stored storage keys (userId, user_id)
 * 4. Fallback to user email
 *
 * @returns {string} User ID
 */
export const getUserId = () => {
  // 1. Inspect getStoredUser()
  try {
    const user = getStoredUser();
    if (user) {
      const id = user.id || user.userId || user.user_id || user._id || user.sub;
      if (id) return String(id).trim();
    }
  } catch {
    // ignore
  }

  // 2. Decode JWT access token payload if available
  try {
    const { accessToken } = getStoredTokens();
    if (accessToken && typeof accessToken === 'string') {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        const jwtId =
          decoded?.user_id ||
          decoded?.userId ||
          decoded?.id ||
          decoded?._id ||
          decoded?.sub;
        if (jwtId) return String(jwtId).trim();
      }
    }
  } catch {
    // ignore
  }

  // 3. Inspect direct storage keys
  try {
    const directId =
      localStorage.getItem('userId') ||
      sessionStorage.getItem('userId') ||
      localStorage.getItem('user_id') ||
      sessionStorage.getItem('user_id');
    if (directId) return String(directId).trim();
  } catch {
    // ignore
  }

  // 4. Fallback to user email
  try {
    const user = getStoredUser();
    if (user?.email) return String(user.email).trim();
    const storedEmail =
      localStorage.getItem('userEmail') ||
      sessionStorage.getItem('userEmail') ||
      '';
    if (storedEmail) return storedEmail.trim();
  } catch {
    // ignore
  }

  return 'user';
};

/* =========================================================================
 * OLD RESUME UPLOAD IMPLEMENTATION (Preserved & Commented Out)
 * =========================================================================
 * export const uploadResumeOld = async (file, metadata = null, token = null) => {
 *   const validation = validateResumeFile(file);
 *   if (!validation.valid) {
 *     const err = new Error(validation.error);
 *     err.status = 400;
 *     throw err;
 *   }
 *
 *   // Prepare multipart/form-data
 *   const formData = new FormData();
 *   formData.append('file', file);
 *
 *   if (metadata) {
 *     if (typeof metadata === 'string') {
 *       formData.append('metadata', metadata);
 *     } else {
 *       formData.append('metadata', JSON.stringify(metadata));
 *     }
 *   }
 *
 *   let response;
 *   try {
 *     response = await fetchWithAuth(RESUME_ENDPOINTS.UPLOAD, {
 *       method: 'POST',
 *       body: formData,
 *       token,
 *     });
 *   } catch (netErr) {
 *     console.error('Resume upload network error:', netErr);
 *     const error = new Error('Unable to upload your resume. Please check your connection and try again.');
 *     error.status = 0;
 *     throw error;
 *   }
 *
 *   const text = await response.text().catch(() => '');
 *   let data;
 *   try {
 *     data = JSON.parse(text);
 *   } catch {
 *     data = text ? { message: text } : {};
 *   }
 *
 *   if (!response.ok) {
 *     let message = 'Unable to upload your resume. Please try again.';
 *
 *     if (response.status === 401) {
 *       message = 'Your session has expired. Please log in again.';
 *     } else if (response.status === 413) {
 *       message = 'Resume file is too large. Maximum allowed size is 10MB.';
 *     } else if (response.status === 415) {
 *       message = 'Please upload a supported resume format (PDF, DOC, or DOCX).';
 *     } else if (response.status === 400) {
 *       message =
 *         data?.message ||
 *         data?.error ||
 *         (typeof data === 'string' && data ? data : '') ||
 *         'Validation failed for uploaded resume. Please verify the file and try again.';
 *     } else if (response.status >= 500) {
 *       message = 'Server error processing your resume. Please try again later.';
 *     } else if (data?.message || data?.error) {
 *       message = data.message || data.error;
 *     }
 *
 *     const error = new Error(message);
 *     error.status = response.status;
 *     error.data = data;
 *     throw error;
 *   }
 *
 *   return data;
 * };
 * ========================================================================= */

/**
 * Upload resume file and retrieve top matching job descriptions.
 *
 * Backend Endpoint:
 * POST https://fog-slacked-prankster.ngrok-free.dev/api/v1/Get_N_JDs_for_Res?N=<dynamicN>&top_k=100&user_id=<actualUserId>
 *
 * Dynamic N mapping:
 * - FREE  → 1
 * - BASIC → 10
 * - PRO   → 1000
 *
 * Fixed top_k:
 * - top_k = 100 (ALWAYS 100 for all plans)
 *
 * User ID:
 * - user_id = Authenticated user ID
 *
 * Request format:
 * - multipart/form-data with field name 'resume_file'
 *
 * @param {File} file - Resume file object
 * @param {Object|string|null} [metadata] - Optional metadata
 * @param {string|null} [token] - Optional explicit access token
 * @param {Object} [options] - Optional overrides { plan, userId }
 * @returns {Promise<Object>} Backend response with resume_id, matches, and extracted skills
 */
export const uploadResume = async (file, metadata = null, token = null, options = {}) => {
  // 1. Validate file format and size
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    const err = new Error(validation.error);
    err.status = 400;
    throw err;
  }

  // 2. Determine dynamic N based on actual user plan
  const plan = options.plan || getUserPlan();
  const N = getNByPlan(plan);

  // 3. Fixed top_k = 100 for all plans
  const top_k = 100;

  // 4. Determine actual authenticated user ID
  const userId = options.userId || getUserId();

  // 5. Construct URL with dynamic query parameters
  const baseUrl = RESUME_ENDPOINTS.UPLOAD;
  const url = new URL(baseUrl);
  url.searchParams.set('N', String(N));
  url.searchParams.set('top_k', String(top_k));
  url.searchParams.set('user_id', String(userId));
  const fullEndpoint = url.toString();

  console.log(`[resumeService] Uploading resume to: ${fullEndpoint}`);
  console.log(`[resumeService] Plan: "${plan}" -> N: ${N}, top_k: ${top_k}, user_id: "${userId}"`);

  // 6. Build multipart/form-data with field name 'resume_file'
  const formData = new FormData();
  formData.append('resume_file', file);

  if (metadata) {
    if (typeof metadata === 'string') {
      formData.append('metadata', metadata);
    } else {
      formData.append('metadata', JSON.stringify(metadata));
    }
  }

  // 7. Send POST request (letting browser generate multipart boundary automatically)
  let response;
  try {
    response = await fetchWithAuth(fullEndpoint, {
      method: 'POST',
      body: formData,
      token,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
  } catch (netErr) {
    console.error('[resumeService] Resume upload network error:', netErr);
    const error = new Error('Unable to upload your resume. Please check your connection and try again.');
    error.status = 0;
    throw error;
  }

  // 8. Parse backend response
  const text = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text ? { message: text } : {};
  }

  console.log(`[resumeService] Resume upload response status: ${response.status}`, response.statusText);
  console.log('[resumeService] Resume upload response data:', data);

  // 9. Error handling: 400, 401, 403, 404, 422, 500, or { status: "error" }
  if (!response.ok || data?.status === 'error') {
    console.error('[resumeService] Resume upload failed with response data:', data);
    let message = 'Unable to upload your resume. Please try again.';

    if (response.status === 401) {
      message = 'Your session has expired. Please log in again.';
    } else if (response.status === 403) {
      message = data?.message || data?.detail || 'Access denied. Please check your account subscription.';
    } else if (response.status === 404) {
      message = data?.message || data?.detail || 'The resume matching endpoint was not found.';
    } else if (response.status === 413) {
      message = 'Resume file is too large. Maximum allowed size is 10MB.';
    } else if (response.status === 415) {
      message = 'Please upload a supported resume format (PDF, DOC, or DOCX).';
    } else if (response.status === 422) {
      message =
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.detail) ? data.detail.map((d) => d.msg || d.message).join(', ') : '') ||
        'Invalid resume file or request parameters.';
    } else if (response.status === 400) {
      message =
        data?.message ||
        data?.error ||
        data?.detail ||
        (typeof data === 'string' && data ? data : '') ||
        'Validation failed for uploaded resume. Please verify the file and try again.';
    } else if (response.status >= 500) {
      message = data?.message || data?.detail || 'Server error processing your resume. Please try again later.';
    } else if (data?.message || data?.error || data?.detail) {
      message = data.message || data.error || data.detail;
    }

    const error = new Error(message);
    error.status = response.status || 400;
    error.data = data;
    throw error;
  }

  // 10. Map response and normalize properties for UI and state compatibility
  const normalizedData = {
    status: data?.status || 'success',
    resume_id: data?.resume_id || data?.id || data?.resumeId || '',
    id: data?.resume_id || data?.id || data?.resumeId || '',
    resumeId: data?.resume_id || data?.id || data?.resumeId || '',
    parsed_text_preview: data?.parsed_text_preview || data?.preview || '',
    extracted_skills: Array.isArray(data?.extracted_skills) ? data.extracted_skills : [],
    matches: Array.isArray(data?.matches) ? data.matches : [],
    ...(typeof data === 'object' && data ? data : {}),
  };

  console.log('[resumeService] Normalized resume payload:', normalizedData);

  return normalizedData;
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
  getUserPlan,
  getNByPlan,
  getUserId,
  uploadResume,
  getResumes,
  downloadResume,
  deleteResume,
  setPrimaryResume,
  checkUserHasResume,
};
