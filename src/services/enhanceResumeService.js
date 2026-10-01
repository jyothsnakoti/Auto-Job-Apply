import { apiClient } from './authService';
import { RESUME_API_BASE_URL } from './endpoints';
import { getStoredTokens, getStoredUser } from './authService';
import { getOnboardingState } from './onboardingService';

/**
 * Endpoint for Resume Enhancement based on Job Description
 */
const ENHANCE_RESUME_URL = `${RESUME_API_BASE_URL || ''}/api/v1/Get_EnhancedResume_for_PoorJDScore`;

/**
 * Call the backend Enhance Resume API
 * POST /api/v1/Get_EnhancedResume_for_PoorJDScore
 *
 * @param {Object} payload - { JDid, Candidateid, ResumeID }
 * @returns {Promise<Object>} Enhanced resume response data
 */
export const getEnhancedResume = async (payload) => {
  if (!payload) {
    throw new Error('Payload is required for enhance resume request.');
  }

  const { JDid, Candidateid, ResumeID } = payload;

  if (!JDid) {
    throw new Error('Job ID (JDid) is missing.');
  }
  if (!Candidateid) {
    throw new Error('Candidate ID (Candidateid) is missing.');
  }
  if (!ResumeID) {
    throw new Error('Resume ID (ResumeID) is missing.');
  }

  console.log('[enhanceResumeService] Calling Enhance Resume API:', {
    endpoint: ENHANCE_RESUME_URL,
    payload: {
      JDid,
      Candidateid,
      ResumeID,
    },
  });

  const response = await apiClient.post(
    ENHANCE_RESUME_URL,
    {
      JDid,
      Candidateid,
      ResumeID,
    },
    {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('[enhanceResumeService] Enhance Resume API response:', response.data);
  return response.data;
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
  getEnhancedResume,
  getCandidateId,
  getStoredResumeId,
  getJobId,
};
