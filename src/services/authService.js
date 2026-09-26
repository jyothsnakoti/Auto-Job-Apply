import { AUTH_ENDPOINTS } from './endpoints';

/**
 * Retrieve saved tokens from localStorage or sessionStorage
 */
export const getStoredTokens = () => {
  const localToken =
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    '';
  const sessionToken =
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    '';

  const localRefresh = localStorage.getItem('refreshToken') || '';
  const sessionRefresh = sessionStorage.getItem('refreshToken') || '';

  const accessToken = localToken || sessionToken || '';
  const refreshToken = localRefresh || sessionRefresh || '';
  const storageType = localToken || localRefresh ? 'local' : 'session';

  return {
    accessToken,
    refreshToken,
    storageType,
  };
};

/**
 * Save access & refresh tokens to storage
 * @param {Object} tokens - { accessToken, refreshToken }
 * @param {boolean} rememberMe - Whether to use localStorage (true) or sessionStorage (false)
 */
export const saveAuthTokens = ({ accessToken, refreshToken }, rememberMe = null) => {
  const current = getStoredTokens();
  const isLocal = rememberMe !== null ? rememberMe : current.storageType === 'local';
  const targetStorage = isLocal ? localStorage : sessionStorage;
  const otherStorage = isLocal ? sessionStorage : localStorage;

  // Clear stale tokens from the other storage
  otherStorage.removeItem('authToken');
  otherStorage.removeItem('token');
  otherStorage.removeItem('accessToken');
  otherStorage.removeItem('refreshToken');

  if (accessToken) {
    targetStorage.setItem('authToken', accessToken);
    targetStorage.setItem('token', accessToken);
    targetStorage.setItem('accessToken', accessToken);
  }

  if (refreshToken) {
    targetStorage.setItem('refreshToken', refreshToken);
  }
};

/**
 * Retrieve saved user info from localStorage or sessionStorage
 */
export const getStoredUser = () => {
  try {
    const raw =
      localStorage.getItem('authUser') ||
      sessionStorage.getItem('authUser') ||
      localStorage.getItem('user') ||
      sessionStorage.getItem('user');

    const storedFullName =
      localStorage.getItem('userFullName') ||
      sessionStorage.getItem('userFullName') ||
      localStorage.getItem('userName') ||
      sessionStorage.getItem('userName') ||
      sessionStorage.getItem('pendingFullName') ||
      '';

    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed) {
        const email =
          parsed.email ||
          parsed.userEmail ||
          localStorage.getItem('userEmail') ||
          sessionStorage.getItem('userEmail') ||
          '';
        const name =
          parsed.name ||
          parsed.fullName ||
          storedFullName ||
          (email ? email.split('@')[0] : '');
        return { email, name, fullName: name, ...parsed };
      }
    }

    const email =
      localStorage.getItem('userEmail') ||
      sessionStorage.getItem('userEmail') ||
      sessionStorage.getItem('pendingVerificationEmail') ||
      '';

    const name = storedFullName || (email ? email.split('@')[0] : '');

    return {
      email,
      name,
      fullName: name,
    };
  } catch {
    return { email: '', name: '', fullName: '' };
  }
};

/**
 * Clear all auth data from storage
 */
export const clearAuthTokens = () => {
  const keys = ['authToken', 'token', 'accessToken', 'refreshToken', 'authUser', 'user', 'userEmail', 'pendingVerificationEmail'];
  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
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
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
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
    const response = await fetch(AUTH_ENDPOINTS.SIGNUP, {
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
 * Login user
 * POST /api/auth/login
 * @param {Object} credentials - { email, password, rememberMe }
 */
export const loginUser = async ({ email, password, rememberMe = false }) => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await handleResponse(response, 'Login failed');

    const accessToken =
      data.accessToken ||
      data.token ||
      data.jwt ||
      data.data?.accessToken ||
      data.data?.token ||
      '';

    const refreshToken =
      data.refreshToken ||
      data.data?.refreshToken ||
      '';

    const user = data.user || data.data?.user || (data.email ? { email: data.email } : { email: email.trim() });

    saveAuthTokens({ accessToken, refreshToken }, rememberMe);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('authUser', JSON.stringify(user));
    storage.setItem('user', JSON.stringify(user));
    storage.setItem('userEmail', user.email || email.trim());

    return { ...data, accessToken, refreshToken, user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Get LinkedIn OAuth configuration from environment
 */
export const getLinkedInConfig = () => {
  const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';
  const redirectUri =
    import.meta.env.VITE_LINKEDIN_REDIRECT_URI ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/auth/linkedin/callback`
      : 'http://localhost:5173/auth/linkedin/callback');
  const scope = import.meta.env.VITE_LINKEDIN_SCOPE || 'openid profile email';

  return {
    clientId,
    redirectUri,
    scope,
    isConfigured: Boolean(clientId),
  };
};

/**
 * Start the LinkedIn OAuth authorization redirect
 * Generates and saves a cryptographically random state to prevent CSRF
 * @param {Object} options - { returnTo?: string, rememberMe?: boolean }
 */
export const initiateLinkedInAuth = (options = {}) => {
  const config = getLinkedInConfig();

  if (!config.clientId) {
    const error = new Error('LinkedIn OAuth is not configured. Please set VITE_LINKEDIN_CLIENT_ID in your environment.');
    error.code = 'LINKEDIN_NOT_CONFIGURED';
    throw error;
  }

  // Generate secure random state
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  const state = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('linkedin_oauth_state', state);
    if (options.returnTo) {
      sessionStorage.setItem('linkedin_return_to', options.returnTo);
    }
    sessionStorage.setItem('linkedin_remember_me', String(options.rememberMe !== false));
  }

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(
    config.clientId
  )}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${encodeURIComponent(
    state
  )}&scope=${encodeURIComponent(config.scope)}`;

  if (typeof window !== 'undefined') {
    window.location.href = authUrl;
  }
};

/**
 * Exchange LinkedIn authorization code for Auto Jobs Apply JWT & refresh token
 * POST /api/auth/linkedin
 * @param {Object} payload - { code, redirectUri, rememberMe }
 * @returns {Promise<{ accessToken: string, refreshToken: string, user?: Object }>}
 */
export const loginWithLinkedIn = async ({ code, redirectUri, rememberMe = true }) => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.LINKEDIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        code,
        redirectUri,
      }),
    });

    const data = await handleResponse(response, 'LinkedIn sign-in failed');

    const accessToken =
      data.accessToken ||
      data.token ||
      data.jwt ||
      data.data?.accessToken ||
      data.data?.token ||
      '';

    const refreshToken =
      data.refreshToken ||
      data.data?.refreshToken ||
      '';

    const user = data.user || data.data?.user || (data.email ? { email: data.email } : null);

    saveAuthTokens({ accessToken, refreshToken }, rememberMe);

    const storage = rememberMe ? localStorage : sessionStorage;
    if (user) {
      storage.setItem('authUser', JSON.stringify(user));
      storage.setItem('user', JSON.stringify(user));
    }

    return { ...data, accessToken, refreshToken, user };
  } catch (error) {
    console.error('LinkedIn authentication error:', error);
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
    const response = await fetch(AUTH_ENDPOINTS.VERIFY_OTP, {
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
    const response = await fetch(AUTH_ENDPOINTS.RESEND_OTP, {
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

/**
 * Refresh Authentication Token
 * POST /api/auth/refresh
 * @param {string|Object} [tokenOrPayload] - Optional explicit refreshToken string or { refreshToken } object
 * @returns {Promise<{ accessToken: string, refreshToken: string, ... }>}
 */
export const refreshAuthToken = async (tokenOrPayload) => {
  try {
    let token = '';
    if (typeof tokenOrPayload === 'string') {
      token = tokenOrPayload;
    } else if (tokenOrPayload && typeof tokenOrPayload === 'object') {
      token = tokenOrPayload.refreshToken || tokenOrPayload.token || '';
    }

    if (!token) {
      const stored = getStoredTokens();
      token = stored.refreshToken || stored.accessToken;
    }

    const payload = token ? { refreshToken: token } : {};

    const response = await fetch(AUTH_ENDPOINTS.REFRESH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(response, 'Token refresh failed');

    const newAccessToken =
      data.accessToken ||
      data.token ||
      data.jwt ||
      data.data?.accessToken ||
      data.data?.token ||
      '';

    const newRefreshToken =
      data.refreshToken ||
      data.data?.refreshToken ||
      token;

    if (newAccessToken || newRefreshToken) {
      saveAuthTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      ...data,
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
};

/**
 * Alias for refreshAuthToken
 */
export const refreshToken = refreshAuthToken;

/**
 * Logout / Sign out user
 * POST /api/auth/logout
 * @param {string|Object} [tokenOrPayload] - Optional explicit refreshToken string or { refreshToken } object
 */
export const logoutUser = async (tokenOrPayload) => {
  try {
    let token = '';
    if (typeof tokenOrPayload === 'string') {
      token = tokenOrPayload;
    } else if (tokenOrPayload && typeof tokenOrPayload === 'object') {
      token = tokenOrPayload.refreshToken || tokenOrPayload.token || '';
    }

    if (!token) {
      const stored = getStoredTokens();
      token = stored.refreshToken || stored.accessToken;
    }

    const payload = token ? { refreshToken: token } : {};

    const response = await fetch(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify(payload),
    });

    // Always clear tokens from client storage
    clearAuthTokens();

    return await handleResponse(response, 'Logout failed');
  } catch (error) {
    // Clear storage even if network/server failed
    clearAuthTokens();
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Alias for logoutUser
 */
export const signOutUser = logoutUser;

/**
 * Fetch wrapper that attaches Bearer token and automatically refreshes token on 401
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 */
export const fetchWithAuth = async (url, options = {}) => {
  const { accessToken } = getStoredTokens();

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized (401 or 403), attempt token refresh and retry original request once
  if (response.status === 401 || response.status === 403) {
    try {
      const refreshed = await refreshAuthToken();
      if (refreshed?.accessToken) {
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${refreshed.accessToken}`,
        };
        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      }
    } catch (refreshErr) {
      console.warn('Session expired or unable to refresh token on ' + response.status, refreshErr);
    }
  }

  return response;
};

export default {
  signupUser,
  loginUser,
  loginWithLinkedIn,
  getLinkedInConfig,
  initiateLinkedInAuth,
  verifyOtp,
  resendOtp,
  refreshToken,
  refreshAuthToken,
  logoutUser,
  signOutUser,
  getStoredTokens,
  saveAuthTokens,
  clearAuthTokens,
  fetchWithAuth,
};
