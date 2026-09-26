import { BILLING_ENDPOINTS } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';

/**
 * Fetch Billing Status
 * GET /api/billing/status
 * @param {string} [token] - Optional explicit access token. If omitted, uses stored token.
 * @returns {Promise<{ remainingApplications: number, hasPlan: boolean }>}
 */
export const getBillingStatus = async (token = null) => {
  try {
    const accessToken = token || getStoredTokens().accessToken;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    let response;
    if (token) {
      // Use direct fetch if specific token was passed
      response = await fetch(BILLING_ENDPOINTS.STATUS, {
        method: 'GET',
        headers,
      });
    } else {
      // Use fetchWithAuth for automatic token refresh on 401
      response = await fetchWithAuth(BILLING_ENDPOINTS.STATUS, {
        method: 'GET',
        headers,
      });
    }

    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        text ||
        `Failed to fetch billing status (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    // Persist billing status in storage
    const billingInfo = {
      hasPlan: Boolean(data.hasPlan),
      remainingApplications: typeof data.remainingApplications === 'number' ? data.remainingApplications : 0,
      ...data,
    };

    try {
      const storage = localStorage.getItem('token') || localStorage.getItem('accessToken') ? localStorage : sessionStorage;
      storage.setItem('billingStatus', JSON.stringify(billingInfo));
      storage.setItem('hasPlan', String(Boolean(data.hasPlan)));
    } catch {
      // Storage access fail-safe
    }

    return billingInfo;
  } catch (error) {
    console.error('Billing status error:', error);
    throw error;
  }
};

/**
 * Enable or disable future automatic charges on an existing subscription
 * POST /api/billing/toggle-autopay
 * Request body: { "enabled": boolean }
 * @param {boolean} enabled - Real boolean (true or false). Note: null/undefined will fail backend Java unboxing.
 * @param {string} [token] - Optional explicit access token. If omitted, uses stored token.
 * @returns {Promise<{ success: boolean, enabled: boolean, message: string }>}
 */
export const toggleAutopay = async (enabled, token = null) => {
  try {
    const accessToken = token || getStoredTokens().accessToken;
    // Strict boolean conversion: Send a real boolean (never null/undefined)
    const isEnabled = Boolean(enabled);

    console.log(`📡 [Billing API] Toggling Auto-pay to: ${isEnabled} at:`, BILLING_ENDPOINTS.TOGGLE_AUTOPAY);
    console.log('🔑 [Billing API] Access Token attached:', Boolean(accessToken));

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const body = JSON.stringify({
      enabled: isEnabled,
    });

    console.log('📤 [Billing API] Toggle Auto-pay Request Body:', body);

    let response;
    if (token) {
      response = await fetch(BILLING_ENDPOINTS.TOGGLE_AUTOPAY, {
        method: 'POST',
        headers,
        body,
      });
    } else {
      response = await fetchWithAuth(BILLING_ENDPOINTS.TOGGLE_AUTOPAY, {
        method: 'POST',
        headers,
        body,
      });
    }

    console.log(`📥 [Billing API] Toggle Auto-pay Status: ${response.status} ${response.statusText}`);

    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    const message = typeof data === 'string' ? data : (data?.message || data?.error || text || '');
    console.log('📦 [Billing API] Toggle Auto-pay Payload:', message || data);

    if (!response.ok) {
      const errorMessage =
        message ||
        `Failed to update auto-pay setting (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      console.error('❌ [Billing API] Toggle Auto-pay Error:', error);
      throw error;
    }

    console.log('✅ [Billing API] Auto-pay updated successfully:', message);
    return {
      success: true,
      enabled: isEnabled,
      message: message || 'Auto-pay updated.',
      data,
    };
  } catch (error) {
    console.error('❌ [Billing API] Toggle Auto-pay Exception:', error);
    throw error;
  }
};

/**
 * Create a Stripe SetupIntent to save a replacement card without charging it
 * POST /api/billing/create-card-update-intent
 * Request body: none
 * @param {string} [token] - Optional explicit access token. If omitted, uses stored token.
 * @returns {Promise<{ clientSecret: string }>}
 */
export const createCardUpdateIntent = async (token = null) => {
  try {
    const accessToken = token || getStoredTokens().accessToken;

    console.log('📡 [Billing API] POST to create card update intent:', BILLING_ENDPOINTS.CREATE_CARD_UPDATE_INTENT);
    console.log('🔑 [Billing API] Access Token attached:', Boolean(accessToken));

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    let response;
    if (token) {
      response = await fetch(BILLING_ENDPOINTS.CREATE_CARD_UPDATE_INTENT, {
        method: 'POST',
        headers,
      });
    } else {
      response = await fetchWithAuth(BILLING_ENDPOINTS.CREATE_CARD_UPDATE_INTENT, {
        method: 'POST',
        headers,
      });
    }

    console.log(`📥 [Billing API] Create Card Update Intent Status: ${response.status} ${response.statusText}`);

    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    console.log('📦 [Billing API] Create Card Update Intent Payload:', data);

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        text ||
        `Failed to create card update intent (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      console.error('❌ [Billing API] Create Card Update Intent Error:', error);
      throw error;
    }

    console.log('✅ [Billing API] Card update intent created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ [Billing API] Create Card Update Intent Exception:', error);
    throw error;
  }
};

/**
 * Register the card from a succeeded SetupIntent against the user's subscription
 * POST /api/billing/confirm-card-update
 * Request body: { "setupIntentId": "seti_..." }
 * @param {string} setupIntentId - Stripe SetupIntent ID (e.g. seti_...)
 * @param {string} [token] - Optional explicit access token. If omitted, uses stored token.
 * @returns {Promise<{ success: boolean, message: string, data: any }>}
 */
export const confirmCardUpdate = async (setupIntentId, token = null) => {
  try {
    const accessToken = token || getStoredTokens().accessToken;

    console.log('📡 [Billing API] POST to confirm card update:', BILLING_ENDPOINTS.CONFIRM_CARD_UPDATE);
    console.log('🔑 [Billing API] Access Token attached:', Boolean(accessToken));

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const body = JSON.stringify({
      setupIntentId: setupIntentId?.trim(),
    });

    console.log('📤 [Billing API] Confirm Card Update Request Body:', body);

    let response;
    if (token) {
      response = await fetch(BILLING_ENDPOINTS.CONFIRM_CARD_UPDATE, {
        method: 'POST',
        headers,
        body,
      });
    } else {
      response = await fetchWithAuth(BILLING_ENDPOINTS.CONFIRM_CARD_UPDATE, {
        method: 'POST',
        headers,
        body,
      });
    }

    console.log(`📥 [Billing API] Confirm Card Update Status: ${response.status} ${response.statusText}`);

    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    const message = typeof data === 'string' ? data : (data?.message || data?.error || text || '');
    console.log('📦 [Billing API] Confirm Card Update Payload:', message || data);

    if (!response.ok) {
      const errorMessage =
        message ||
        `Failed to confirm card update (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      console.error('❌ [Billing API] Confirm Card Update Error:', error);
      throw error;
    }

    console.log('✅ [Billing API] Card updated successfully:', message);
    return {
      success: true,
      message: message || 'Card updated successfully.',
      data,
    };
  } catch (error) {
    console.error('❌ [Billing API] Confirm Card Update Exception:', error);
    throw error;
  }
};

export default {
  getBillingStatus,
  toggleAutopay,
  createCardUpdateIntent,
  confirmCardUpdate,
};


