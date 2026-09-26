/**
 * Centralized API Endpoints Configuration
 * Uses relative API routes so Vite proxy forwards requests cleanly to backend
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '';

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

export const BILLING_ENDPOINTS = {
  PLANS: `${API_BASE_URL}/api/billing/plans`,
  STRIPE_KEY: `${API_BASE_URL}/api/billing/stripe-key`,
  CREATE_PAYMENT_INTENT: `${API_BASE_URL}/api/billing/create-payment-intent`,
  CONFIRM_PAYMENT: `${API_BASE_URL}/api/billing/confirm-payment`,
  STATUS: `${API_BASE_URL}/api/billing/status`,
  HISTORY: `${API_BASE_URL}/api/billing/history`,
  RECOVER: `${API_BASE_URL}/api/billing/recover`,
  SELECT_TRIAL: `${API_BASE_URL}/api/billing/select-trial`,
};

export const ONBOARDING_ENDPOINTS = {
  SUBMIT: `${API_BASE_URL}/api/onboarding`,
  GET: `${API_BASE_URL}/api/onboarding`,
};

export const PROFILE_ENDPOINTS = {
  GET: `${API_BASE_URL}/api/onboarding`,
  UPDATE_PERSONAL: `${API_BASE_URL}/api/profile/personal`,
  UPDATE_LOCATION: `${API_BASE_URL}/api/profile/location`,
  UPDATE_SETTINGS: `${API_BASE_URL}/api/profile/settings`,
  UPDATE_WORK_PREFERENCES: `${API_BASE_URL}/api/profile/work-preferences`,
};

export const ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  AUTH: AUTH_ENDPOINTS,
  BILLING: BILLING_ENDPOINTS,
  ONBOARDING: ONBOARDING_ENDPOINTS,
  PROFILE: PROFILE_ENDPOINTS,
};

export default ENDPOINTS;
