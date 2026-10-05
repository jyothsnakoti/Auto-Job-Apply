// /**
//  * Centralized API Endpoints Configuration
//  * Uses relative API routes so Vite proxy forwards requests cleanly to backend
//  */

// export const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || '';

// export const AUTH_ENDPOINTS = {
//   SIGNUP: `${API_BASE_URL}/api/auth/signup`,
//   LOGIN: `${API_BASE_URL}/api/auth/login`,
//   LINKEDIN: `${API_BASE_URL}/api/auth/linkedin`,
//   VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
//   RESEND_OTP: `${API_BASE_URL}/api/auth/resend-otp`,
//   REFRESH: `${API_BASE_URL}/api/auth/refresh`,
//   LOGOUT: `${API_BASE_URL}/api/auth/logout`,
//   SIGNOUT: `${API_BASE_URL}/api/auth/logout`,
// };

// export const BILLING_ENDPOINTS = {
//   PLANS: `${API_BASE_URL}/api/billing/plans`,
//   STRIPE_KEY: `${API_BASE_URL}/api/billing/stripe-key`,
//   CREATE_PAYMENT_INTENT: `${API_BASE_URL}/api/billing/create-payment-intent`,
//   TOGGLE_AUTOPAY: `${API_BASE_URL}/api/billing/toggle-autopay`,
//   CREATE_CARD_UPDATE_INTENT: `${API_BASE_URL}/api/billing/create-card-update-intent`,
//   CONFIRM_CARD_UPDATE: `${API_BASE_URL}/api/billing/confirm-card-update`,
//   CONFIRM_PAYMENT: `${API_BASE_URL}/api/billing/confirm-payment`,
//   PAYMENT_METHOD: `${API_BASE_URL}/api/billing/payment-method`,
//   CARDS: `${API_BASE_URL}/api/billing/cards`,
//   DEFAULT_CARD: `${API_BASE_URL}/api/billing/cards/default`,
//   STATUS: `${API_BASE_URL}/api/billing/status`,
//   HISTORY: `${API_BASE_URL}/api/billing/history`,
//   RECOVER: `${API_BASE_URL}/api/billing/recover`,
//   SELECT_TRIAL: `${API_BASE_URL}/api/billing/select-trial`,
// };

// export const ONBOARDING_ENDPOINTS = {
//   SUBMIT: `${API_BASE_URL}/api/onboarding`,
//   GET: `${API_BASE_URL}/api/onboarding`,
// };

// export const PROFILE_ENDPOINTS = {
//   GET: `${API_BASE_URL}/api/onboarding`,
//   UPDATE_PERSONAL: `${API_BASE_URL}/api/profile/personal`,
//   UPDATE_LOCATION: `${API_BASE_URL}/api/profile/location`,
//   UPDATE_SETTINGS: `${API_BASE_URL}/api/profile/settings`,
//   UPDATE_WORK_PREFERENCES: `${API_BASE_URL}/api/profile/work-preferences`,
// };

// export const RESUME_API_BASE_URL = 'https://fog-slacked-prankster.ngrok-free.dev';

// export const RESUME_ENDPOINTS = {
//   // --- OLD RESUME UPLOAD ENDPOINT (Commented out, not deleted) ---
//   // UPLOAD: `${API_BASE_URL}/api/resumes`,
//   // --- NEW NGROK RESUME UPLOAD & JD MATCHING ENDPOINT ---
//   UPLOAD: `${RESUME_API_BASE_URL}/api/v1/Get_N_JDs_for_Res`,
//   GET: `${API_BASE_URL}/api/resumes`,
//   DOWNLOAD: (id) => `${API_BASE_URL}/api/resumes/${id}/download`,
//   DELETE: (id) => `${API_BASE_URL}/api/resumes/${id}`,
//   SET_PRIMARY: (id) => `${API_BASE_URL}/api/resumes/${id}/set-primary`,
// };

// export const JOB_ENDPOINTS = {
//   GET_MORE_JOBS: `${RESUME_API_BASE_URL}/api/v1/Get_N_moreJDs_for_Res`,
//   GET_N_JDS: `${RESUME_API_BASE_URL}/api/v1/Get_N_JDs_for_Res`,
// };

// export const ENDPOINTS = {
//   BASE_URL: API_BASE_URL,
//   AUTH: AUTH_ENDPOINTS,
//   BILLING: BILLING_ENDPOINTS,
//   ONBOARDING: ONBOARDING_ENDPOINTS,
//   PROFILE: PROFILE_ENDPOINTS,
//   RESUME: RESUME_ENDPOINTS,
//   JOB: JOB_ENDPOINTS,
// };

// export default ENDPOINTS;




/**
 * Centralized API Endpoints Configuration
 * Uses relative API routes so Vite proxy forwards requests cleanly to backend
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

/* =========================================================
   AUTH ENDPOINTS
   ========================================================= */

export const AUTH_ENDPOINTS = {
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LINKEDIN: `${API_BASE_URL}/api/auth/linkedin`,
  VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
  RESEND_OTP: `${API_BASE_URL}/api/auth/resend-otp`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  SIGNOUT: `${API_BASE_URL}/api/auth/logout`,
};

/* =========================================================
   BILLING ENDPOINTS
   ========================================================= */

export const BILLING_ENDPOINTS = {
  PLANS: `${API_BASE_URL}/api/billing/plans`,
  STRIPE_KEY: `${API_BASE_URL}/api/billing/stripe-key`,
  CREATE_PAYMENT_INTENT: `${API_BASE_URL}/api/billing/create-payment-intent`,
  TOGGLE_AUTOPAY: `${API_BASE_URL}/api/billing/toggle-autopay`,
  CREATE_CARD_UPDATE_INTENT: `${API_BASE_URL}/api/billing/create-card-update-intent`,
  CONFIRM_CARD_UPDATE: `${API_BASE_URL}/api/billing/confirm-card-update`,
  CONFIRM_PAYMENT: `${API_BASE_URL}/api/billing/confirm-payment`,
  PAYMENT_METHOD: `${API_BASE_URL}/api/billing/payment-method`,
  CARDS: `${API_BASE_URL}/api/billing/cards`,
  DEFAULT_CARD: `${API_BASE_URL}/api/billing/cards/default`,
  STATUS: `${API_BASE_URL}/api/billing/status`,
  HISTORY: `${API_BASE_URL}/api/billing/history`,
  RECOVER: `${API_BASE_URL}/api/billing/recover`,
  SELECT_TRIAL: `${API_BASE_URL}/api/billing/select-trial`,
};

/* =========================================================
   ONBOARDING ENDPOINTS
   ========================================================= */

export const ONBOARDING_ENDPOINTS = {
  SUBMIT: `${API_BASE_URL}/api/onboarding`,
  GET: `${API_BASE_URL}/api/onboarding`,
};

/* =========================================================
   PROFILE ENDPOINTS
   ========================================================= */

export const PROFILE_ENDPOINTS = {
  GET: `${API_BASE_URL}/api/onboarding`,
  UPDATE_PERSONAL: `${API_BASE_URL}/api/profile/personal`,
  UPDATE_LOCATION: `${API_BASE_URL}/api/profile/location`,
  UPDATE_SETTINGS: `${API_BASE_URL}/api/profile/settings`,
  UPDATE_WORK_PREFERENCES: `${API_BASE_URL}/api/profile/work-preferences`,
};

/* =========================================================
   RESUME API BASE URL
   ========================================================= */

export const RESUME_API_BASE_URL =
  "https://fog-slacked-prankster.ngrok-free.dev";

/* =========================================================
   RESUME ENDPOINTS
   ========================================================= */

export const RESUME_ENDPOINTS = {
  // Standard Resume Upload Endpoint
  UPLOAD: `${API_BASE_URL}/api/resumes`,
  // Ngrok Endpoint Reference
  UPLOAD_NGROK: `${RESUME_API_BASE_URL}/api/v1/Get_N_JDs_for_Res`,
  GET: `${API_BASE_URL}/api/resumes`,

  DOWNLOAD: (id) =>
    `${API_BASE_URL}/api/resumes/${id}/download`,

  DELETE: (id) =>
    `${API_BASE_URL}/api/resumes/${id}`,

  SET_PRIMARY: (id) =>
    `${API_BASE_URL}/api/resumes/${id}/set-primary`,
};

export const ENHANCE_RESUME_ENDPOINTS = {
  GET_ENHANCED_RESUME: `${RESUME_API_BASE_URL}/api/v1/Get_EnhancedResume_for_PoorJDScore`,
  GET_SCORE_FOR_ENHANCED_RESUME: `${RESUME_API_BASE_URL}/api/v1/Get_Score_for_EnhancedResume`,
};

export const MORE_JOBS_ENDPOINTS = {
  GET_MORE_JDS: `${RESUME_API_BASE_URL}/api/v1/Get_N_moreJDs_for_Res`,
};

export const DASHBOARD_ENDPOINTS = {
  GET: `${API_BASE_URL}/api/dashboard`,
};

export const JOB_ENDPOINTS = {
  LIST: `${API_BASE_URL}/api/jobs`,
  GET: `${API_BASE_URL}/api/jobs`,
};

export const ENDPOINTS = {
  BASE_URL: API_BASE_URL,

  AUTH: AUTH_ENDPOINTS,

  BILLING: BILLING_ENDPOINTS,

  ONBOARDING: ONBOARDING_ENDPOINTS,

  PROFILE: PROFILE_ENDPOINTS,

  RESUME: RESUME_ENDPOINTS,
  ENHANCE_RESUME: ENHANCE_RESUME_ENDPOINTS,
  MORE_JOBS: MORE_JOBS_ENDPOINTS,
  DASHBOARD: DASHBOARD_ENDPOINTS,
  JOBS: JOB_ENDPOINTS,
  JOB: JOB_ENDPOINTS,
};

export default ENDPOINTS;


