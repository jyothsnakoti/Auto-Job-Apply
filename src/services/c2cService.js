import { apiClient } from './authService';
import { C2C_AUTO_APPLY_ENDPOINTS } from './endpoints';
 
/**
 * Fetch C2C Auto Apply settings for the authenticated user
 * GET /api/c2c/auto-apply
 *
 * Example response:
 * {
 *   "mode": "C2C",
 *   "enabled": true,
 *   "resumeId": 308,
 *   "timeZone": "Asia/Kolkata",
 *   "perRunCount": 1,
 *   "runTimes": ["18:30"],
 *   "titles": ["Python/TypeScript"],
 *   "locations": [],
 *   "phoneVerified": true,
 *   "nextFireAt": "2026-11-06T13:00:00Z",
 *   "maxPerRun": 10
 * }
 *
 * @returns {Promise<Object>} Saved C2C settings
 */
export const getC2CAutoApplySettings = async () => {
  const endpoint = C2C_AUTO_APPLY_ENDPOINTS?.SETTINGS || '/api/c2c/auto-apply';
  const response = await apiClient.get(endpoint);
  return response.data;
};
 
/**
 * Save or update complete C2C Auto Apply settings
 * PUT /api/c2c/auto-apply
 *
 * Payload:
 * {
 *   "enabled": boolean,
 *   "resumeId": number|null,
 *   "timeZone": string,
 *   "perRunCount": number,
 *   "runTimes": string[],
 *   "titles": string[],
 *   "locations": string[]
 * }
 *
 * @param {Object} payload Complete settings payload
 * @returns {Promise<Object>} Updated C2C settings view
 */
export const updateC2CAutoApplySettings = async (payload) => {
  const endpoint = C2C_AUTO_APPLY_ENDPOINTS?.SETTINGS || '/api/c2c/auto-apply';
  const response = await apiClient.put(endpoint, payload);
  return response.data;
};
 
export default {
  getC2CAutoApplySettings,
  updateC2CAutoApplySettings,
};