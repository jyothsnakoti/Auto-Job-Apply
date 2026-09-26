import { BILLING_ENDPOINTS } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';

/**
 * Retrieve the stored auth token from localStorage or sessionStorage
 */
export const getAuthToken = () => {
  return getStoredTokens().accessToken;
};

// In-flight request deduplication cache to prevent duplicate concurrent network calls
let inFlightPromise = null;

/**
 * Fetch available billing plans (only once per concurrent request)
 * GET /api/billing/plans
 * @param {string} [token] - Optional explicit access token. If omitted, uses stored token.
 * @param {boolean} [forceRefresh=false] - If true, bypasses in-flight request cache
 * @returns {Promise<Array>} Array of plan objects
 */
export const getBillingPlans = async (token = null, forceRefresh = false) => {
  if (inFlightPromise && !forceRefresh) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const accessToken = token || getStoredTokens().accessToken;

      console.log('📡 [BillingPlans API] Requesting plans from:', BILLING_ENDPOINTS.PLANS);
      console.log('🔑 [BillingPlans API] Auth token present:', Boolean(accessToken));

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      let response;
      if (token) {
        response = await fetch(BILLING_ENDPOINTS.PLANS, {
          method: 'GET',
          headers,
        });
      } else {
        response = await fetchWithAuth(BILLING_ENDPOINTS.PLANS, {
          method: 'GET',
          headers,
        });
      }

      console.log(`📥 [BillingPlans API] Response Status: ${response.status} ${response.statusText}`);

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
          `Failed to fetch billing plans (Status ${response.status})`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        console.error('❌ [BillingPlans API] Error:', error);
        throw error;
      }

      const plansArray = Array.isArray(data) ? data : (data.plans || data.data || []);
      console.log(`✅ [BillingPlans API] Loaded ${plansArray.length} plans:`, plansArray);
      return plansArray;
    } catch (error) {
      console.error('❌ [BillingPlans API] Fetch failed:', error);
      throw error;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};

/**
 * Activate the one time free trial without card details
 * POST /api/billing/select-trial
 * Request body: none
 * @param {string} [token] - Optional explicit access token. If omitted, uses stored token.
 * @returns {Promise<{ success: boolean, message: string, data: any }>}
 */
export const selectTrialPlan = async (token = null) => {
  try {
    const accessToken = token || getStoredTokens().accessToken;

    console.log('📡 [BillingPlans API] POST to activate Free Trial:', BILLING_ENDPOINTS.SELECT_TRIAL);
    console.log('🔑 [BillingPlans API] Access Token attached:', Boolean(accessToken));

    const headers = {
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    let response;
    if (token) {
      response = await fetch(BILLING_ENDPOINTS.SELECT_TRIAL, {
        method: 'POST',
        headers,
      });
    } else {
      response = await fetchWithAuth(BILLING_ENDPOINTS.SELECT_TRIAL, {
        method: 'POST',
        headers,
      });
    }

    console.log(`📥 [BillingPlans API] Select Trial Status: ${response.status} ${response.statusText}`);

    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    const message = typeof data === 'string' ? data : (data?.message || data?.error || text || '');
    console.log('📦 [BillingPlans API] Select Trial Payload:', message || data);

    if (!response.ok) {
      const errorMessage = message || `Failed to activate free trial (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      console.error('❌ [BillingPlans API] Select Trial Error:', error);
      throw error;
    }

    console.log('✅ [BillingPlans API] Free trial activated successfully:', message);
    return {
      success: true,
      message: message || 'Free trial activated. 10 applications available.',
      data,
    };
  } catch (error) {
    console.error('❌ [BillingPlans API] Select Trial Exception:', error);
    throw error;
  }
};

export const selectTrial = selectTrialPlan;

/**
 * Create a Stripe PaymentIntent for a paid plan
 * POST /api/billing/create-payment-intent
 * Request body: { "Plancode": "basic" | "pro" } (Note: uppercase 'P' in Plancode)
 * @param {string} plancode - "basic" or "pro"
 * @param {string} [token] - Optional explicit access token. If omitted, uses stored token.
 * @returns {Promise<{ clientSecret: string, ... }>}
 */
export const createPaymentIntent = async (plancode, token = null) => {
  try {
    const accessToken = token || getStoredTokens().accessToken;
    const cleanPlancode = (plancode || '').toLowerCase().trim();

    console.log(`📡 [BillingPlans API] Creating PaymentIntent for plan: "${cleanPlancode}" at:`, BILLING_ENDPOINTS.CREATE_PAYMENT_INTENT);
    console.log('🔑 [BillingPlans API] Access Token attached:', Boolean(accessToken));

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    // Note: JSON key is exactly "Plancode" with uppercase P as declared in the Java record
    const body = JSON.stringify({
      Plancode: cleanPlancode,
    });

    console.log('📤 [BillingPlans API] Create PaymentIntent Request Body:', body);

    let response;
    if (token) {
      response = await fetch(BILLING_ENDPOINTS.CREATE_PAYMENT_INTENT, {
        method: 'POST',
        headers,
        body,
      });
    } else {
      response = await fetchWithAuth(BILLING_ENDPOINTS.CREATE_PAYMENT_INTENT, {
        method: 'POST',
        headers,
        body,
      });
    }

    console.log(`📥 [BillingPlans API] Create PaymentIntent Status: ${response.status} ${response.statusText}`);

    const text = await response.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    console.log('📦 [BillingPlans API] Create PaymentIntent Payload:', data);

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        text ||
        `Failed to create payment intent (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      console.error('❌ [BillingPlans API] Create PaymentIntent Error:', error);
      throw error;
    }

    console.log('✅ [BillingPlans API] PaymentIntent created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ [BillingPlans API] Create PaymentIntent Exception:', error);
    throw error;
  }
};

export default {
  getBillingPlans,
  selectTrialPlan,
  selectTrial,
  createPaymentIntent,
  getAuthToken,
};
