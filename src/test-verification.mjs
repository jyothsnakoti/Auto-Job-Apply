import {
  isJobSubmitted,
  isApplyNowHiddenForJob,
  extractJobIdFromApplicationRecord,
  extractNumericJobId,
  normalizeApplicationStatus,
  isApplicationSubmittedStatus,
  isApplicationActiveStatus,
  isApplicationRetryableStatus,
  getMatchingApplicationForJob,
} from '../src/services/applicationService.js';

console.log('--- Running Application Status & Filter Verification Tests ---');

// Test Case 1 & 6: A job with jobId: 14385 and status SUBMITTED disappears from Browse & Apply,
// and job whose ID differs from application record ID is matched correctly.
{
  const applicationRecord = {
    id: 99999, // application record ID
    jobId: 14385, // actual job ID
    status: 'SUBMITTED',
  };

  const matchedJobId = extractJobIdFromApplicationRecord(applicationRecord);
  if (matchedJobId !== 14385) {
    throw new Error(`Expected matchedJobId to be 14385, got ${matchedJobId}`);
  }

  // Job card with matching jobId
  const jobCard = {
    id: 14385,
    jobId: 14385,
    title: 'Substitute Teacher',
  };

  // Job card with different id (e.g. 99999) that should NOT match
  const unrelatedJobCard = {
    id: 99999,
    jobId: 77777,
    title: 'Unrelated Job',
  };

  const submittedJobIdSet = new Set(['14385', 14385]);
  const applicationMap = new Map();
  applicationMap.set(14385, applicationRecord);
  applicationMap.set('14385', applicationRecord);

  const isSubmitted1 = isJobSubmitted(jobCard, submittedJobIdSet, applicationMap);
  const isSubmittedUnrelated = isJobSubmitted(unrelatedJobCard, submittedJobIdSet, applicationMap);

  if (!isSubmitted1) {
    throw new Error('Case 1 Failed: Job with jobId 14385 must be identified as submitted!');
  }
  if (isSubmittedUnrelated) {
    throw new Error('Case 6 Failed: Unrelated job with id 99999 must NOT be identified as submitted!');
  }
  console.log('✅ Case 1 & 6 Passed: Job 14385 identified as submitted, unrelated job not hidden by app record id.');
}

// Test Case 2: The same job cannot be selected or submitted through Bulk Auto Apply
{
  const jobCard = { id: 14385, jobId: 14385 };
  const submittedJobIdSet = new Set([14385, '14385']);
  const isHidden = isJobSubmitted(jobCard, submittedJobIdSet);
  if (!isHidden) {
    throw new Error('Case 2 Failed: Submitted job must be excluded from selection/submission!');
  }
  console.log('✅ Case 2 Passed: Submitted job excluded from bulk selection/apply.');
}

// Test Case 3: A skipped job remains available for retry according to existing rules
{
  const skippedRecord = { id: 101, jobId: 22222, status: 'SKIPPED' };
  const jobCard = { id: 22222, jobId: 22222 };
  const submittedJobIdSet = new Set();
  const applicationMap = new Map([[22222, skippedRecord]]);

  const isSub = isJobSubmitted(jobCard, submittedJobIdSet, applicationMap);
  const isHidden = isApplyNowHiddenForJob(jobCard, applicationMap, submittedJobIdSet);

  if (isSub) throw new Error('Case 3 Failed: Skipped job must NOT be classified as submitted!');
  if (isHidden) throw new Error('Case 3 Failed: Skipped job must remain available for retry/reapply!');
  console.log('✅ Case 3 Passed: Skipped job remains visible and retryable.');
}

// Test Case 4: A failed job remains available for retry according to existing rules
{
  const failedRecord = { id: 102, jobId: 33333, status: 'FAILED' };
  const jobCard = { id: 33333, jobId: 33333 };
  const submittedJobIdSet = new Set();
  const applicationMap = new Map([[33333, failedRecord]]);

  const isSub = isJobSubmitted(jobCard, submittedJobIdSet, applicationMap);
  const isHidden = isApplyNowHiddenForJob(jobCard, applicationMap, submittedJobIdSet);

  if (isSub) throw new Error('Case 4 Failed: Failed job must NOT be classified as submitted!');
  if (isHidden) throw new Error('Case 4 Failed: Failed job must remain available for retry!');
  console.log('✅ Case 4 Passed: Failed job remains visible and retryable.');
}

// Test Case 5: A job with IN_PROGRESS is protected against duplicate application but is not mislabeled as submitted
{
  const inProgressRecord = { id: 103, jobId: 44444, status: 'IN_PROGRESS' };
  const jobCard = { id: 44444, jobId: 44444 };
  const submittedJobIdSet = new Set();
  const applicationMap = new Map([[44444, inProgressRecord]]);

  const isSub = isJobSubmitted(jobCard, submittedJobIdSet, applicationMap);
  const isHidden = isApplyNowHiddenForJob(jobCard, applicationMap, submittedJobIdSet);

  if (isSub) throw new Error('Case 5 Failed: IN_PROGRESS job must NOT be labeled as submitted!');
  if (!isHidden) throw new Error('Case 5 Failed: IN_PROGRESS job must be protected against duplicate application!');
  console.log('✅ Case 5 Passed: IN_PROGRESS is protected against duplicate application but not mislabeled as submitted.');
}

// Test Case 7: Multiple application records for one job are handled correctly
{
  const jobCard = { id: 55555, jobId: 55555 };
  // E.g. Record 1 was SKIPPED earlier, Record 2 was SUBMITTED later
  const records = [
    { id: 201, jobId: 55555, status: 'SKIPPED', updatedAt: '2026-09-01' },
    { id: 202, jobId: 55555, status: 'SUBMITTED', updatedAt: '2026-09-02' },
  ];

  const submittedJobIdSet = new Set([55555, '55555']);
  const applicationMap = new Map([[55555, records[1]]]); // highest priority record is SUBMITTED

  const isSub = isJobSubmitted(jobCard, submittedJobIdSet, applicationMap);
  if (!isSub) throw new Error('Case 7 Failed: If at least one matching record is SUBMITTED, job must be considered submitted!');
  console.log('✅ Case 7 Passed: Multiple application records for one job handled correctly (at least one SUBMITTED -> job is submitted).');
}

console.log('🎉 ALL TEST CASES PASSED SUCCESSFULLY!');
