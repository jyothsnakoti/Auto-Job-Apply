// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.33.82:8081';

/**
 * Retrieve the stored auth token from localStorage or sessionStorage
 */
export const getAuthToken = () => {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('token') ||
    ''
  );
};

/**
 * Helper to handle fetch responses for both text and JSON payloads
 */
const handleResponse = async (response, defaultError) => {
  const text = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      text ||
      `${defaultError} (Status ${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
};

/**
 * Fetch available billing plans
 * GET /api/billing/plans
 * @param {string} [token] - Optional Bearer token (defaults to stored token)
 * @returns {Promise<Array>} Array of plan objects
 */
export const getBillingPlans = async (token) => {
  try {
    const authToken = token || getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/billing/plans`, {
      method: 'GET',
      headers,
    });

    return await handleResponse(response, 'Failed to fetch billing plans');
  } catch (error) {
    console.error('Fetch billing plans error:', error);
    throw error;
  }
};

export default {
  getBillingPlans,
  getAuthToken,
};
