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
  refreshAuthToken,
  fetchWithAuth,
  authenticatedFetch,
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

export { refreshAuthToken, authenticatedFetch, fetchWithAuth };

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
  const isPlanActive = Boolean(
    data === true ||
    data?.hasPlan === true ||
    data?.has_plan === true ||
    data?.status === true ||
    data?.isSubscribed === true ||
    data?.active === true ||
    data?.planActive === true ||
    data?.subscriptionActive === true ||
    (typeof data?.status === 'string' &&
      ['active', 'true', 'subscribed', 'paid'].includes(data.status.toLowerCase()))
  );

  const billingInfo = {
    hasPlan: isPlanActive,
    status: isPlanActive,

    planName:
      data?.planName ||
      (isPlanActive
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
 * Body: { "setupIntentId": "seti_...", "makeDefault": false }
 * @param {string} setupIntentId
 * @param {boolean} [makeDefault=false]
 * @param {string} [token] - Optional explicit access token
 */
export const confirmCardUpdate = async (setupIntentId, makeDefault = false, token = null) => {
  if (!setupIntentId) {
    throw new Error('SetupIntent ID is required for card update confirmation.');
  }

  let isDefaultVal = false;
  let explicitToken = null;

  if (typeof makeDefault === 'boolean') {
    isDefaultVal = makeDefault;
    explicitToken = token;
  } else if (typeof makeDefault === 'string') {
    explicitToken = makeDefault;
    isDefaultVal = false;
  }

  const payload = {
    setupIntentId: setupIntentId?.trim(),
    makeDefault: Boolean(isDefaultVal),
  };

  if (explicitToken) {
    const cleanToken = sanitizeToken(explicitToken);
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
 * GET SAVED PAYMENT CARDS / METHOD
 * ============================================================
 */

/**
 * Safely extract payment method object from response
 */
const extractPaymentMethod = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    return data.find((item) => item?.isDefault) || data[0] || null;
  }
  if (typeof data === 'object') {
    if (Array.isArray(data.cards)) {
      if (data.cards.length === 0) return null;
      return data.cards.find((c) => c?.isDefault) || data.cards[0] || null;
    }
    if (Array.isArray(data.data)) {
      if (data.data.length === 0) return null;
      return data.data.find((c) => c?.isDefault) || data.data[0] || null;
    }
    if (data.last4 || data.brand || data.id) {
      return data;
    }
  }
  return null;
};

/**
 * Get Saved Payment Cards
 * GET /api/billing/cards
 * @param {string} [token] - Optional explicit access token
 */
export const getSavedCards = async (token = null) => {
  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${cleanToken}`,
    };
    try {
      const response = await fetch(BILLING_ENDPOINTS.CARDS, {
        method: 'GET',
        headers,
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 400 || response.status === 403) return [];
        const text = await response.text().catch(() => '');
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { message: text };
        }
        const error = new Error(errorData?.message || `Failed to fetch cards (Status ${response.status})`);
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.cards || data?.data || (data ? [data] : []));
    } catch (err) {
      if (err?.status === 404 || err?.status === 400 || err?.status === 403) return [];
      throw err;
    }
  }

  try {
    const data = await authenticatedFetch(BILLING_ENDPOINTS.CARDS, {
      method: 'GET',
    });
    return Array.isArray(data)
      ? data
      : data?.cards || data?.data || (data && typeof data === 'object' && Object.keys(data).length > 0 ? [data] : []);
  } catch (err) {
    if (err?.status === 404 || err?.status === 400 || err?.status === 403) {
      return [];
    }
    // Fallback to PAYMENT_METHOD endpoint
    try {
      const fallback = await authenticatedFetch(BILLING_ENDPOINTS.PAYMENT_METHOD, { method: 'GET' });
      return Array.isArray(fallback)
        ? fallback
        : fallback?.cards || (fallback && typeof fallback === 'object' && Object.keys(fallback).length > 0 ? [fallback] : []);
    } catch {
      return [];
    }
  }
};

export const getPaymentCards = getSavedCards;

/**
 * Get Saved Payment Method
 * GET /api/billing/payment-method
 * Retrieves the default card or first saved card from array response
 * @param {string} [token] - Optional explicit access token
 */
export const getPaymentMethod = async (token = null) => {
  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${cleanToken}`,
    };
    try {
      const response = await fetch(BILLING_ENDPOINTS.PAYMENT_METHOD, {
        method: 'GET',
        headers,
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 400 || response.status === 403) return null;
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
      const data = await response.json();
      return extractPaymentMethod(data);
    } catch (err) {
      if (err?.status === 404 || err?.status === 400 || err?.status === 403) return null;
      throw err;
    }
  }

  try {
    const data = await authenticatedFetch(BILLING_ENDPOINTS.PAYMENT_METHOD, {
      method: 'GET',
    });
    return extractPaymentMethod(data);
  } catch (err) {
    if (err?.status === 404 || err?.status === 400 || err?.status === 403) {
      return null;
    }
    // Also try CARDS endpoint fallback
    try {
      const fallbackData = await authenticatedFetch(BILLING_ENDPOINTS.CARDS, { method: 'GET' });
      return extractPaymentMethod(fallbackData);
    } catch {
      return null;
    }
  }
};

/**
 * Set Default Payment Card
 * POST /api/billing/cards/default
 * Body: { "paymentMethodId": "pm_xxx" }
 * @param {string} paymentMethodId
 * @param {string} [token] - Optional explicit access token
 */
export const setDefaultCard = async (paymentMethodId, token = null) => {
  if (!paymentMethodId) {
    throw new Error('PaymentMethod ID is required to set default card.');
  }

  const payload = {
    paymentMethodId: paymentMethodId?.trim(),
    PaymentMethodId: paymentMethodId?.trim(),
  };

  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${cleanToken}`,
    };
    const response = await fetch(BILLING_ENDPOINTS.DEFAULT_CARD, {
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
      const error = new Error(data?.message || data?.error || `Failed to set default card (Status ${response.status})`);
      error.status = response.status;
      throw error;
    }
    return {
      success: true,
      message: data?.message || 'Default payment method updated.',
      data,
    };
  }

  const data = await authenticatedFetch(BILLING_ENDPOINTS.DEFAULT_CARD, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return {
    success: true,
    message: typeof data === 'object' ? data?.message || 'Default payment method updated.' : String(data),
    data,
  };
};

/**
 * Delete Saved Payment Card
 * DELETE /api/billing/cards/{paymentMethodId}
 * @param {string} paymentMethodId
 * @param {string} [token] - Optional explicit access token
 */
export const deleteSavedCard = async (paymentMethodId, token = null) => {
  if (!paymentMethodId) {
    throw new Error('PaymentMethod ID is required to delete card.');
  }

  const endpoint = `${BILLING_ENDPOINTS.CARDS}/${encodeURIComponent(paymentMethodId.trim())}`;

  if (token) {
    const cleanToken = sanitizeToken(token);
    const headers = {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${cleanToken}`,
    };
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers,
    });
    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `Failed to delete card (Status ${response.status})`);
      error.status = response.status;
      throw error;
    }
    return {
      success: true,
      message: data?.message || 'Card deleted successfully.',
      data,
    };
  }

  const data = await authenticatedFetch(endpoint, {
    method: 'DELETE',
  });

  return {
    success: true,
    message: typeof data === 'object' ? data?.message || 'Card deleted successfully.' : String(data),
    data,
  };
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
  getSavedCards,
  getPaymentCards,
  getPaymentMethod,
  setDefaultCard,
  deleteSavedCard,
};
