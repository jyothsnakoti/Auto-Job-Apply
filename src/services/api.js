// Use VITE_API_BASE_URL if provided, otherwise default to relative path for Vite proxy or direct endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Register / Signup a new user
 * @param {Object} userData - { name, email, password }
 * @returns {Promise<Object>} Response data
 */
export const signupUser = async ({ name, email, password }) => {
  try {
    const url = API_BASE_URL ? `${API_BASE_URL}/api/auth/signup` : '/api/auth/signup';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `Registration failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export default {
  signupUser,
};
