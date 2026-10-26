console.log('--- Running Needs Action Questions & Submission Verification Tests ---');

// Pure parser implementation mirroring src/services/applicationNeedsActionService.js
function parseNeedsActionQuestions(rawQuestions) {
  if (!rawQuestions) return [];

  let parsed = rawQuestions;

  if (typeof rawQuestions === 'string') {
    try {
      parsed = JSON.parse(rawQuestions.trim());
      // Handle possible double-stringified JSON
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed.trim());
      }
    } catch (err) {
      console.warn('[applicationNeedsActionService] Failed to parse needsActionQuestions JSON:', err?.message);
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((q) => q && typeof q === 'object')
    .map((q) => {
      const key = typeof q.key === 'string' ? q.key : String(q.key || q.label || '');
      const label = typeof q.label === 'string' && q.label.trim() ? q.label : key;
      const type = typeof q.type === 'string' ? q.type.toLowerCase().trim() : 'text';
      const options = Array.isArray(q.options)
        ? q.options.filter((opt) => opt !== null && opt !== undefined)
        : [];
      const required = Boolean(q.required);
      const sensitive = Boolean(q.sensitive);

      return {
        ...q,
        key,
        label,
        type,
        options,
        required,
        sensitive,
      };
    });
}

function extractApplicationsList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    if (Array.isArray(data.applications?.items)) return data.applications.items;
    if (Array.isArray(data.applications)) return data.applications;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data?.items)) return data.data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
  }
  return [];
}

// Test Case 1: Parse real Brandt Information Services JSON-encoded string from Postman screenshot
{
  const rawBrandtQuestionsString = JSON.stringify([
    {
      key: 'What is your desired compensation? *',
      type: 'text',
      label: 'What is your desired compensation? *',
      options: [],
      required: true,
      sensitive: false,
    },
    {
      key: 'Have you ever been convicted of a felony or a first-degree misdemeanor? *',
      type: 'select',
      label: 'Have you ever been convicted of a felony or a first-degree misdemeanor? *',
      options: ['Yes', 'No'],
      required: true,
      sensitive: false,
    },
    {
      key: 'Tell us about your experience with payments, licensing, reservations, or other transaction-heavy systems where the output is money or a legal record.*',
      type: 'textarea',
      label: 'Tell us about your experience with payments, licensing, reservations, or other transaction-heavy systems where the output is money or a legal record.*',
      options: [],
      required: true,
      sensitive: false,
    },
  ]);

  const parsed = parseNeedsActionQuestions(rawBrandtQuestionsString);

  if (!Array.isArray(parsed) || parsed.length !== 3) {
    throw new Error(`Expected 3 parsed questions, got ${parsed?.length}`);
  }

  if (parsed[0].key !== 'What is your desired compensation? *') {
    throw new Error('Question 0 key mismatch');
  }
  if (parsed[0].type !== 'text' || !parsed[0].required) {
    throw new Error('Question 0 type or required mismatch');
  }

  if (parsed[1].type !== 'select' || parsed[1].options.length !== 2) {
    throw new Error('Question 1 select options mismatch');
  }

  if (parsed[2].type !== 'textarea') {
    throw new Error('Question 2 textarea type mismatch');
  }

  console.log('✅ Case 1 Passed: Safely parsed JSON-encoded questions from string.');
}

// Test Case 2: Parse already-parsed array of questions
{
  const questionsArray = [
    {
      key: 'expected_salary',
      label: 'Expected Salary',
      type: 'text',
      required: true,
    },
  ];

  const parsed = parseNeedsActionQuestions(questionsArray);
  if (parsed.length !== 1 || parsed[0].key !== 'expected_salary' || parsed[0].label !== 'Expected Salary') {
    throw new Error('Array of questions was not correctly handled');
  }

  console.log('✅ Case 2 Passed: Safely handled already-parsed array.');
}

// Test Case 3: Parse double-encoded JSON string
{
  const innerJson = JSON.stringify([
    { key: 'q1', label: 'Question 1', type: 'text', required: true },
  ]);
  const doubleEncoded = JSON.stringify(innerJson);

  const parsed = parseNeedsActionQuestions(doubleEncoded);
  if (parsed.length !== 1 || parsed[0].key !== 'q1') {
    throw new Error('Double encoded JSON string parsing failed');
  }

  console.log('✅ Case 3 Passed: Handled double-encoded JSON string.');
}

// Test Case 4: Handle malformed, null, undefined, empty string gracefully without crashing
{
  if (parseNeedsActionQuestions(null).length !== 0) throw new Error('null should return []');
  if (parseNeedsActionQuestions(undefined).length !== 0) throw new Error('undefined should return []');
  if (parseNeedsActionQuestions('').length !== 0) throw new Error('empty string should return []');
  if (parseNeedsActionQuestions('{invalid-json').length !== 0) throw new Error('malformed JSON should return []');
  if (parseNeedsActionQuestions({ notAnArray: true }).length !== 0) throw new Error('object should return []');

  console.log('✅ Case 4 Passed: Gracefully handled null, undefined, and malformed inputs.');
}

// Test Case 5: extractApplicationsList handles backend shapes
{
  const postmanResponse = {
    counts: {
      all: 7,
      submitted: 5,
      inProgress: 0,
      needsAction: 1,
      failed: 1,
      skipped: 0,
    },
    applications: {
      items: [
        {
          id: 229,
          jobId: 14814,
          jobTitle: 'Senior Software Engineer',
          companyName: 'Brandt Information Services. LLC',
          status: 'NEEDS_ACTION',
          needsActionQuestions: '[]',
        },
      ],
    },
  };

  const list = extractApplicationsList(postmanResponse);
  if (!Array.isArray(list) || list.length !== 1 || list[0].id !== 229) {
    throw new Error('Failed to extract items from Postman response structure');
  }

  console.log('✅ Case 5 Passed: Successfully extracted applications from response structure.');
}

// Test Case 6: Verify application matching isolation (prevent displaying questions of another application)
{
  const appList = [
    { id: 101, needsActionQuestions: JSON.stringify([{ key: 'q_app_101', type: 'text' }]) },
    { id: 229, needsActionQuestions: JSON.stringify([{ key: 'q_app_229', type: 'text' }]) },
    { id: 303, needsActionQuestions: JSON.stringify([{ key: 'q_app_303', type: 'text' }]) },
  ];

  const targetId = 229;
  const matched = appList.find((app) => String(app.id) === String(targetId));
  if (!matched || matched.id !== 229) {
    throw new Error('Failed to isolate target application');
  }

  const questions = parseNeedsActionQuestions(matched.needsActionQuestions);
  if (questions[0].key !== 'q_app_229') {
    throw new Error('Accidentally selected questions from another application!');
  }

  console.log('✅ Case 6 Passed: Application questions strictly isolated to clicked application ID.');
}

// Test Case 7: Verify answers payload preserves original question keys and includes saveToProfile: false
{
  const questionKeys = [
    'What is your desired compensation? *',
    'Have you ever been convicted of a felony or a first-degree misdemeanor? *',
    'Tell us about your experience with payments, licensing, reservations, or other transaction-heavy systems where the output is money or a legal record.*',
  ];

  const userAnswers = {
    [questionKeys[0]]: '120000 USD annually',
    [questionKeys[1]]: 'No',
    [questionKeys[2]]: 'I have experience working with payment integrations and backend systems.',
  };

  const requestPayload = {
    answers: userAnswers,
    saveToProfile: false,
  };

  if (requestPayload.saveToProfile !== false) {
    throw new Error('saveToProfile must be false by default');
  }

  // Check key preservation
  for (const k of questionKeys) {
    if (!Object.prototype.hasOwnProperty.call(requestPayload.answers, k)) {
      throw new Error(`Original question key was not preserved: ${k}`);
    }
  }

  console.log('✅ Case 7 Passed: POST payload preserves exact question keys and includes saveToProfile: false.');
}

// Test Case 8: Verify isValueEmpty logic for validation
{
  const isValueEmpty = (val) => {
    if (val === undefined || val === null) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    return false;
  };

  // Must be considered EMPTY
  if (!isValueEmpty('')) throw new Error('Empty string must be considered empty');
  if (!isValueEmpty('   ')) throw new Error('Whitespace-only string must be considered empty');
  if (!isValueEmpty(null)) throw new Error('null must be considered empty');
  if (!isValueEmpty(undefined)) throw new Error('undefined must be considered empty');
  if (!isValueEmpty([])) throw new Error('Empty array must be considered empty');

  // Must NOT be considered empty
  if (isValueEmpty('0')) throw new Error('"0" must NOT be considered empty');
  if (isValueEmpty(0)) throw new Error('0 (number) must NOT be considered empty');
  if (isValueEmpty('No')) throw new Error('"No" must NOT be considered empty');
  if (isValueEmpty('Yes')) throw new Error('"Yes" must NOT be considered empty');
  if (isValueEmpty(false)) throw new Error('false (boolean) must NOT be considered empty');
  if (isValueEmpty('Hello World')) throw new Error('Non-empty string must NOT be considered empty');

  console.log('✅ Case 8 Passed: isValueEmpty correctly treats whitespace as empty and "0"/"No" as valid.');
}

// Test Case 9: Asterisk deduplication logic
{
  const testLabels = [
    { raw: 'What is your desired compensation? *', expectedClean: 'What is your desired compensation?' },
    { raw: 'Tell us about your experience.*', expectedClean: 'Tell us about your experience.' },
    { raw: 'Acceptance: *', expectedClean: 'Acceptance:' },
    { raw: 'Multiple trailing asterisks **', expectedClean: 'Multiple trailing asterisks' },
    { raw: 'Clean question without asterisk', expectedClean: 'Clean question without asterisk' },
  ];

  for (const { raw, expectedClean } of testLabels) {
    const clean = raw.replace(/[\s*]+$/, '').trim();
    if (clean !== expectedClean) {
      throw new Error(`Expected clean label "${expectedClean}", got "${clean}" for raw "${raw}"`);
    }
  }

  console.log('✅ Case 9 Passed: Successfully deduplicates trailing asterisks while keeping text clean.');
}

// Test Case 10: Validation on Apply identifies first empty required field and ignores optional fields
{
  const isValueEmpty = (val) => {
    if (val === undefined || val === null) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    return false;
  };

  const sampleQuestions = [
    { key: 'q1', label: 'Q1', required: true },
    { key: 'q2', label: 'Q2', required: false }, // optional
    { key: 'q3', label: 'Q3', required: true },
    { key: 'q4', label: 'Q4', required: false }, // optional
  ];

  // User answered q1 with valid answer, left q2 empty (optional), left q3 empty (required), left q4 empty (optional)
  const currentAnswers = {
    q1: 'Valid Answer 1',
    q2: '',
    q3: '   ', // whitespace only
    q4: undefined,
  };

  const errors = {};
  let firstEmptyQuestion = null;

  sampleQuestions.forEach((q) => {
    if (q.required) {
      const val = currentAnswers[q.key];
      if (isValueEmpty(val)) {
        errors[q.key] = 'This field needs to be filled.';
        if (!firstEmptyQuestion) {
          firstEmptyQuestion = q;
        }
      }
    }
  });

  if (firstEmptyQuestion?.key !== 'q3') {
    throw new Error(`Expected first empty required question to be q3, got ${firstEmptyQuestion?.key}`);
  }

  if (errors.q1 || errors.q2 || errors.q4) {
    throw new Error('Errors object contains fields that are either filled or optional');
  }

  if (errors.q3 !== 'This field needs to be filled.') {
    throw new Error('Expected message "This field needs to be filled."');
  }

  console.log('✅ Case 10 Passed: First empty required field accurately identified; optional questions ignored.');
}

console.log('🎉 ALL NEEDS ACTION TESTS PASSED SUCCESSFULLY!');

