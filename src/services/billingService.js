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

export default {
  getBillingStatus,
};
