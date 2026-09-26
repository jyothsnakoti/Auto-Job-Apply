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
 * - Billing recovery
 * - Trial plan selection
 * - Auto-pay toggle
 * - Card update SetupIntent
 * - Card update confirmation
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

  /**
   * Response parsing.
   */
  const contentType =
    response.headers.get('content-type') || '';

  const isJson =
    contentType.includes('application/json');

  /**
   * Handle HTTP errors.
   */
  if (!response.ok) {
    let errorMessage =
      `Request failed (Status ${response.status})`;

    let errorData = null;

    try {
      if (isJson) {
        errorData = await response.json();

        errorMessage =
          errorData?.message ||
          errorData?.error ||
          errorMessage;
      } else {
        const errorText = await response.text();

        if (errorText) {
          errorMessage = errorText;
        }
      }
    } catch {
      // Keep default error message.
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
    error.data = errorData;

    throw error;
  }

  /**
   * Return parsed response.
   */
  if (isJson) {
    return await response.json();
  }

  return await response.text();
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
  try {
    const accessToken =
      sanitizeToken(token) ||
      getStoredAuthToken();

    /**
     * Always send a real boolean.
     */
    const isEnabled = Boolean(enabled);

    console.log(
      `[Billing API] Toggling Auto-pay to: ${isEnabled} at:`,
      BILLING_ENDPOINTS.TOGGLE_AUTOPAY
    );

    console.log(
      '[Billing API] Access Token attached:',
      Boolean(accessToken)
    );

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',

      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    };

    const body = JSON.stringify({
      enabled: isEnabled,
    });

    console.log(
      '[Billing API] Toggle Auto-pay Request Body:',
      body
    );

    let response;

    /**
     * Explicit token:
     * direct fetch.
     */
    if (token) {
      response = await fetch(
        BILLING_ENDPOINTS.TOGGLE_AUTOPAY,
        {
          method: 'POST',
          headers,
          body,
        }
      );
    } else {
      /**
       * Stored token:
       * authenticatedFetch handles refresh.
       */
      response = await fetchWithAuth(
        BILLING_ENDPOINTS.TOGGLE_AUTOPAY,
        {
          method: 'POST',
          headers,
          body,
        }
      );
    }

    console.log(
      `[Billing API] Toggle Auto-pay Status: ${response.status} ${response.statusText}`
    );

    const text = await response
      .text()
      .catch(() => '');

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        message: text,
      };
    }

    const message =
      typeof data === 'string'
        ? data
        : data?.message ||
          data?.error ||
          text ||
          '';

    console.log(
      '[Billing API] Toggle Auto-pay Payload:',
      message || data
    );

    if (!response.ok) {
      const errorMessage =
        message ||
        `Failed to update auto-pay setting (Status ${response.status})`;

      const error = new Error(
        errorMessage
      );

      error.status = response.status;
      error.data = data;

      console.error(
        '[Billing API] Toggle Auto-pay Error:',
        error
      );

      throw error;
    }

    console.log(
      '[Billing API] Auto-pay updated successfully:',
      message
    );

    return {
      success: true,
      enabled: isEnabled,
      message:
        message || 'Auto-pay updated.',
      data,
    };
  } catch (error) {
    console.error(
      '[Billing API] Toggle Auto-pay Exception:',
      error
    );

    throw error;
  }
};

/**
 * ============================================================
 * CREATE CARD UPDATE INTENT
 * ============================================================
 */

/**
 * POST /api/billing/create-card-update-intent
 *
 * Creates Stripe SetupIntent.
 *
 * No payment is charged.
 */
export const createCardUpdateIntent = async (
  token = null
) => {
  try {
    const accessToken =
      sanitizeToken(token) ||
      getStoredAuthToken();

    console.log(
      '[Billing API] POST to create card update intent:',
      BILLING_ENDPOINTS.CREATE_CARD_UPDATE_INTENT
    );

    console.log(
      '[Billing API] Access Token attached:',
      Boolean(accessToken)
    );

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',

      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    };

    let response;

    if (token) {
      response = await fetch(
        BILLING_ENDPOINTS.CREATE_CARD_UPDATE_INTENT,
        {
          method: 'POST',
          headers,
        }
      );
    } else {
      response = await fetchWithAuth(
        BILLING_ENDPOINTS.CREATE_CARD_UPDATE_INTENT,
        {
          method: 'POST',
          headers,
        }
      );
    }

    console.log(
      `[Billing API] Create Card Update Intent Status: ${response.status} ${response.statusText}`
    );

    const text = await response
      .text()
      .catch(() => '');

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        message: text,
      };
    }

    console.log(
      '[Billing API] Create Card Update Intent Payload:',
      data
    );

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        text ||
        `Failed to create card update intent (Status ${response.status})`;

      const error = new Error(
        errorMessage
      );

      error.status = response.status;
      error.data = data;

      console.error(
        '[Billing API] Create Card Update Intent Error:',
        error
      );

      throw error;
    }

    console.log(
      '[Billing API] Card update intent created successfully:',
      data
    );

    return data;
  } catch (error) {
    console.error(
      '[Billing API] Create Card Update Intent Exception:',
      error
    );

    throw error;
  }
};

/**
 * ============================================================
 * CONFIRM CARD UPDATE
 * ============================================================
 */

/**
 * POST /api/billing/confirm-card-update
 *
 * Body:
 * {
 *   "setupIntentId": "seti_..."
 * }
 */
export const confirmCardUpdate = async (
  setupIntentId,
  token = null
) => {
  try {
    if (!setupIntentId) {
      throw new Error(
        'SetupIntent ID is required for card update.'
      );
    }

    const accessToken =
      sanitizeToken(token) ||
      getStoredAuthToken();

    console.log(
      '[Billing API] POST to confirm card update:',
      BILLING_ENDPOINTS.CONFIRM_CARD_UPDATE
    );

    console.log(
      '[Billing API] Access Token attached:',
      Boolean(accessToken)
    );

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',

      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    };

    const body = JSON.stringify({
      setupIntentId:
        setupIntentId?.trim(),
    });

    console.log(
      '[Billing API] Confirm Card Update Request Body:',
      body
    );

    let response;

    if (token) {
      response = await fetch(
        BILLING_ENDPOINTS.CONFIRM_CARD_UPDATE,
        {
          method: 'POST',
          headers,
          body,
        }
      );
    } else {
      response = await fetchWithAuth(
        BILLING_ENDPOINTS.CONFIRM_CARD_UPDATE,
        {
          method: 'POST',
          headers,
          body,
        }
      );
    }

    console.log(
      `[Billing API] Confirm Card Update Status: ${response.status} ${response.statusText}`
    );

    const text = await response
      .text()
      .catch(() => '');

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        message: text,
      };
    }

    const message =
      typeof data === 'string'
        ? data
        : data?.message ||
          data?.error ||
          text ||
          '';

    console.log(
      '[Billing API] Confirm Card Update Payload:',
      message || data
    );

    if (!response.ok) {
      const errorMessage =
        message ||
        `Failed to confirm card update (Status ${response.status})`;

      const error = new Error(
        errorMessage
      );

      error.status = response.status;
      error.data = data;

      console.error(
        '[Billing API] Confirm Card Update Error:',
        error
      );

      throw error;
    }

    console.log(
      '[Billing API] Card updated successfully:',
      message
    );

    return {
      success: true,

      message:
        message ||
        'Card updated successfully.',

      data,
    };
  } catch (error) {
    console.error(
      '[Billing API] Confirm Card Update Exception:',
      error
    );

    throw error;
  }
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
};
  


