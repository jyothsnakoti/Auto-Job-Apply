/**
 * JAAP Billing Service - Implementation following the Frontend API Integration Guide
 * Protected endpoints require: Authorization: Bearer <accessToken>
 */

import { BILLING_ENDPOINTS } from './endpoints';
import { getStoredTokens, saveAuthTokens, clearAuthTokens, refreshAuthToken as authRefresh, fetchWithAuth } from './authService';

/**
 * Clean and sanitize stored token string (strips quotes, whitespace, Bearer prefix)
 */
const sanitizeToken = (rawToken) => {
  if (!rawToken || rawToken === 'undefined' || rawToken === 'null') {
    return null;
  }

  let cleaned = String(rawToken).trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  if (cleaned.toLowerCase().startsWith('bearer ')) {
    cleaned = cleaned.slice(7).trim();
  }

  return cleaned || null;
};

/**
 * Retrieve stored auth access token from localStorage or sessionStorage
 */
export const getStoredAuthToken = () => {
  const { accessToken } = getStoredTokens();
  return sanitizeToken(accessToken);
};

/**
 * Retrieve stored refresh token
 */
export const getStoredRefreshToken = () => {
  const { refreshToken } = getStoredTokens();
  return sanitizeToken(refreshToken);
};

/**
 * Save updated tokens to active storage
 */
export const setStoredTokens = (accessToken, refreshToken) => {
  const cleanAccess = sanitizeToken(accessToken);
  const cleanRefresh = sanitizeToken(refreshToken);
  saveAuthTokens({
    accessToken: cleanAccess,
    refreshToken: cleanRefresh,
  });
};

/**
 * Clear stored auth tokens on logout or invalid session
 */
export const clearStoredTokens = () => {
  clearAuthTokens();
};

/**
 * Refresh expired access token using POST /api/auth/refresh
 */
export const refreshAuthToken = async () => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }

  console.debug('[billing] token refresh was attempted');

  try {
    const res = await authRefresh(refreshToken);
    if (res?.accessToken) {
      return sanitizeToken(res.accessToken);
    }
  } catch (err) {
    console.error('[billing] Token refresh failed:', err);
  }
  return null;
};

/**
 * Helper to execute authenticated API calls with token refresh and diagnostic logging
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
  let token = getStoredAuthToken();

  // If access token is absent, attempt refresh if a refresh token exists
  if (!token) {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      token = await refreshAuthToken();
    }
  }

  // Diagnostic logging (NEVER exposing actual token value)
  const hasToken = Boolean(token);
  console.debug('[billing] access token present:', hasToken);

  const headers = {
    Accept: 'application/json, text/plain, */*',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isAuthAttached = Boolean(headers['Authorization']);
  console.debug('[billing] authorization header attached:', isAuthAttached);

  if (!isAuthAttached) {
    const authErr = new Error('Authentication required. Please sign in to proceed with checkout.');
    authErr.status = 401;
    authErr.isAuthError = true;
    throw authErr;
  }

  let response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, attempt token refresh and retry original request once
  if (response.status === 401) {
    console.debug('[billing] token refresh was attempted due to 401 Unauthorized');
    const newToken = await refreshAuthToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      console.debug('[billing] retry occurred with refreshed access token');
      response = await fetch(endpoint, {
        ...options,
        headers,
      });
    } else {
      const err = new Error('Your session has expired. Please sign in again.');
      err.status = 401;
      err.isAuthError = true;
      throw err;
    }
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Request failed (Status ${response.status})`;
    let errorData = null;
    try {
      if (isJson) {
        errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } else {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
    } catch {
      // fallback to default message
    }

    if (response.status === 403) {
      console.warn('[billing] 403 Forbidden received for endpoint:', endpoint, {
        hasToken: Boolean(token),
        headersSent: Object.keys(headers),
        status: response.status,
        message: errorMessage,
      });
    }

    const err = new Error(errorMessage);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  if (isJson) {
    return await response.json();
  } else {
    return await response.text();
  }
};

/**
 * Step 1 — Get Plans
 * GET /api/billing/plans
 */
export const getBillingPlans = async () => {
  return await authenticatedFetch(BILLING_ENDPOINTS.PLANS, {
    method: 'GET',
  });
};

/**
 * Step 2 — Get Stripe Publishable Key
 * GET /api/billing/stripe-key
 */
export const getStripePublishableKey = async () => {
  try {
    const data = await authenticatedFetch(BILLING_ENDPOINTS.STRIPE_KEY, {
      method: 'GET',
    });
    if (typeof data === 'object' && data?.publishableKey) {
      return data.publishableKey;
    }
    if (typeof data === 'string' && data.startsWith('pk_')) {
      return data.trim();
    }
  } catch (err) {
    // Rethrow auth errors so UI knows authentication failed
    if (err?.status === 401 || err?.status === 403 || err?.isAuthError) {
      throw err;
    }
    console.warn('Could not fetch stripe-key from backend, checking environment fallback:', err?.message);
  }
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null;
};

/**
 * Step 3 — Create Payment Intent
 * POST /api/billing/create-payment-intent
 * Body EXACTLY: { "Plancode": "basic" | "pro" }
 */
export const createPaymentIntent = async (plancode) => {
  const normalizedCode = (plancode || 'basic').toLowerCase().trim();
  const res = await authenticatedFetch(BILLING_ENDPOINTS.CREATE_PAYMENT_INTENT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Plancode: normalizedCode,
    }),
  });

  if (typeof res === 'object' && res?.clientSecret) {
    return res.clientSecret;
  }
  if (typeof res === 'string' && res.includes('_secret_')) {
    return res.trim();
  }
  throw new Error('Backend did not return a valid clientSecret for PaymentIntent creation.');
};

/**
 * Step 6 — Backend Confirm Payment
 * POST /api/billing/confirm-payment
 * Body EXACTLY: { "PaymentIntentId": "pi_..." }
 * Response is plain text: "Payment confirmed. Plan activated."
 */
export const confirmBackendPayment = async (paymentIntentId) => {
  if (!paymentIntentId) {
    throw new Error('PaymentIntent ID is missing for backend confirmation.');
  }

  return await authenticatedFetch(BILLING_ENDPOINTS.CONFIRM_PAYMENT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      PaymentIntentId: paymentIntentId,
    }),
  });
};

/**
 * Step 7 — Get Billing Status
 * GET /api/billing/status
 * Response: { "hasPlan": true, "remainingApplications": 250 | 1000 }
 */
export const getBillingStatus = async (token = null) => {
  let data;
  if (token) {
    // If specific token was explicitly provided
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${token}`,
    };
    const res = await fetch(BILLING_ENDPOINTS.STATUS, {
      method: 'GET',
      headers,
    });
    const text = await res.text().catch(() => '');
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      const error = new Error(data?.message || data?.error || `Status failed (${res.status})`);
      error.status = res.status;
      throw error;
    }
  } else {
    data = await authenticatedFetch(BILLING_ENDPOINTS.STATUS, {
      method: 'GET',
    });
  }

  const billingInfo = {
    hasPlan: Boolean(data?.hasPlan),
    planName: data?.planName || (data?.hasPlan ? 'Active Plan' : 'No active plan'),
    applicationAllowance:
      typeof data?.applicationAllowance === 'number'
        ? data.applicationAllowance
        : typeof data?.remainingApplications === 'number'
        ? data.remainingApplications
        : 0,
    usedApplications: typeof data?.usedApplications === 'number' ? data.usedApplications : 0,
    remainingApplications: typeof data?.remainingApplications === 'number' ? data.remainingApplications : 0,
    billingInterval: data?.billingInterval || 'month',
    ...(typeof data === 'object' ? data : {}),
  };

  try {
    const storage =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken')
        ? localStorage
        : sessionStorage;
    storage.setItem('billingStatus', JSON.stringify(billingInfo));
    storage.setItem('hasPlan', String(Boolean(data?.hasPlan)));
  } catch {
    // storage fail-safe
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('billingStatusUpdated', { detail: billingInfo }));
    } catch {
      // Event dispatch fail-safe
    }
  }

  return billingInfo;
};

/**
 * Fetch user's billing renewal and payment history
 * GET /api/billing/history
 * Requires Authorization: Bearer <accessToken>
 * @param {string} [token] - Optional explicit access token
 * @returns {Promise<Array>} Array of history records
 */
export const getBillingHistory = async (token = null) => {
  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${cleanToken}`,
    };
    const response = await fetch(BILLING_ENDPOINTS.HISTORY, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text };
      }
      const error = new Error(errorData?.message || `Failed to fetch billing history (Status ${response.status})`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.history || data.data || []);
  }

  const data = await authenticatedFetch(BILLING_ENDPOINTS.HISTORY, {
    method: 'GET',
  });

  return Array.isArray(data) ? data : (data?.history || data?.data || []);
};

/**
 * Recovery Flow
 * POST /api/billing/recover
 * Response: { "recovered": 1 }
 */
export const recoverBilling = async () => {
  return await authenticatedFetch(BILLING_ENDPOINTS.RECOVER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Trial Plan Selection
 * POST /api/billing/select-trial
 */
export const selectTrialPlan = async () => {
  return await authenticatedFetch(BILLING_ENDPOINTS.SELECT_TRIAL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export default {
  getStoredAuthToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
  refreshAuthToken,
  authenticatedFetch,
  getBillingPlans,
  getStripePublishableKey,
  createPaymentIntent,
  confirmBackendPayment,
  getBillingStatus,
  getBillingHistory,
  recoverBilling,
  selectTrialPlan,
};

