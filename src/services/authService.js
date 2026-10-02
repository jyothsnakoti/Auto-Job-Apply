import axios from 'axios';
import { AUTH_ENDPOINTS } from './endpoints';

// Proactive refresh timer reference
let refreshTimer = null;
let activeRefreshPromise = null;

/**
 * Safely parse the expiration timestamp (exp) from a JWT access token
 * @param {string} token - JWT string
 * @returns {number|null} Expiration time in seconds Unix epoch, or null
 */
export const parseJwtExp = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
};

/**
 * Calculate proactive refresh delay in milliseconds.
 * Refreshes approximately 1 minute (60,000 ms) before the access token expires.
 * For a fresh 15-minute token: ~14 minutes (840,000 ms).
 *
 * @param {string} token - Current access token
 * @returns {number} Delay in milliseconds
 */
export const calculateRefreshDelay = (token) => {
  const DEFAULT_DELAY_MS = 14 * 60 * 1000; // 14 minutes fallback
  const exp = parseJwtExp(token);
  if (!exp) return DEFAULT_DELAY_MS;

  const expiryTimeMs = exp * 1000;
  const remainingTimeMs = expiryTimeMs - Date.now();
  // Schedule refresh ~60 seconds before actual expiration
  const targetDelayMs = remainingTimeMs - 60 * 1000;

  // If token is already expired or very close to expiring, trigger almost immediately
  if (targetDelayMs <= 0) {
    return 1000; // 1 second
  }

  return targetDelayMs;
};

/**
 * Stop any active proactive token refresh timer
 */
export const stopTokenRefreshTimer = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

/**
 * Start or restart the proactive access token refresh timer.
 * Refreshes before token expiration (at approx 14 minutes for a 15-minute token).
 *
 * @param {string|null} [explicitToken] - Optional explicit access token to inspect
 */
export const startTokenRefreshTimer = (explicitToken = null) => {
  stopTokenRefreshTimer();

  const { accessToken, refreshToken: storedRefresh } = getStoredTokens();
  const tokenToUse = explicitToken || accessToken;

  // Only start timer if both access and refresh tokens exist
  if (!tokenToUse || !storedRefresh) {
    return;
  }

  const delayMs = calculateRefreshDelay(tokenToUse);

  refreshTimer = setTimeout(async () => {
    try {
      const refreshed = await refreshAccessToken();
      if (refreshed?.accessToken) {
        // Restart timer with newly returned access token
        startTokenRefreshTimer(refreshed.accessToken);
      }
    } catch (err) {
      console.warn('[auth] Proactive token refresh failed:', err?.message);
      if (err?.isAuthError || err?.status === 401) {
        stopTokenRefreshTimer();
        clearAuthTokens();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
  }, delayMs);
};

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
 * Save access & refresh tokens to storage and start proactive refresh timer
 * @param {Object} tokens - { accessToken, refreshToken }
 * @param {boolean} rememberMe - Whether to use localStorage (true) or sessionStorage (false)
 */
export const saveAuthTokens = ({ accessToken, refreshToken }, rememberMe = null) => {
  const current = getStoredTokens();
  const isLocal = rememberMe !== null ? rememberMe : current.storageType === 'local';
  const targetStorage = isLocal ? localStorage : sessionStorage;
  const otherStorage = isLocal ? sessionStorage : localStorage;

  // Clear stale tokens and user data from the other storage to prevent cross-storage contamination
  const staleKeys = [
    'authToken',
    'token',
    'accessToken',
    'refreshToken',
    'authUser',
    'user',
    'userEmail',
    'userFullName',
    'userName',
    'pendingFullName',
    'pendingVerificationEmail',
    'billingStatus',
    'hasPlan',
    'onboardingData',
    'profileData',
  ];
  staleKeys.forEach((key) => otherStorage.removeItem(key));

  if (accessToken) {
    targetStorage.setItem('authToken', accessToken);
    targetStorage.setItem('token', accessToken);
    targetStorage.setItem('accessToken', accessToken);
  }

  if (refreshToken) {
    targetStorage.setItem('refreshToken', refreshToken);
  }

  // Start proactive refresh timer with the newly saved token
  if (accessToken && (refreshToken || current.refreshToken)) {
    startTokenRefreshTimer(accessToken);
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
 * Clear all auth and user-specific session data from storage
 */
export const clearAuthTokens = () => {
  const keys = [
    'authToken',
    'token',
    'accessToken',
    'refreshToken',
    'authUser',
    'user',
    'userEmail',
    'userFullName',
    'userName',
    'pendingFullName',
    'pendingVerificationEmail',
    'billingStatus',
    'hasPlan',
    'onboardingData',
    'profileData',
  ];
  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('billingStatusUpdated', { detail: null }));
    } catch {
      // ignore
    }
  }
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

    // Clean up any stale session data before saving new authenticated user
    clearAuthTokens();

    saveAuthTokens({ accessToken, refreshToken }, rememberMe);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('authUser', JSON.stringify(user));
    storage.setItem('user', JSON.stringify(user));
    storage.setItem('userEmail', user.email || email.trim());

    const candidateId =
      data.candidate_id ||
      data.candidateId ||
      data.Candidateid ||
      data.CandidateId ||
      user?.candidate_id ||
      user?.candidateId ||
      user?.Candidateid ||
      user?.id ||
      user?.userId ||
      user?.user_id;

    if (candidateId) {
      storage.setItem('candidateId', String(candidateId).trim());
      storage.setItem('candidate_id', String(candidateId).trim());
    }

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
    sessionStorage.setItem('linkedin_redirect_uri', config.redirectUri);
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

    let user = data.user || data.data?.user || (data.email ? { email: data.email } : null);
    if (!user && accessToken) {
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          const email = payload.sub || payload.email || payload.username || '';
          const name = payload.name || payload.fullName || '';
          if (email) {
            user = { email, name };
          }
        }
      } catch (e) {
        console.debug('Could not decode JWT payload for user info', e);
      }
    }

    // Clean up any stale session data before saving new authenticated user
    clearAuthTokens();

    saveAuthTokens({ accessToken, refreshToken }, rememberMe);

    const storage = rememberMe ? localStorage : sessionStorage;
    if (user) {
      storage.setItem('authUser', JSON.stringify(user));
      storage.setItem('user', JSON.stringify(user));
      if (user.email) {
        storage.setItem('userEmail', user.email);
      }
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
 * Request: { refreshToken: string }
 * Response: { accessToken: string, refreshToken: string, ... }
 *
 * Implements single-use concurrency deduplication:
 * - When multiple requests trigger refresh concurrently, only one HTTP call is made.
 * - All other requests await the active promise and receive the rotated tokens.
 *
 * @param {string|Object} [tokenOrPayload] - Optional explicit refreshToken string or object
 * @returns {Promise<{ accessToken: string, refreshToken: string, ... }>}
 */
export const refreshAuthToken = async (tokenOrPayload = null) => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      let token = '';
      if (typeof tokenOrPayload === 'string') {
        token = tokenOrPayload.trim();
      } else if (tokenOrPayload && typeof tokenOrPayload === 'object') {
        token = tokenOrPayload.refreshToken || tokenOrPayload.token || '';
      }

      if (!token) {
        const stored = getStoredTokens();
        token = stored.refreshToken;
      }

      if (!token) {
        const err = new Error('No refresh token available. Please sign in again.');
        err.status = 401;
        err.isAuthError = true;
        stopTokenRefreshTimer();
        clearAuthTokens();
        throw err;
      }

      const response = await fetch(AUTH_ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        body: JSON.stringify({ refreshToken: token }),
      });

      const text = await response.text().catch(() => '');
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        stopTokenRefreshTimer();
        clearAuthTokens();
        const errorMsg =
          data?.message ||
          data?.error ||
          (typeof data === 'string' && data ? data : '') ||
          'Your session has expired. Please sign in again.';
        const error = new Error(errorMsg);
        error.status = response.status;
        error.isAuthError = true;
        error.data = data;
        throw error;
      }

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

      if (newAccessToken) {
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
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
};

/**
 * Aliases for refreshAuthToken
 */
export const refreshToken = refreshAuthToken;
export const refreshAccessToken = refreshAuthToken;

/**
 * Logout / Sign out user
 * POST /api/auth/logout
 * @param {string|Object} [tokenOrPayload] - Optional explicit refreshToken string or { refreshToken } object
 */
export const logoutUser = async (tokenOrPayload) => {
  // Clear proactive timer immediately
  stopTokenRefreshTimer();

  try {
    let token = '';
    if (typeof tokenOrPayload === 'string') {
      token = tokenOrPayload.trim();
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
 * ============================================================
 * CENTRALIZED AXIOS INSTANCE WITH PROACTIVE & RETRY INTERCEPTORS
 * ============================================================
 */

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Accept': 'application/json, text/plain, */*',
  },
});

// Request Interceptor: inject latest active access token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = getStoredTokens();
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: fallback 401 token refresh with single-retry guard
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Only retry on 401 Unauthorized (expired JWT), strictly avoiding 403 (permissions/ownership)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshed = await refreshAccessToken();
        if (refreshed?.accessToken) {
          originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        stopTokenRefreshTimer();
        clearAuthTokens();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export const axiosInstance = apiClient;

/**
 * Centralized Authenticated Fetch Wrapper
 * Features:
 * - Injects Authorization: Bearer <accessToken>
 * - Detects 401 (expired access token) and calls centralized refreshAuthToken()
 * - Deduplicates concurrent refresh requests behind a single in-flight promise
 * - Retries the original request exactly once with new token (max 1 retry)
 * - Preserves multipart/form-data requests without overriding browser boundary
 * - Handles token rotation seamlessly
 *
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {boolean} [isRetry=false] - Internal flag preventing infinite retry loops
 * @returns {Promise<Response>}
 */
export const fetchWithAuth = async (url, options = {}, isRetry = false) => {
  let { accessToken, refreshToken: storedRefresh } = getStoredTokens();
  if (options.token) {
    accessToken = options.token;
  }

  // If access token is missing but refresh token exists, attempt refresh first
  if (!accessToken && storedRefresh && !isRetry) {
    try {
      const refreshed = await refreshAuthToken();
      if (refreshed?.accessToken) {
        accessToken = refreshed.accessToken;
      }
    } catch {
      // Continue to request; 401 handler will catch if unauthorized
    }
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    Accept: 'application/json, text/plain, */*',
    ...(!isFormData && options.body && typeof options.body === 'string' && !options.headers?.['Content-Type']
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  const { token: _optToken, ...fetchOptions } = options;

  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (netErr) {
    console.error(`[auth] Network error requesting ${url}:`, netErr?.message);
    throw netErr;
  }

  // If unauthorized (401), perform centralized refresh and retry original request once
  if (response.status === 401) {
    if (isRetry) {
      // Already retried after refreshing tokens and still received 401 -> session invalid
      stopTokenRefreshTimer();
      clearAuthTokens();
      return response;
    }

    try {
      const refreshed = await refreshAuthToken();
      if (refreshed?.accessToken) {
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${refreshed.accessToken}`,
        };

        return await fetchWithAuth(
          url,
          {
            ...options,
            headers: retryHeaders,
            token: refreshed.accessToken,
          },
          true // isRetry = true
        );
      }
    } catch (refreshErr) {
      console.warn(`[auth] Session refresh failed on 401 for ${url}:`, refreshErr?.message);
      stopTokenRefreshTimer();
      clearAuthTokens();
    }
  }

  return response;
};

/**
 * Authenticated Fetch that parses JSON/text response and throws structured error on failure
 * @param {string} endpoint - Target URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>}
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
  const response = await fetchWithAuth(endpoint, options);
  const text = await response.text().catch(() => '');
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (typeof data === 'object' && data ? (data.message || data.error) : '') ||
      (typeof data === 'string' && data ? data : '') ||
      `Request failed (Status ${response.status})`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    if (response.status === 401) {
      error.isAuthError = true;
    }
    throw error;
  }

  return data;
};

// Automatically restore proactive refresh timer on initial module execution if stored session exists
if (typeof window !== 'undefined') {
  try {
    const { accessToken, refreshToken: storedRefresh } = getStoredTokens();
    if (accessToken && storedRefresh) {
      startTokenRefreshTimer(accessToken);
    }
  } catch {
    // ignore
  }
}

export default {
  signupUser,
  loginUser,
  loginWithLinkedIn,
  getLinkedInConfig,
  initiateLinkedInAuth,
  verifyOtp,
  resendOtp,
  refreshToken,
  refreshAccessToken,
  refreshAuthToken,
  logoutUser,
  signOutUser,
  getStoredTokens,
  saveAuthTokens,
  clearAuthTokens,
  fetchWithAuth,
  authenticatedFetch,
  apiClient,
  axiosInstance,
  startTokenRefreshTimer,
  stopTokenRefreshTimer,
  parseJwtExp,
  calculateRefreshDelay,
};
