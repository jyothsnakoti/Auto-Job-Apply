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
export * from './c2cJobService';
export * from './c2cApplicationService';
export * from '../utils/jobHelpers';
export * from './dashboardService';
export * from './applicationService';
export * from './applicationNeedsActionService';
export * from './phoneVerificationService';
export * from './c2cService';
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
  getApplications,
  getApplicationCounts,
  getStoredApplicationsData,
  setStoredApplicationsData,
  getApplicationStatusCategory,
  applyToJobs,
  applyToJobsInBatches,
  extractNumericJobId,
  extractNumericResumeId,
  getStoredAppliedJobIds,
  markJobsAsApplied,
  isJobAlreadyApplied,
  getApplicationStatuses,
  isJobSubmitted,
  isApplicationSubmittedStatus,
  isApplicationActiveStatus,
  isApplicationRetryableStatus,
  clearApplicationStatusCache,
  isApplyNowHiddenForJob,
  extractJobIdFromApplicationRecord,
  getMatchingApplicationForJob,
  normalizeApplicationStatus,
  isApplicationStatusActiveOrCompleted,
  extractApplicationId,
  retryApplication,
  approveApplication,
  skipApplication,
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
export { default as c2cJobService } from './c2cJobService';
export { default as c2cApplicationService } from './c2cApplicationService';
export { default as dashboardService } from './dashboardService';
export { default as applicationService } from './applicationService';
export { default as applicationNeedsActionService } from './applicationNeedsActionService';
export { default as c2cService } from './c2cService';
export { default as endpoints, ENDPOINTS, AUTH_ENDPOINTS, BILLING_ENDPOINTS, ONBOARDING_ENDPOINTS, PROFILE_ENDPOINTS, RESUME_ENDPOINTS, ENHANCE_RESUME_ENDPOINTS, MORE_JOBS_ENDPOINTS, JOB_ENDPOINTS, DASHBOARD_ENDPOINTS, APPLICATION_ENDPOINTS, C2C_AUTO_APPLY_ENDPOINTS, API_BASE_URL, RESUME_API_BASE_URL } from './endpoints';

export default apiClient;


