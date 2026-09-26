/**
 * JAAP Billing Service - Implementation following the Frontend API Integration Guide
 * Protected endpoints require: Authorization: Bearer <accessToken>
 */

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
  const rawToken =
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    null;

  return sanitizeToken(rawToken);
};

/**
 * Retrieve stored refresh token
 */
export const getStoredRefreshToken = () => {
  const rawToken =
    localStorage.getItem('refreshToken') ||
    sessionStorage.getItem('refreshToken') ||
    null;

  return sanitizeToken(rawToken);
};

/**
 * Save updated tokens to the active storage
 */
export const setStoredTokens = (accessToken, refreshToken) => {
  const inLocal =
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('refreshToken');
  const storage = inLocal ? localStorage : sessionStorage;

  const cleanAccess = sanitizeToken(accessToken);
  const cleanRefresh = sanitizeToken(refreshToken);

  if (cleanAccess) {
    storage.setItem('authToken', cleanAccess);
    storage.setItem('token', cleanAccess);
  }
  if (cleanRefresh) {
    storage.setItem('refreshToken', cleanRefresh);
  }
};

/**
 * Clear stored auth tokens on logout or invalid session
 */
export const clearStoredTokens = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
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
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.warn(`[billing] token refresh request returned status ${response.status}`);
      return null;
    }

    const text = await response.text().catch(() => '');
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { accessToken: text };
    }

    const newAccessToken =
      data.accessToken ||
      data.token ||
      data.jwt ||
      data.data?.accessToken ||
      data.data?.token ||
      data.data?.jwt;

    const newRefreshToken =
      data.refreshToken ||
      data.data?.refreshToken ||
      refreshToken;

    if (newAccessToken) {
      setStoredTokens(newAccessToken, newRefreshToken);
      return sanitizeToken(newAccessToken);
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
  return await authenticatedFetch('/api/billing/plans', {
    method: 'GET',
  });
};

/**
 * Step 2 — Get Stripe Publishable Key
 * GET /api/billing/stripe-key
 */
export const getStripePublishableKey = async () => {
  try {
    const data = await authenticatedFetch('/api/billing/stripe-key', {
      method: 'GET',
    });
    if (typeof data === 'object' && data?.publishableKey) {
      return data.publishableKey;
    }
  } catch (err) {
    // If it is an auth error, rethrow so the UI knows authentication failed
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
  const res = await authenticatedFetch('/api/billing/create-payment-intent', {
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

  return await authenticatedFetch('/api/billing/confirm-payment', {
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
export const getBillingStatus = async () => {
  return await authenticatedFetch('/api/billing/status', {
    method: 'GET',
  });
};

/**
 * Recovery Flow
 * POST /api/billing/recover
 * Response: { "recovered": 1 }
 */
export const recoverBilling = async () => {
  return await authenticatedFetch('/api/billing/recover', {
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
  return await authenticatedFetch('/api/billing/select-trial', {
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
  recoverBilling,
  selectTrialPlan,
};
