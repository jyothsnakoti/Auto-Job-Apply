import { apiClient, fetchWithAuth } from './authService';
import { ENHANCE_RESUME_ENDPOINTS, API_BASE_URL } from './endpoints';
import { getStoredTokens, getStoredUser } from './authService';
import { getOnboardingState } from './onboardingService';

/**
 * API 1: Generate / Enhance Resume
 * POST /api/jobs/{jobId}/enhance
 *
 * @param {string|number} jobId - Job ID to enhance for
 * @returns {Promise<Object>} POST API response
 */
export const postEnhanceJobResume = async (jobId) => {
  if (!jobId && jobId !== 0) {
    throw new Error('Job ID is required for resume enhancement.');
  }

  const endpoint =
    ENHANCE_RESUME_ENDPOINTS?.POST_ENHANCE?.(jobId) ||
    `${API_BASE_URL}/api/jobs/${jobId}/enhance`;

  console.log("Step 1: Calling POST", `/api/jobs/${jobId}/enhance`);

  try {
    const response = await apiClient.post(endpoint, null, {
      headers: {
        Accept: 'application/json',
      },
    });
    console.log("POST enhance response:", response.data);
    return response.data || { status: 'OK' };
  } catch (error) {
    const res = await fetchWithAuth(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await res.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { message: text } : {};
    }

    if (!res.ok) {
      const errMsg =
        data?.message ||
        data?.detail ||
        data?.error ||
        `Enhance resume request failed with status ${res.status}`;
      const err = new Error(errMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    console.log("POST enhance response:", data);
    return data || { status: 'OK' };
  }
};

/**
 * API 2: Get Enhanced Resume
 * GET /api/jobs/{jobId}/enhance
 *
 * @param {string|number} jobId - Job ID to retrieve enhancement for
 * @returns {Promise<Object>} GET API response with enhanced resume details
 */
export const getEnhancedJobResume = async (jobId) => {
  if (!jobId && jobId !== 0) {
    throw new Error('Job ID is required to fetch enhanced resume.');
  }

  const endpoint =
    ENHANCE_RESUME_ENDPOINTS?.GET_ENHANCED?.(jobId) ||
    `${API_BASE_URL}/api/jobs/${jobId}/enhance`;

  console.log("Step 2: Calling GET", `/api/jobs/${jobId}/enhance`);

  try {
    const response = await apiClient.get(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });
    console.log("GET enhance response:", response.data);
    return response.data;
  } catch (error) {
    const res = await fetchWithAuth(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await res.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { message: text } : {};
    }

    if (!res.ok) {
      const errMsg =
        data?.message ||
        data?.detail ||
        data?.error ||
        `Failed to fetch enhanced resume with status ${res.status}`;
      const err = new Error(errMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    console.log("GET enhance response:", data);
    return data;
  }
};

/**
 * Sequential Enhance Resume Workflow:
 * User clicks "Enhance Resume"
 *         ↓
 * POST /api/jobs/{jobId}/enhance
 *         ↓
 * Status check (OK, SCORED, NO_BRIDGEABLE_GAPS, NOT_NEEDED, GUARDRAIL_FAILED)
 *         ↓
 * If enhancement succeeds (OK / SCORED)
 *         ↓
 * GET /api/jobs/{jobId}/enhance
 *         ↓
 * Return GET response normalized for existing UI
 *
 * @param {string|number|Object} jobOrPayload - Job ID or payload object containing jobId/JDid
 * @returns {Promise<Object>} Normalized enhanced resume data for UI display
 */
export const getEnhancedResume = async (jobOrPayload) => {
  if (!jobOrPayload && jobOrPayload !== 0) {
    throw new Error('Job ID or payload is required for enhance resume request.');
  }

  // Extract jobId dynamically from argument
  let jobId = jobOrPayload;
  if (typeof jobOrPayload === 'object' && jobOrPayload !== null) {
    jobId =
      jobOrPayload.jobId ||
      jobOrPayload.job_id ||
      jobOrPayload.JDid ||
      jobOrPayload.jd_id ||
      jobOrPayload.id;
  }

  if (!jobId && jobId !== 0) {
    throw new Error('Job ID (jobId / JDid) is missing for enhance resume request.');
  }

  // Step 1: Call POST /api/jobs/{jobId}/enhance
  const postData = await postEnhanceJobResume(jobId);

  // Status inspection
  const rawStatus =
    postData?.status ||
    postData?.enhancementStatus ||
    postData?.resultStatus ||
    '';
  const normalizedStatus = String(rawStatus).toUpperCase().trim();

  console.log(`[enhanceResumeService] POST response status: "${normalizedStatus}"`);

  // Handle GUARDRAIL_FAILED
  if (normalizedStatus === 'GUARDRAIL_FAILED') {
    const errorMsg =
      postData?.message ||
      postData?.detail ||
      'Enhancement guardrail check failed. Resume modifications could not be safely verified.';
    const err = new Error(errorMsg);
    err.status = 'GUARDRAIL_FAILED';
    err.data = postData;
    throw err;
  }

  // Handle NO_BRIDGEABLE_GAPS
  if (normalizedStatus === 'NO_BRIDGEABLE_GAPS') {
    return {
      status: 'NO_BRIDGEABLE_GAPS',
      jobId,
      message:
        postData?.message ||
        'No bridgeable skill gaps identified for this role.',
      ...postData,
    };
  }

  // Handle NOT_NEEDED
  if (normalizedStatus === 'NOT_NEEDED') {
    return {
      status: 'NOT_NEEDED',
      jobId,
      message:
        postData?.message ||
        'Resume enhancement is not needed for this role — your profile is already well aligned.',
      ...postData,
    };
  }

  // For OK, SCORED, or general 200 enhancement success, proceed to Step 2 (GET)
  let getData = null;
  try {
    getData = await getEnhancedJobResume(jobId);
  } catch (getErr) {
    console.error('[enhanceResumeService] Error fetching enhanced resume via GET:', getErr);
    // If GET fails but POST had text preview or partial data, preserve it or rethrow
    if (postData?.enhancedResume || postData?.EnhResume || postData?.enhResume) {
      getData = postData;
    } else {
      throw getErr;
    }
  }

  // Extract enhanced resume text across common naming variations
  const enhancedResumeText =
    getData?.enhancedResume ||
    getData?.EnhResume ||
    getData?.enhResume ||
    getData?.enhanced_resume ||
    getData?.resumeText ||
    getData?.enhancedText ||
    getData?.text ||
    postData?.enhancedResume ||
    postData?.EnhResume ||
    postData?.enhResume ||
    '';

  // Extract bridgeable gaps across common naming variations
  const bridgeableGaps =
    getData?.bridgeable_gaps ||
    getData?.bridgeableGaps ||
    getData?.gaps ||
    getData?.skillsBridged ||
    postData?.bridgeable_gaps ||
    postData?.bridgeableGaps ||
    [];

  const normalizedResult = {
    ...(typeof postData === 'object' ? postData : {}),
    ...(typeof getData === 'object' ? getData : {}),
    status: getData?.status || postData?.status || 'OK',
    jobId,
    enhancedResume: enhancedResumeText,
    EnhResume: enhancedResumeText,
    enhResume: enhancedResumeText,
    enhanced_resume: enhancedResumeText,
    bridgeable_gaps: bridgeableGaps,
    bridgeableGaps: bridgeableGaps,
    postData,
    getData,
  };

  console.log('[enhanceResumeService] Final normalized enhanced resume result:', normalizedResult);
  return normalizedResult;
};

/**
 * Retrieve the logged-in candidate ID dynamically from existing authentication state.
 * Inspects:
 * 1. getStoredUser() object (candidateId, candidate_id, Candidateid, id, userId, user_id, sub)
 * 2. Decoded JWT access token
 * 3. Direct localStorage / sessionStorage keys
 *
 * @returns {string} Candidate ID
 */
export const getCandidateId = () => {
  // 1. Inspect getStoredUser()
  try {
    const user = getStoredUser();
    if (user && typeof user === 'object') {
      const id =
        user.candidate_id ||
        user.candidateId ||
        user.Candidateid ||
        user.CandidateId ||
        user.candidateID ||
        user.id ||
        user.userId ||
        user.user_id ||
        user._id ||
        user.sub;
      if (id) return String(id).trim();
    }
  } catch {
    // ignore
  }

  // 2. Inspect direct candidateId storage keys
  try {
    const directCandidateId =
      localStorage.getItem('candidateId') ||
      sessionStorage.getItem('candidateId') ||
      localStorage.getItem('candidate_id') ||
      sessionStorage.getItem('candidate_id') ||
      localStorage.getItem('Candidateid') ||
      sessionStorage.getItem('Candidateid');
    if (directCandidateId) return String(directCandidateId).trim();
  } catch {
    // ignore
  }

  // 3. Decode JWT access token payload if available
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
          decoded?.candidate_id ||
          decoded?.candidateId ||
          decoded?.Candidateid ||
          decoded?.CandidateId ||
          decoded?.candidateID ||
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

  // 4. Inspect direct general user ID keys
  try {
    const directUserId =
      localStorage.getItem('userId') ||
      sessionStorage.getItem('userId') ||
      localStorage.getItem('user_id') ||
      sessionStorage.getItem('user_id');
    if (directUserId) return String(directUserId).trim();
  } catch {
    // ignore
  }

  return '';
};

/**
 * Retrieve the uploaded resume ID dynamically from onboarding Step 1 or existing resume state.
 * Inspects:
 * 1. Direct storage keys (resume_id, resumeId, ResumeID)
 * 2. Onboarding state
 * 3. Stored user object
 *
 * @returns {string} Resume ID
 */
export const getStoredResumeId = () => {
  // 1. Direct storage keys
  try {
    const direct =
      localStorage.getItem('resume_id') ||
      sessionStorage.getItem('resume_id') ||
      localStorage.getItem('resumeId') ||
      sessionStorage.getItem('resumeId') ||
      localStorage.getItem('ResumeID') ||
      sessionStorage.getItem('ResumeID');
    if (direct) return String(direct).trim();
  } catch {
    // ignore
  }

  // 2. Onboarding state
  try {
    const onboarding = getOnboardingState();
    if (onboarding) {
      const resId =
        onboarding.resumeId ||
        onboarding.resume_id ||
        onboarding.ResumeID ||
        onboarding.id;
      if (resId) return String(resId).trim();
    }
  } catch {
    // ignore
  }

  // 3. Raw onboarding storage
  try {
    const raw =
      sessionStorage.getItem('auto_job_apply_onboarding_state') ||
      localStorage.getItem('auto_job_apply_onboarding_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      const resId =
        parsed?.resumeId ||
        parsed?.resume_id ||
        parsed?.ResumeID ||
        parsed?.id;
      if (resId) return String(resId).trim();
    }
  } catch {
    // ignore
  }

  // 4. Stored user object
  try {
    const user = getStoredUser();
    if (user && typeof user === 'object') {
      const resId =
        user.resumeId ||
        user.resume_id ||
        user.ResumeID ||
        user.resume?.id ||
        user.resume?.resume_id;
      if (resId) return String(resId).trim();
    }
  } catch {
    // ignore
  }

  return '';
};

/**
 * Helper to extract the actual Job ID (JDid) from any job object
 * @param {Object} job
 * @returns {string}
 */
export const getJobId = (job) => {
  if (!job) return '';
  const id =
    job.job_id ||
    job.JDid ||
    job.jd_id ||
    job.rawMatch?.job_id ||
    job.rawMatch?.JDid ||
    job.id;
  return id ? String(id).trim() : '';
};

export default {
  postEnhanceJobResume,
  getEnhancedJobResume,
  getEnhancedResume,
  getCandidateId,
  getStoredResumeId,
  getJobId,
};
