import { PROFILE_ENDPOINTS, API_BASE_URL } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';

/**
 * Update Location & Work Authorization
 * PATCH /api/profile/location
 * @param {Object} data - { addressLine1, city, state, postcode, countyDistrict, country, willingToRelocate }
 * @param {string} [token] - Optional explicit access token
 */
export const updateLocationProfile = async (data = {}, token = null) => {
  try {
    const url = PROFILE_ENDPOINTS?.UPDATE_LOCATION || `${API_BASE_URL}/api/profile/location`;
    const accessToken = token || getStoredTokens().accessToken;

    let willingToRelocateVal = 'yes';
    if (typeof data.willingToRelocate === 'boolean') {
      willingToRelocateVal = data.willingToRelocate ? 'yes' : 'no';
    } else if (typeof data.willingToRelocate === 'string') {
      willingToRelocateVal = data.willingToRelocate.toLowerCase() === 'no' ? 'no' : 'yes';
    } else if (typeof data.openToRelocate === 'string') {
      willingToRelocateVal = data.openToRelocate.toLowerCase() === 'no' ? 'no' : 'yes';
    }

    const payload = {
      addressLine1: data.addressLine1 || data.address || '',
      city: data.city || '',
      state: data.state || '',
      postcode: data.postcode || data.postalCode || data.zip || '',
      countyDistrict: data.countyDistrict || data.district || '',
      country: data.country || 'India',
      willingToRelocate: willingToRelocateVal,
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
        `Failed to update location & work authorization (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = resData;
      throw error;
    }

    return resData;
  } catch (error) {
    console.error('Update location profile error:', error);
    throw error;
  }
};

export default {
  updateLocationProfile,
};
