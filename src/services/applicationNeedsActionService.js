import { apiClient } from './authService';
import { APPLICATION_ENDPOINTS, API_BASE_URL } from './endpoints';
import { extractApplicationId } from './applicationService';

/**
 * Safely parses needsActionQuestions from string or array format.
 * Handles:
 * - JSON-encoded strings
 * - Double-encoded JSON strings
 * - Already parsed arrays
 * - Null / undefined / invalid values
 *
 * @param {string|Array<Object>|null|undefined} rawQuestions
 * @returns {Array<Object>} List of sanitized question objects
 */
export const parseNeedsActionQuestions = (rawQuestions) => {
  if (!rawQuestions) return [];

  let parsed = rawQuestions;

  if (typeof rawQuestions === 'string') {
    try {
      parsed = JSON.parse(rawQuestions.trim());
      // Handle possible double-stringified JSON
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed.trim());
      }
    } catch (err) {
      console.warn('[applicationNeedsActionService] Failed to parse needsActionQuestions JSON:', err?.message);
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  // Sanitize each question item to avoid runtime rendering crashes
  return parsed
    .filter((q) => q && typeof q === 'object')
    .map((q) => {
      const key = typeof q.key === 'string' ? q.key : String(q.key || q.label || '');
      const label = typeof q.label === 'string' && q.label.trim() ? q.label : key;
      const type = typeof q.type === 'string' ? q.type.toLowerCase().trim() : 'text';
      const options = Array.isArray(q.options)
        ? q.options.filter((opt) => opt !== null && opt !== undefined)
        : [];
      const required = Boolean(q.required);
      const sensitive = Boolean(q.sensitive);

      return {
        ...q,
        key,
        label,
        type,
        options,
        required,
        sensitive,
      };
    });
};

/**
 * Extracts array of application items from various backend response shapes.
 *
 * @param {any} data
 * @returns {Array<Object>}
 */
export const extractApplicationsList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    if (Array.isArray(data.applications?.items)) return data.applications.items;
    if (Array.isArray(data.applications)) return data.applications;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data?.items)) return data.data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
  }
  return [];
};

/**
 * Fetches applications requiring action.
 * GET /api/applications?tab=needs_action
 *
 * @param {Object} [params]
 * @returns {Promise<any>}
 */
export const getNeedsActionApplications = async (params = {}) => {
  const endpoint = APPLICATION_ENDPOINTS?.NEEDS_ACTION || `${API_BASE_URL}/api/applications?tab=needs_action`;

  try {
    const response = await apiClient.get(endpoint, {
      params: {
        tab: 'needs_action',
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error('[applicationNeedsActionService] Failed to fetch needs_action applications:', error?.message);
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to load applications requiring action.';
    const err = new Error(msg);
    err.status = error.response?.status;
    err.response = error.response;
    throw err;
  }
};

/**
 * Fetches the latest questions for a specific application from GET /api/applications?tab=needs_action.
 * Selects only the application matching the given applicationId.
 *
 * @param {number|string|Object} applicationOrId
 * @returns {Promise<{ application: Object|null, questions: Array<Object> }>}
 */
export const fetchNeedsActionQuestions = async (applicationOrId) => {
  const targetId =
    extractApplicationId(applicationOrId) ||
    (typeof applicationOrId === 'object'
      ? applicationOrId?.id ?? applicationOrId?.applicationId ?? applicationOrId?.application_id
      : applicationOrId);

  if (!targetId) {
    throw new Error('Application ID is required to fetch questions.');
  }

  const responseData = await getNeedsActionApplications();
  const items = extractApplicationsList(responseData);

  const matchedApp = items.find((item) => {
    const itemId = extractApplicationId(item) || item?.id || item?.applicationId || item?.application_id;
    return String(itemId) === String(targetId);
  });

  if (!matchedApp) {
    return {
      application: null,
      questions: [],
    };
  }

  const questions = parseNeedsActionQuestions(matchedApp.needsActionQuestions);

  return {
    application: matchedApp,
    questions,
  };
};

/**
 * Submits user-provided answers for a specific application.
 * POST /api/applications/{applicationId}/needs-action/answers
 *
 * Request body format:
 * {
 *   "answers": {
 *     "question_key": "answer_value",
 *     ...
 *   },
 *   "saveToProfile": false
 * }
 *
 * @param {number|string|Object} applicationOrId
 * @param {Object} payload - { answers: Object, saveToProfile?: boolean }
 * @returns {Promise<any>}
 */
export const submitNeedsActionAnswers = async (applicationOrId, payload = {}) => {
  const cleanId =
    extractApplicationId(applicationOrId) ||
    (typeof applicationOrId === 'object'
      ? applicationOrId?.id ?? applicationOrId?.applicationId ?? applicationOrId?.application_id
      : applicationOrId);

  if (!cleanId) {
    throw new Error('Application ID is required to submit answers.');
  }

  // Extract raw answers map
  const answers =
    payload && typeof payload === 'object' && payload.answers !== undefined
      ? payload.answers
      : payload || {};

  const saveToProfile = Boolean(payload?.saveToProfile);

  const requestBody = {
    answers: answers && typeof answers === 'object' ? answers : {},
    saveToProfile,
  };

  const endpoint =
    APPLICATION_ENDPOINTS?.SUBMIT_NEEDS_ACTION_ANSWERS?.(cleanId) ||
    `${API_BASE_URL}/api/applications/${cleanId}/needs-action/answers`;

  // Note: We do NOT log requestBody or answers to avoid exposing sensitive questions/answers in console logs
  console.log(`[applicationNeedsActionService] Submitting answers for application ID: ${cleanId}`);

  try {
    const response = await apiClient.post(endpoint, requestBody);
    return response.data;
  } catch (error) {
    console.error(`[applicationNeedsActionService] Submission failed for application ID: ${cleanId}`);
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to submit answers. Please try again.';
    const err = new Error(msg);
    err.status = error.response?.status;
    err.response = error.response;
    throw err;
  }
};

export default {
  parseNeedsActionQuestions,
  extractApplicationsList,
  getNeedsActionApplications,
  fetchNeedsActionQuestions,
  submitNeedsActionAnswers,
};
