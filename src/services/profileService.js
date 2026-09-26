import { PROFILE_ENDPOINTS, ONBOARDING_ENDPOINTS, API_BASE_URL } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';

/**
 * Fetch Onboarding Profile details
 * GET /api/onboarding
 * @param {string} [token] - Optional explicit access token
 */
export const getOnboardingProfile = async (token = null) => {
  try {
    const url = PROFILE_ENDPOINTS.GET || ONBOARDING_ENDPOINTS.GET || `${API_BASE_URL}/api/onboarding`;
    const accessToken = token || getStoredTokens().accessToken;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    let response;
    if (token) {
      response = await fetch(url, {
        method: 'GET',
        headers,
      });
    } else {
      response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
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
        (typeof data === 'string' && data ? data : '') ||
        `Failed to fetch onboarding profile (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Fetch onboarding profile error:', error);
    throw error;
  }
};

export { updatePersonalProfile } from './personalProfileService';
export { updateLocationProfile } from './locationProfileService';
export { updateProfileSettings } from './settingsProfileService';
export { updateWorkPreferencesProfile } from './workPreferencesProfileService';
import { updatePersonalProfile } from './personalProfileService';
import { updateLocationProfile } from './locationProfileService';
import { updateProfileSettings } from './settingsProfileService';
import { updateWorkPreferencesProfile } from './workPreferencesProfileService';

export default {
  getOnboardingProfile,
  updatePersonalProfile,
  updateLocationProfile,
  updateProfileSettings,
  updateWorkPreferencesProfile,
};
