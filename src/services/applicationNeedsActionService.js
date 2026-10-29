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
 * Safely extracts a user-friendly error message from an API error response.
 * Handles:
 * - Plain text strings from backend (e.g. "Selection options are missing for: School*")
 * - JSON with { message }
 * - JSON with { error }
 * - JSON with { detail }
 * - Structured validation errors: { errors: [...] } or { errors: { field: "..." } }
 * - Array-based messages (e.g. NestJS or FastAPI detail list)
 * - Stringified JSON payloads
 * - Filters out generic Axios status messages ("Request failed with status code 409")
 * - Network errors and clean fallbacks
 *
 * @param {any} error - The error thrown by Axios or the API service
 * @param {string} [fallbackMessage] - Fallback message if no meaningful backend text exists
 * @returns {string} Readable error message
 */
export const extractErrorMessage = (
  error,
  fallbackMessage = 'Failed to submit answers. Please try again.'
) => {
  if (!error) return fallbackMessage;

  // If already a plain string, return it unless it's a generic Axios status message
  if (typeof error === 'string' && error.trim()) {
    const trimmed = error.trim();
    if (!/^Request failed with status code \d+/i.test(trimmed)) {
      return trimmed;
    }
    return fallbackMessage;
  }

  let data = error?.response?.data ?? error?.data;

  // Handle double-encoded or stringified JSON in error.response.data
  if (typeof data === 'string' && data.trim()) {
    const trimmed = data.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        // Keep as string
      }
    }
    // If it's still a string and not HTML markup, return it directly
    if (typeof data === 'string') {
      if (!trimmed.startsWith('<')) {
        return trimmed;
      }
    }
  }

  // Handle structured data object or array
  if (data && typeof data === 'object') {
    // 1. Direct string properties
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail.trim();
    }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim();
    }
    if (typeof data.msg === 'string' && data.msg.trim()) {
      return data.msg.trim();
    }
    if (typeof data.errorMessage === 'string' && data.errorMessage.trim()) {
      return data.errorMessage.trim();
    }
    if (typeof data.description === 'string' && data.description.trim()) {
      return data.description.trim();
    }

    // 2. data.message or data.detail as array (e.g., NestJS / FastAPI)
    if (Array.isArray(data.message) && data.message.length > 0) {
      const msgs = data.message
        .map((m) => (typeof m === 'string' ? m.trim() : m?.message || m?.msg || ''))
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join(', ');
    }

    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const details = data.detail
        .map((d) => (typeof d === 'string' ? d.trim() : d?.msg || d?.message || ''))
        .filter(Boolean);
      if (details.length > 0) return details.join(', ');
    }

    // 3. Structured validation errors: data.errors
    if (data.errors) {
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const msgs = data.errors
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
              return item.message || item.msg || item.detail || item.error || '';
            }
            return '';
          })
          .filter(Boolean);
        if (msgs.length > 0) return msgs.join(', ');
      } else if (typeof data.errors === 'object') {
        const messages = [];
        for (const [key, val] of Object.entries(data.errors)) {
          if (typeof val === 'string' && val.trim()) {
            messages.push(val.includes(key) ? val.trim() : `${key}: ${val.trim()}`);
          } else if (Array.isArray(val) && val.length > 0) {
            const inner = val.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim());
            if (inner.length > 0) {
              const joined = inner.join(', ');
              messages.push(joined.includes(key) ? joined : `${key}: ${joined}`);
            }
          } else if (val && typeof val === 'object' && (val.message || val.msg)) {
            messages.push(val.message || val.msg);
          }
        }
        if (messages.length > 0) return messages.join('; ');
      }
    }

    // 4. data is itself an array of error objects or strings
    if (Array.isArray(data) && data.length > 0) {
      const items = data
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') {
            return item.message || item.msg || item.detail || item.error || '';
          }
          return '';
        })
        .filter(Boolean);
      if (items.length > 0) return items.join(', ');
    }
  }

  // Fallback to error.message if it's meaningful and not an Axios generic status code message
  if (typeof error?.message === 'string' && error.message.trim()) {
    const trimmed = error.message.trim();
    if (!/^Request failed with status code \d+/i.test(trimmed)) {
      return trimmed;
    }
  }

  return fallbackMessage;
};

export const getErrorMessage = extractErrorMessage;

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
    const msg = extractErrorMessage(error, 'Failed to load applications requiring action.');
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
    const msg = extractErrorMessage(error, 'Failed to submit answers. Please try again.');
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
  extractErrorMessage,
  getErrorMessage,
};
