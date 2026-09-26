import { ONBOARDING_ENDPOINTS } from './endpoints';
import { getStoredTokens, fetchWithAuth } from './authService';

const ONBOARDING_STORAGE_KEY = 'auto_job_apply_onboarding_state';

/**
 * Retrieve the current common onboarding state from sessionStorage
 */
export const getOnboardingState = () => {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse onboarding state from sessionStorage:', err);
    return {};
  }
};

/**
 * Update the common onboarding state in sessionStorage
 * @param {Object} partialState - fields to merge into onboarding state
 */
export const setOnboardingState = (partialState) => {
  try {
    const current = getOnboardingState();
    const updated = { ...current, ...partialState };
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save onboarding state to sessionStorage:', err);
    return partialState;
  }
};

/**
 * Clear the onboarding state from sessionStorage
 */
export const clearOnboardingState = () => {
  try {
    sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear onboarding state:', err);
  }
};

/**
 * Build the complete Onboarding DTO payload from collected frontend state
 * @param {Object} [state] - Optional explicit state, otherwise reads from sessionStorage
 */
export const buildOnboardingPayload = (state = null) => {
  const data = state || getOnboardingState();

  // Normalize citizenship list & deduplicate
  const rawCitizenships =
    data.citizenships ||
    data.citizenshipCountries ||
    (data.citizenship ? [data.citizenship] : []);

  const uniqueCitizenships = Array.isArray(rawCitizenships)
    ? [...new Set(rawCitizenships.filter(Boolean))]
    : [];

  // Normalize workEligibility list & deduplicate countries
  const rawWorkEligibility =
    data.workEligibility ||
    data.addedCountries ||
    [];

  const uniqueWorkEligibility = (Array.isArray(rawWorkEligibility) ? rawWorkEligibility : []).reduce(
    (acc, item) => {
      const countryName = typeof item === 'string' ? item : item?.country;
      if (!countryName || acc.some((x) => x.country === countryName)) return acc;

      const isAuthorized =
        item.legallyAuthorized !== undefined
          ? Boolean(item.legallyAuthorized)
          : item.isAuthorized !== undefined
          ? Boolean(item.isAuthorized)
          : true;

      const requiresSponsorship =
        item.requiresSponsorship !== undefined
          ? Boolean(item.requiresSponsorship)
          : false;

      const authorizationBasis =
        item.authorizationBasis || 'Citizen';

      acc.push({
        country: countryName,
        legallyAuthorized: isAuthorized,
        requiresSponsorship: requiresSponsorship,
        authorizationBasis: authorizationBasis,
        visaType: item.visaType || null,
        authorizationStatus: item.authorizationStatus || 'active',
      });
      return acc;
    },
    []
  );

  // Resume tailoring / optimization normalization
  const resumeOptimization =
    data.resumeOptimization ||
    data.resumeTailoring ||
    'job-specific';

  const autoApproveEdits =
    typeof data.autoApproveEdits === 'boolean'
      ? data.autoApproveEdits
      : true;

  const reviewBeforeSubmit =
    typeof data.reviewBeforeSubmit === 'boolean'
      ? data.reviewBeforeSubmit
      : data.automationMode === 'review-before-submit';

  // Format boolean/string preferences cleanly
  const toStrVal = (val, defaultVal = 'no') => {
    if (val === true || val === 'yes' || val === 'Yes') return 'yes';
    if (val === false || val === 'no' || val === 'No') return 'no';
    if (val === 'prefer-not-to-say' || val === 'Prefer not to say') return 'prefer-not-to-say';
    return val ? String(val) : defaultVal;
  };

  return {
    profile: {
      phone: data.phone || data.phoneNumber || '',
      linkedinUrl: data.linkedinUrl || data.linkedin || '',
      addressLine1: data.addressLine1 || data.address || '',
      city: data.city || '',
      state: data.state || data.stateVal || '',
      postcode: data.postcode || '',
      countyDistrict: data.countyDistrict || '',
      country: data.country || '',
      resumeOptimization: resumeOptimization,
      autoApproveEdits: autoApproveEdits,
      reviewBeforeSubmit: reviewBeforeSubmit,
      openToInPerson: toStrVal(data.openToInPerson, 'yes'),
      willingToRelocate: toStrVal(data.willingToRelocate, 'yes'),
      canStartImmediately: toStrVal(data.canStartImmediately, 'yes'),
      reliableTransportation: toStrVal(data.reliableTransportation, 'yes'),
      needAccommodations: toStrVal(data.needAccommodations || data.workplaceAccommodations, 'no'),
      activeGovernmentClearance: toStrVal(data.activeGovernmentClearance || data.governmentClearance, 'no'),
      foreignGovernmentTies: toStrVal(data.foreignGovernmentTies || data.foreignTies, 'no'),
      gender: data.gender || 'Prefer not to say',
      raceEthnicity: data.raceEthnicity || data.ethnicity || 'Prefer not to say',
      veteranStatus: toStrVal(data.veteranStatus, 'no'),
      disabilityStatus: toStrVal(data.disabilityStatus, 'no'),
      additionalNotes: data.additionalNotes || '',
    },
    citizenships: uniqueCitizenships,
    workEligibility: uniqueWorkEligibility,
  };
};

/**
 * Submit complete onboarding payload to POST /api/onboarding
 * @param {Object} [payloadOrState] - Onboarding payload or state object
 * @param {string} [token] - Optional explicit access token
 */
export const submitOnboarding = async (payloadOrState = null, token = null) => {
  try {
    let payload;
    if (payloadOrState && payloadOrState.profile && (payloadOrState.citizenships || payloadOrState.workEligibility)) {
      payload = payloadOrState;
    } else {
      payload = buildOnboardingPayload(payloadOrState);
    }

    const accessToken = token || getStoredTokens().accessToken;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    let response;
    if (token) {
      response = await fetch(ONBOARDING_ENDPOINTS.SUBMIT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      response = await fetchWithAuth(ONBOARDING_ENDPOINTS.SUBMIT, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

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
        `Onboarding failed (Status ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    // Clear onboarding draft on success
    clearOnboardingState();

    return data;
  } catch (error) {
    console.error('Onboarding submission error:', error);
    throw error;
  }
};

export default {
  getOnboardingState,
  setOnboardingState,
  clearOnboardingState,
  buildOnboardingPayload,
  submitOnboarding,
};
