import { apiClient } from './authService';
import { RESUME_API_BASE_URL } from './endpoints';

/**
 * Endpoint for calculating ATS Score for Enhanced Resume
 * POST /api/v1/Get_Score_for_EnhancedResume
 */
const GET_SCORE_FOR_ENHANCED_RESUME_URL = `${RESUME_API_BASE_URL || ''}/api/v1/Get_Score_for_EnhancedResume`;

/**
 * Call the backend API to calculate updated ATS Score for the enhanced resume
 *
 * @param {Object} payload - { JDid, ResumeID, EnhResumeText }
 * @returns {Promise<Object>} Response data containing { status, EnhATS, score_data }
 */
export const getScoreForEnhancedResume = async (payload) => {
  if (!payload) {
    throw new Error('Payload is required for score calculation.');
  }

  const { JDid, ResumeID, EnhResumeText } = payload;

  if (!JDid) {
    throw new Error('Job ID (JDid) is missing.');
  }
  if (!ResumeID) {
    throw new Error('Resume ID (ResumeID) is missing.');
  }
  if (!EnhResumeText) {
    throw new Error('Enhanced Resume Text (EnhResumeText) is missing.');
  }

  console.log('[enhancedAtsService] Calling Get_Score_for_EnhancedResume API:', {
    endpoint: GET_SCORE_FOR_ENHANCED_RESUME_URL,
    payload: {
      JDid: String(JDid).trim(),
      ResumeID: String(ResumeID).trim(),
      EnhResumeTextLength: EnhResumeText.length,
    },
  });

  const response = await apiClient.post(
    GET_SCORE_FOR_ENHANCED_RESUME_URL,
    {
      JDid: String(JDid).trim(),
      ResumeID: String(ResumeID).trim(),
      EnhResumeText: String(EnhResumeText),
    },
    {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('[enhancedAtsService] Response:', response.data);

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('Invalid response received from ATS calculation service.');
  }

  // Detect explicit API error responses (HTTP 200 with error payload)
  if (response.data.status === 'error' || response.data.error) {
    const errorMsg =
      response.data.detail ||
      response.data.message ||
      response.data.error ||
      'Failed to calculate enhanced ATS score.';
    const err = new Error(errorMsg);
    err.status = 400;
    err.data = response.data;
    throw err;
  }

  // Validate numeric score exists and is within valid range (0-100)
  const rawScore =
    response.data.EnhATS ??
    response.data.score_data?.overall_score ??
    response.data.overall_score ??
    response.data.score ??
    response.data.atsScore;

  if (rawScore === undefined || rawScore === null || isNaN(Number(rawScore))) {
    throw new Error('ATS calculation response did not return a valid numeric score.');
  }

  const numericScore = Number(rawScore);
  if (numericScore < 0 || numericScore > 100) {
    throw new Error(`Returned ATS score (${numericScore}) is outside the valid 0-100 range.`);
  }

  return response.data;
};

export default {
  getScoreForEnhancedResume,
};
