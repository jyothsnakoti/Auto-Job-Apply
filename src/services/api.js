import { apiClient, axiosInstance } from './authService';

export * from './endpoints';
export * from './authService';
export * from './billingPlans';
export * from './onboardingService';
export * from './profileService';
export * from './personalProfileService';
export * from './locationProfileService';
export * from './settingsProfileService';
export * from './workPreferencesProfileService';
export * from './resumeService';
export * from './enhanceResumeService';
export * from './enhancedResumeDownloadService';
export * from './enhancedAtsService';
export * from './jobService';
export * from './dashboardService';
export * from './applicationService';
export {
  getStoredAuthToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
  authenticatedFetch,
  getBillingPlans,
  getStripePublishableKey,
  createPaymentIntent,
  confirmBackendPayment,
  createCardUpdateIntent,
  confirmCardUpdate,
  getSavedCards,
  getPaymentCards,
  getPaymentMethod,
  setDefaultCard,
  deleteSavedCard,
  getBillingStatus,
  getBillingHistory,
  recoverBilling,
  selectTrialPlan,
  toggleAutopay,
} from './billingService';
export {
  getDashboardData,
  getStoredDashboardData,
  setStoredDashboardData,
} from './dashboardService';
export {
  applyToJobs,
  applyToJobsInBatches,
  extractNumericJobId,
  extractNumericResumeId,
  getStoredAppliedJobIds,
  markJobsAsApplied,
  isJobAlreadyApplied,
  getApplicationStatuses,
  isApplyNowHiddenForJob,
  extractJobIdFromApplicationRecord,
  getMatchingApplicationForJob,
  normalizeApplicationStatus,
  isApplicationStatusActiveOrCompleted,
} from './applicationService';

export { apiClient as api, apiClient, axiosInstance };
export { default as authService } from './authService';
export { default as billingService } from './billingService';
export { default as onboardingService } from './onboardingService';
export { default as billingPlans } from './billingPlans';
export { default as profileService } from './profileService';
export { default as personalProfileService } from './personalProfileService';
export { default as locationProfileService } from './locationProfileService';
export { default as settingsProfileService } from './settingsProfileService';
export { default as workPreferencesProfileService } from './workPreferencesProfileService';
export { default as resumeService } from './resumeService';
export { default as enhanceResumeService } from './enhanceResumeService';
export { default as enhancedResumeDownloadService } from './enhancedResumeDownloadService';
export { default as enhancedAtsService } from './enhancedAtsService';
export { default as moreJobsService } from './moreJobsService';
export { default as jobService } from './jobService';
export { default as dashboardService } from './dashboardService';
export { default as applicationService } from './applicationService';
export { default as endpoints, ENDPOINTS, AUTH_ENDPOINTS, BILLING_ENDPOINTS, ONBOARDING_ENDPOINTS, PROFILE_ENDPOINTS, RESUME_ENDPOINTS, ENHANCE_RESUME_ENDPOINTS, MORE_JOBS_ENDPOINTS, JOB_ENDPOINTS, DASHBOARD_ENDPOINTS, API_BASE_URL, RESUME_API_BASE_URL } from './endpoints';

export default apiClient;


