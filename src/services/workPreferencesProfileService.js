import { PROFILE_ENDPOINTS, API_BASE_URL } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';

/**
 * Format string values to server representation
 */
const formatPreferenceValue = (val, defaultVal = 'yes') => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (val === true) return 'yes';
  if (val === false) return 'no';
  const str = String(val).trim().toLowerCase();
  if (str === 'yes') return 'yes';
  if (str === 'no') return 'no';
  if (str.includes('prefer not') || str.includes('prefer_not')) return 'prefer_not_to_say';
  if (str.includes('hybrid')) return 'hybrid';
  if (str.includes('2 weeks') || str.includes('2_weeks') || str.includes('2-weeks')) return '2_weeks_notice';
  if (str.includes('1 month') || str.includes('1_month') || str.includes('1-month')) return '1_month_notice';
  if (str.includes('public')) return 'public_transit';
  return str;
};

/**
 * Update Work Preferences
 * PATCH /api/profile/work-preferences
 * @param {Object} data - { openToInPerson, canStartImmediately, reliableTransportation, workplaceAccommodations }
 * @param {string} [token] - Optional explicit access token
 */
export const updateWorkPreferencesProfile = async (data = {}, token = null) => {
  try {
    const url =
      PROFILE_ENDPOINTS?.UPDATE_WORK_PREFERENCES ||
      `${API_BASE_URL}/api/profile/work-preferences`;
    const accessToken = token || getStoredTokens().accessToken;

    const payload = {
      openToInPerson: formatPreferenceValue(
        data.openToInPerson || data.inPersonWork,
        'yes'
      ),
      canStartImmediately: formatPreferenceValue(
        data.canStartImmediately || data.startImmediately,
        'no'
      ),
      reliableTransportation: formatPreferenceValue(
        data.reliableTransportation,
        'yes'
      ),
      workplaceAccommodations: formatPreferenceValue(
        data.workplaceAccommodations || data.needAccommodations,
        'prefer_not_to_say'
      ),
    };

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    let response;
    if (token) {
      response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      response = await fetchWithAuth(url, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
        body: JSON.stringify(payload),
      });
    }

    const text = await response.text().catch(() => '');
    let resData;
    try {
      resData = JSON.parse(text);
    } catch {
      resData = { message: text };
    }

    if (!response.ok) {
      const errorMessage =
        resData?.message ||
        resData?.error ||
        (typeof resData === 'string' && resData ? resData : '') ||
        `Failed to update work preferences (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = resData;
      throw error;
    }

    return resData;
  } catch (error) {
    console.error('Update work preferences error:', error);
    throw error;
  }
};

export default {
  updateWorkPreferencesProfile,
};
