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
    console.log("Settings API URL:", url);
console.log("Settings API Method: PATCH");
console.log("Settings API Payload:", data);
    const accessToken =
      token ||
      getStoredTokens().accessToken ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('accessToken') ||
      '';
 
    let resumeOpt = 'honest';
    if (typeof data.resumeOptimization === 'string') {
      const lower = data.resumeOptimization.toLowerCase();
      if (lower === 'off') resumeOpt = 'off';
      else if (lower === 'aggressive') resumeOpt = 'aggressive';
      else resumeOpt = 'honest';
    }
 
    const autoApprove =
      data.autoApproveEdits !== undefined
        ? Boolean(data.autoApproveEdits)
        : data.autoApprove !== undefined
        ? Boolean(data.autoApprove)
        : true;
 
    const reviewBeforeSubmit =
      data.reviewBeforeSubmit !== undefined
        ? Boolean(data.reviewBeforeSubmit)
        : data.reviewBeforeSubmitToggle !== undefined
        ? Boolean(data.reviewBeforeSubmitToggle)
        : data.automationMode === 'review' || data.automationMode === 'review-before-submit'
        ? true
        : false;
 
    const questionsMode =
      data.applicationQuestionsMode || data.questionsMode || 'saved_answers';
 
    const resumeTailoring =
      data.resumeTailoring || (resumeOpt === 'off' ? 'original' : 'job_specific');
 
    const automationMode =
      data.automationMode || (reviewBeforeSubmit ? 'review' : 'automatic');
 
    const payload = {
      ...data,
      resumeOptimization: resumeOpt,
      autoApproveEdits: autoApprove,
      autoApprove: autoApprove,
      reviewBeforeSubmit: reviewBeforeSubmit,
      resumeTailoring: resumeTailoring,
      automationMode: automationMode,
      applicationQuestionsMode: questionsMode,
      questionsMode: questionsMode,
    };
 
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
 
    console.log("Calling Settings API...");

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
    headers,
    body: JSON.stringify(payload),
  });
}

console.log("Settings API Status:", response.status);
console.log("Settings API Success:", response.ok);
 
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
 