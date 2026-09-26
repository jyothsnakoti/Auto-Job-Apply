import { PROFILE_ENDPOINTS, API_BASE_URL } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';

/**
 * Update Profile Settings
 * PATCH /api/profile/settings
 * @param {Object} data - { resumeOptimization, autoApproveEdits, reviewBeforeSubmit, applicationQuestionsMode }
 * @param {string} [token] - Optional explicit access token
 */
export const updateProfileSettings = async (data = {}, token = null) => {
  try {
    const url = PROFILE_ENDPOINTS?.UPDATE_SETTINGS || `${API_BASE_URL}/api/profile/settings`;
    const accessToken = token || getStoredTokens().accessToken;

    let resumeOpt = 'honest';
    if (typeof data.resumeOptimization === 'string') {
      const lower = data.resumeOptimization.toLowerCase();
      if (lower === 'off') resumeOpt = 'off';
      else if (lower === 'aggressive') resumeOpt = 'aggressive';
      else resumeOpt = 'honest';
    }

    const payload = {
      resumeOptimization: resumeOpt,
      autoApproveEdits:
        data.autoApproveEdits !== undefined
          ? Boolean(data.autoApproveEdits)
          : data.autoApprove !== undefined
          ? Boolean(data.autoApprove)
          : true,
      reviewBeforeSubmit:
        data.reviewBeforeSubmit !== undefined
          ? Boolean(data.reviewBeforeSubmit)
          : data.reviewBeforeSubmitToggle !== undefined
          ? Boolean(data.reviewBeforeSubmitToggle)
          : false,
      applicationQuestionsMode:
        data.applicationQuestionsMode || data.questionsMode || 'saved_answers',
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
        `Failed to update settings (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = resData;
      throw error;
    }

    return resData;
  } catch (error) {
    console.error('Update profile settings error:', error);
    throw error;
  }
};

export default {
  updateProfileSettings,
};
