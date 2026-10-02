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
      JDid,
      ResumeID,
      EnhResumeTextLength: EnhResumeText.length,
    },
  });

  const response = await apiClient.post(
    GET_SCORE_FOR_ENHANCED_RESUME_URL,
    {
      JDid,
      ResumeID,
      EnhResumeText,
    },
    {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('[enhancedAtsService] Response:', response.data);
  return response.data;
};

export default {
  getScoreForEnhancedResume,
};
