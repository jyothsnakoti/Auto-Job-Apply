import { PROFILE_ENDPOINTS, API_BASE_URL } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';

/**
 * Update Personal Information
 * PATCH /api/profile/personal
 * @param {Object} data - { fullName, phone, linkedinUrl }
 * @param {string} [token] - Optional explicit access token
 */
export const updatePersonalProfile = async (data = {}, token = null) => {
  try {
    const url = PROFILE_ENDPOINTS?.UPDATE_PERSONAL || `${API_BASE_URL}/api/profile/personal`;
    const accessToken = token || getStoredTokens().accessToken;

    const payload = {
      fullName: data.fullName !== undefined ? data.fullName : (data.name || ''),
      phone: data.phone !== undefined ? data.phone : (data.phoneNumber || ''),
      linkedinUrl: data.linkedinUrl !== undefined ? data.linkedinUrl : (data.linkedin || ''),
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
        `Failed to update personal information (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = resData;
      throw error;
    }

    return resData;
  } catch (error) {
    console.error('Update personal profile error:', error);
    throw error;
  }
};

export default {
  updatePersonalProfile,
};
