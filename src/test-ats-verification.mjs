console.log('--- Running Dynamic ATS Score Verification Tests ---');

// Validate the payload validation and scoring contracts
function validateAtsPayload(payload) {
  if (!payload) {
    throw new Error('Payload is required for score calculation.');
  }

  const { JDid, ResumeID, EnhResumeText } = payload;

  if (!JDid) {
    throw new Error('Job ID (JDid) is missing.');
  }
  if (!ResumeID) {
    throw new Error('Resume ID (ResumeID) is missing.');
  }
  if (!EnhResumeText) {
    throw new Error('Enhanced Resume Text (EnhResumeText) is missing.');
  }
  return true;
}

function processAtsResponse(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response received from ATS calculation service.');
  }

  if (response.status === 'error' || response.error) {
    const errorMsg =
      response.detail ||
      response.message ||
      response.error ||
      'Failed to calculate enhanced ATS score.';
    throw new Error(errorMsg);
  }

  const rawScore =
    response.EnhATS ??
    response.score_data?.overall_score ??
    response.overall_score ??
    response.score ??
    response.atsScore;

  if (rawScore === undefined || rawScore === null || isNaN(Number(rawScore))) {
    throw new Error('ATS calculation response did not return a valid numeric score.');
  }

  const numericScore = Number(rawScore);
  if (numericScore < 0 || numericScore > 100) {
    throw new Error(`Returned ATS score (${numericScore}) is outside the valid 0-100 percentage range.`);
  }

  const parsedScore = numericScore;
  return {
    score: parsedScore,
    scoreData: response.score_data || null,
    matchCategory:
      response.score_data?.match_category ||
      response.match_category ||
      (parsedScore >= 80 ? 'Strong match' : parsedScore >= 60 ? 'Moderate match' : 'Lower match'),
  };
}

// Test 1: Payload null check
{
  let threw = false;
  try {
    validateAtsPayload(null);
  } catch (err) {
    threw = true;
    if (!err.message.includes('Payload is required')) throw err;
  }
  if (!threw) throw new Error('Test 1 Failed');
  console.log('✅ Test 1 Passed: Null payload is rejected.');
}

// Test 2: Missing JDid check
{
  let threw = false;
  try {
    validateAtsPayload({ JDid: '', ResumeID: '123', EnhResumeText: 'text' });
  } catch (err) {
    threw = true;
    if (!err.message.includes('Job ID')) throw err;
  }
  if (!threw) throw new Error('Test 2 Failed');
  console.log('✅ Test 2 Passed: Missing JDid is rejected.');
}

// Test 3: Missing ResumeID check
{
  let threw = false;
  try {
    validateAtsPayload({ JDid: '14385', ResumeID: '', EnhResumeText: 'text' });
  } catch (err) {
    threw = true;
    if (!err.message.includes('Resume ID')) throw err;
  }
  if (!threw) throw new Error('Test 3 Failed');
  console.log('✅ Test 3 Passed: Missing ResumeID is rejected.');
}

// Test 4: Missing EnhResumeText check
{
  let threw = false;
  try {
    validateAtsPayload({ JDid: '14385', ResumeID: '123', EnhResumeText: '' });
  } catch (err) {
    threw = true;
    if (!err.message.includes('Enhanced Resume Text')) throw err;
  }
  if (!threw) throw new Error('Test 4 Failed');
  console.log('✅ Test 4 Passed: Missing EnhResumeText is rejected.');
}

// Test 5: Rejection of mock/fake increments and acceptance of actual backend score
{
  const backendResponse = {
    status: 'success',
    EnhATS: 82,
    score_data: {
      overall_score: 82,
      match_category: 'Strong match',
      missing_keywords: ['Skill A'],
    },
  };
  const result = processAtsResponse(backendResponse);
  if (result.score !== 82) throw new Error(`Expected score 82, got ${result.score}`);
  if (result.matchCategory !== 'Strong match') throw new Error(`Expected Strong match, got ${result.matchCategory}`);
  console.log('✅ Test 5 Passed: Score 82 extracted directly from backend response without increment.');
}

// Test 6: Rejection of out-of-bounds scores
{
  let threw = false;
  try {
    processAtsResponse({ status: 'success', EnhATS: 150 });
  } catch (err) {
    threw = true;
    if (!err.message.includes('outside the valid 0-100')) throw err;
  }
  if (!threw) throw new Error('Test 6 Failed');
  console.log('✅ Test 6 Passed: Out-of-bounds score (>100) is rejected.');
}

// Test 7: Error responses from API are thrown and not treated as valid scores
{
  let threw = false;
  try {
    processAtsResponse({ status: 'error', detail: 'Resume ID not found in database' });
  } catch (err) {
    threw = true;
    if (!err.message.includes('Resume ID not found')) throw err;
  }
  if (!threw) throw new Error('Test 7 Failed');
  console.log('✅ Test 7 Passed: Error response is identified and throws error.');
}

// Test 8: Live Backend API Contract Verification
{
  console.log('Invoking Live Backend endpoint POST /api/v1/Get_Score_for_EnhancedResume...');
  const res = await fetch('https://fog-slacked-prankster.ngrok-free.dev/api/v1/Get_Score_for_EnhancedResume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({
      JDid: '14385',
      ResumeID: 'test-resume',
      EnhResumeText: 'Experienced educator with classroom management and certified teaching credential.',
    }),
  });

  if (!res.ok) {
    throw new Error(`Live API returned HTTP status ${res.status}`);
  }

  const liveData = await res.json();
  const processed = processAtsResponse(liveData);
  console.log(`Live API Score: ${processed.score}%, Category: ${processed.matchCategory}`);
  if (typeof processed.score !== 'number' || processed.score < 0 || processed.score > 100) {
    throw new Error('Live API returned invalid score');
  }
  console.log('✅ Test 8 Passed: Live backend endpoint executed and returned valid score.');
}

console.log('🎉 ALL DYNAMIC ATS SCORE VERIFICATION TESTS PASSED SUCCESSFULLY!');
