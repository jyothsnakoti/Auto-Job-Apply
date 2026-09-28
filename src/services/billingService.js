/**
 * JAAP Billing Service
 *
 * Combined implementation:
 * - Authentication / token management
 * - Automatic token refresh
 * - Authenticated API requests
 * - Billing plans
 * - Stripe publishable key
 * - Payment Intent creation
 * - Backend payment confirmation
 * - Billing status
 * - Billing history
 * - Billing recovery
 * - Trial plan selection
 * - Auto-pay toggle
 * - Card update SetupIntent
 * - Card update confirmation
 * - Saved payment method retrieval
 *
 * Protected endpoints require:
 * Authorization: Bearer <accessToken>
 */

import { BILLING_ENDPOINTS } from './endpoints';

import {
  getStoredTokens,
  saveAuthTokens,
  clearAuthTokens,
  refreshAuthToken as authRefresh,
  fetchWithAuth,
} from './authService';

/**
 * ============================================================
 * TOKEN HELPERS
 * ============================================================
 */

/**
 * Clean and sanitize stored token string.
 * Removes:
 * - quotes
 * - whitespace
 * - Bearer prefix
 */
const sanitizeToken = (rawToken) => {
  if (
    !rawToken ||
    rawToken === 'undefined' ||
    rawToken === 'null'
  ) {
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
 * Retrieve stored access token.
 */
export const getStoredAuthToken = () => {
  const { accessToken } = getStoredTokens();

  return sanitizeToken(accessToken);
};

/**
 * Retrieve stored refresh token.
 */
export const getStoredRefreshToken = () => {
  const { refreshToken } = getStoredTokens();

  return sanitizeToken(refreshToken);
};

/**
 * Save authentication tokens.
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
 * Clear stored authentication tokens.
 */
export const clearStoredTokens = () => {
  clearAuthTokens();
};

/**
 * ============================================================
 * TOKEN REFRESH
 * ============================================================
 */

/**
 * Refresh expired access token.
 */
export const refreshAuthToken = async () => {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    return null;
  }

  console.debug('[billing] token refresh was attempted');

  try {
    const response = await authRefresh(refreshToken);

    if (response?.accessToken) {
      return sanitizeToken(response.accessToken);
    }
  } catch (error) {
    console.error('[billing] Token refresh failed:', error);
  }

  return null;
};

/**
 * ============================================================
 * AUTHENTICATED FETCH
 * ============================================================
 */

/**
 * Execute authenticated API requests.
 *
 * Features:
 * - Reads stored access token
 * - Refreshes token if missing
 * - Attaches Authorization header
 * - Retries once after 401
 * - Parses JSON/text response
 * - Provides useful errors
 */
export const authenticatedFetch = async (
  endpoint,
  options = {}
) => {
  let token = getStoredAuthToken();

  /**
   * If access token doesn't exist,
   * try refreshing it.
   */
  if (!token) {
    const refreshToken = getStoredRefreshToken();

    if (refreshToken) {
      token = await refreshAuthToken();
    }
  }

  console.debug(
    '[billing] access token present:',
    Boolean(token)
  );

  const headers = {
    Accept: 'application/json, text/plain, */*',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isAuthAttached = Boolean(
    headers.Authorization
  );

  console.debug(
    '[billing] authorization header attached:',
    isAuthAttached
  );

  /**
   * No token available.
   */
  if (!isAuthAttached) {
    const authError = new Error(
      'Authentication required. Please sign in to proceed with checkout.'
    );

    authError.status = 401;
    authError.isAuthError = true;

    throw authError;
  }

  /**
   * First request.
   */
  let response = await fetch(endpoint, {
    ...options,
    headers,
  });

  /**
   * If access token expired,
   * refresh and retry once.
   */
  if (response.status === 401) {
    console.debug(
      '[billing] token refresh was attempted due to 401 Unauthorized'
    );

    const newToken = await refreshAuthToken();

    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;

      console.debug(
        '[billing] retry occurred with refreshed access token'
      );

      response = await fetch(endpoint, {
        ...options,
        headers,
      });
    } else {
      const error = new Error(
        'Your session has expired. Please sign in again.'
      );

      error.status = 401;
      error.isAuthError = true;

      throw error;
    }
  }

  const text = await response.text().catch(() => '');
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  /**
   * Handle HTTP errors.
   */
  if (!response.ok) {
    let errorMessage =
      `Request failed (Status ${response.status})`;

    if (typeof data === 'object' && data !== null) {
      errorMessage = data?.message || data?.error || errorMessage;
    } else if (typeof data === 'string' && data) {
      errorMessage = data;
    }

    if (response.status === 403) {
      console.warn(
        '[billing] 403 Forbidden received for endpoint:',
        endpoint,
        {
          hasToken: Boolean(token),
          headersSent: Object.keys(headers),
          status: response.status,
          message: errorMessage,
        }
      );
    }

    const error = new Error(errorMessage);

    error.status = response.status;
    error.data = data;

    throw error;
  }

  // Handle successful response (HTTP 200 - 299)
  // If text is valid JSON, return parsed JSON object; otherwise return plain text response
  return data ?? {};
};

/**
 * ============================================================
 * BILLING PLANS
 * ============================================================
 */

/**
 * GET /api/billing/plans
 */
export const getBillingPlans = async () => {
  return await authenticatedFetch(
    BILLING_ENDPOINTS.PLANS,
    {
      method: 'GET',
    }
  );
};

/**
 * ============================================================
 * STRIPE PUBLISHABLE KEY
 * ============================================================
 */

/**
 * GET /api/billing/stripe-key
 */
export const getStripePublishableKey = async () => {
  try {
    const data = await authenticatedFetch(
      BILLING_ENDPOINTS.STRIPE_KEY,
      {
        method: 'GET',
      }
    );

    if (
      typeof data === 'object' &&
      data?.publishableKey
    ) {
      return data.publishableKey;
    }

    if (
      typeof data === 'string' &&
      data.startsWith('pk_')
    ) {
      return data.trim();
    }
  } catch (error) {
    /**
     * Don't hide authentication errors.
     */
    if (
      error?.status === 401 ||
      error?.status === 403 ||
      error?.isAuthError
    ) {
      throw error;
    }

    console.warn(
      'Could not fetch stripe-key from backend, checking environment fallback:',
      error?.message
    );
  }

  /**
   * Environment fallback.
   */
  return (
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    null
  );
};

/**
 * ============================================================
 * CREATE PAYMENT INTENT
 * ============================================================
 */

/**
 * POST /api/billing/create-payment-intent
 *
 * Body:
 * {
 *   "Plancode": "basic" | "pro"
 * }
 */
export const createPaymentIntent = async (
  plancode
) => {
  const normalizedCode = (
    plancode || 'basic'
  )
    .toLowerCase()
    .trim();

  const response = await authenticatedFetch(
    BILLING_ENDPOINTS.CREATE_PAYMENT_INTENT,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        Plancode: normalizedCode,
      }),
    }
  );

  /**
   * Backend response:
   * {
   *   clientSecret: "pi_..."
   * }
   */
  if (
    typeof response === 'object' &&
    response?.clientSecret
  ) {
    return response.clientSecret;
  }

  /**
   * Some backends may return the secret directly.
   */
  if (
    typeof response === 'string' &&
    response.includes('_secret_')
  ) {
    return response.trim();
  }

  throw new Error(
    'Backend did not return a valid clientSecret for PaymentIntent creation.'
  );
};

/**
 * ============================================================
 * CONFIRM BACKEND PAYMENT
 * ============================================================
 */

/**
 * POST /api/billing/confirm-payment
 *
 * Body:
 * {
 *   "PaymentIntentId": "pi_..."
 * }
 */
export const confirmBackendPayment = async (
  paymentIntentId
) => {
  if (!paymentIntentId) {
    throw new Error(
      'PaymentIntent ID is missing for backend confirmation.'
    );
  }

  return await authenticatedFetch(
    BILLING_ENDPOINTS.CONFIRM_PAYMENT,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        PaymentIntentId: paymentIntentId,
      }),
    }
  );
};

/**
 * ============================================================
 * BILLING STATUS
 * ============================================================
 */

/**
 * GET /api/billing/status
 *
 * Supports:
 * - explicit token
 * - stored token
 * - automatic refresh
 * - local/session storage
 * - billingStatusUpdated event
 */
export const getBillingStatus = async (
  token = null
) => {
  let data;

  /**
   * Explicit token flow.
   */
  if (token) {
    const cleanToken = sanitizeToken(token);

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',

      ...(cleanToken
        ? {
            Authorization: `Bearer ${cleanToken}`,
          }
        : {}),
    };

    const response = await fetch(
      BILLING_ENDPOINTS.STATUS,
      {
        method: 'GET',
        headers,
      }
    );

    const text = await response
      .text()
      .catch(() => '');

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        message: text,
      };
    }

    if (!response.ok) {
      const error = new Error(
        data?.message ||
          data?.error ||
          `Status failed (${response.status})`
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }
  } else {
    /**
     * Stored token flow with automatic refresh.
     */
    data = await authenticatedFetch(
      BILLING_ENDPOINTS.STATUS,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Normalize billing information.
   *
   * Preserve any additional backend fields
   * using ...data.
   */
  const billingInfo = {
    hasPlan: Boolean(data?.hasPlan),

    planName:
      data?.planName ||
      (data?.hasPlan
        ? 'Active Plan'
        : 'No active plan'),

    applicationAllowance:
      typeof data?.applicationAllowance ===
      'number'
        ? data.applicationAllowance
        : typeof data?.remainingApplications ===
            'number'
          ? data.remainingApplications
          : 0,

    usedApplications:
      typeof data?.usedApplications ===
      'number'
        ? data.usedApplications
        : 0,

    remainingApplications:
      typeof data?.remainingApplications ===
      'number'
        ? data.remainingApplications
        : 0,

    billingInterval:
      data?.billingInterval || 'month',

    /**
     * Preserve all backend fields.
     */
    ...(typeof data === 'object'
      ? data
      : {}),
  };

  /**
   * Persist billing status.
   */
  try {
    const storage =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken')
        ? localStorage
        : sessionStorage;

    storage.setItem(
      'billingStatus',
      JSON.stringify(billingInfo)
    );

    storage.setItem(
      'hasPlan',
      String(Boolean(data?.hasPlan))
    );
  } catch {
    /**
     * Storage fail-safe.
     */
  }

  /**
   * Notify application about billing update.
   */
  if (
    typeof window !== 'undefined'
  ) {
    try {
      window.dispatchEvent(
        new CustomEvent(
          'billingStatusUpdated',
          {
            detail: billingInfo,
          }
        )
      );
    } catch {
      /**
       * Event dispatch fail-safe.
       */
    }
  }

  return billingInfo;
};

/**
 * ============================================================
 * BILLING HISTORY
 * ============================================================
 */

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
    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        (typeof data === 'string' && data ? data : '') ||
        `Failed to fetch billing history (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }
    return Array.isArray(data) ? data : (data?.history || data?.data || []);
  }

  const data = await authenticatedFetch(BILLING_ENDPOINTS.HISTORY, {
    method: 'GET',
  });

  return Array.isArray(data) ? data : (data?.history || data?.data || []);
};

/**
 * ============================================================
 * CARD UPDATE SETUPINTENT
 * ============================================================
 */

/**
 * Create Card Update SetupIntent
 * POST /api/billing/create-card-update-intent
 * Response: { "clientSecret": "seti_..._secret_..." }
 * @param {string} [token] - Optional explicit access token
 * @returns {Promise<string>} clientSecret string
 */
export const createCardUpdateIntent = async (token = null) => {
  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${cleanToken}`,
    };
    const response = await fetch(BILLING_ENDPOINTS.CREATE_CARD_UPDATE_INTENT, {
      method: 'POST',
      headers,
    });
    const text = await response.text().catch(() => '');
    let res;
    try {
      res = JSON.parse(text);
    } catch {
      res = { message: text };
    }
    if (!response.ok) {
      const error = new Error(res?.message || res?.error || `Failed to create card update intent (Status ${response.status})`);
      error.status = response.status;
      throw error;
    }
    if (typeof res === 'object' && res?.clientSecret) return res.clientSecret;
    if (typeof res === 'string' && res.includes('_secret_')) return res.trim();
    if (typeof res === 'object' && res?.data?.clientSecret) return res.data.clientSecret;
    throw new Error('Backend did not return a valid clientSecret for card update.');
  }

  const res = await authenticatedFetch(BILLING_ENDPOINTS.CREATE_CARD_UPDATE_INTENT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (typeof res === 'object' && res?.clientSecret) {
    return res.clientSecret;
  }
  if (typeof res === 'string' && res.includes('_secret_')) {
    return res.trim();
  }
  if (typeof res === 'object' && res?.data?.clientSecret) {
    return res.data.clientSecret;
  }
  throw new Error('Backend did not return a valid clientSecret for card update.');
};

/**
 * ============================================================
 * CONFIRM CARD UPDATE
 * ============================================================
 */

/**
 * Confirm Card Update
 * POST /api/billing/confirm-card-update
 * Body: { "setupIntentId": "seti_..." }
 * @param {string} setupIntentId
 * @param {string} [token] - Optional explicit access token
 */
export const confirmCardUpdate = async (setupIntentId, token = null) => {
  if (!setupIntentId) {
    throw new Error('SetupIntent ID is required for card update confirmation.');
  }

  const payload = {
    setupIntentId: setupIntentId?.trim(),
    SetupIntentId: setupIntentId?.trim(),
  };

  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${cleanToken}`,
    };
    const response = await fetch(BILLING_ENDPOINTS.CONFIRM_CARD_UPDATE, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `Failed to confirm card update (Status ${response.status})`);
      error.status = response.status;
      throw error;
    }
    return {
      success: true,
      message: data?.message || 'Card updated successfully.',
      data,
    };
  }

  const data = await authenticatedFetch(BILLING_ENDPOINTS.CONFIRM_CARD_UPDATE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return {
    success: true,
    message: typeof data === 'object' ? data?.message || 'Card updated successfully.' : String(data),
    data,
  };
};

/**
 * ============================================================
 * GET SAVED PAYMENT METHOD
 * ============================================================
 */

/**
 * Get Saved Payment Method
 * GET /api/billing/payment-method
 * Response: { "brand": "visa", "last4": "4242", "expMonth": 4, "expYear": 2029 } or similar
 * @param {string} [token] - Optional explicit access token
 */
export const getPaymentMethod = async (token = null) => {
  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${cleanToken}`,
    };
    const response = await fetch(BILLING_ENDPOINTS.PAYMENT_METHOD, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      const text = await response.text().catch(() => '');
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text };
      }
      const error = new Error(errorData?.message || `Failed to fetch payment method (Status ${response.status})`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  }

  try {
    const data = await authenticatedFetch(BILLING_ENDPOINTS.PAYMENT_METHOD, {
      method: 'GET',
    });
    return data;
  } catch (err) {
    if (err?.status === 404) {
      return null;
    }
    throw err;
  }
};

/**
 * ============================================================
 * RECOVERY FLOW
 * ============================================================
 */

/**
 * Recovery Flow
 * POST /api/billing/recover
 */
export const recoverBilling = async () => {
  return await authenticatedFetch(
    BILLING_ENDPOINTS.RECOVER,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

/**
 * ============================================================
 * SELECT TRIAL PLAN
 * ============================================================
 */

/**
 * POST /api/billing/select-trial
 */
export const selectTrialPlan = async () => {
  return await authenticatedFetch(
    BILLING_ENDPOINTS.SELECT_TRIAL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

/**
 * ============================================================
 * TOGGLE AUTO-PAY
 * ============================================================
 */

/**
 * POST /api/billing/toggle-autopay
 *
 * Body:
 * {
 *   "enabled": true | false
 * }
 */
export const toggleAutopay = async (
  enabled,
  token = null
) => {
  const isEnabled = Boolean(enabled);
  const body = JSON.stringify({
    enabled: isEnabled,
  });

  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {}),
    };

    const response = await fetch(BILLING_ENDPOINTS.TOGGLE_AUTOPAY, {
      method: 'POST',
      headers,
      body,
    });

    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      const error = new Error(
        data?.message || data?.error || `Failed to update auto-pay setting (Status ${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return {
      success: true,
      enabled: isEnabled,
      message: data?.message || 'Auto-pay updated.',
      data,
    };
  }

  const data = await authenticatedFetch(BILLING_ENDPOINTS.TOGGLE_AUTOPAY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  return {
    success: true,
    enabled: isEnabled,
    message: typeof data === 'object' ? data?.message || 'Auto-pay updated.' : String(data),
    data,
  };
};

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  /**
   * Authentication
   */
  getStoredAuthToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
  refreshAuthToken,
  authenticatedFetch,

  /**
   * Billing
   */
  getBillingPlans,
  getStripePublishableKey,
  createPaymentIntent,
  confirmBackendPayment,
  getBillingStatus,
  getBillingHistory,

  /**
   * Subscription / recovery
   */
  recoverBilling,
  selectTrialPlan,
  toggleAutopay,

  /**
   * Card management
   */
  createCardUpdateIntent,
  confirmCardUpdate,
  getPaymentMethod,
};
