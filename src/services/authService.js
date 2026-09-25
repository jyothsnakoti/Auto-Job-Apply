// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.33.82:8081';

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
 * Register / Signup a new user
 * POST /api/auth/signup
 * @param {Object} userData - { name, email, password }
 */
export const signupUser = async ({ name, email, password }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    return await handleResponse(response, 'Registration failed');
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

/**
 * Verify OTP for account confirmation
 * POST /api/auth/verify-otp
 * @param {Object} data - { email, otp }
 */
export const verifyOtp = async ({ email, otp }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    });

    return await handleResponse(response, 'OTP verification failed');
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

/**
 * Resend OTP to user's email
 * POST /api/auth/resend-otp
 * @param {Object} data - { email }
 */
export const resendOtp = async ({ email }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        email,
      }),
    });

    return await handleResponse(response, 'Failed to resend OTP');
  } catch (error) {
    console.error('Resend OTP error:', error);
    throw error;
  }
};

export default {
  signupUser,
  verifyOtp,
  resendOtp,
};

