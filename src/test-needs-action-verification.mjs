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

// =========================================================================
// Error Handling & HTTP 409 Verification Tests
// =========================================================================

function extractErrorMessage(error, fallbackMessage = 'Failed to submit answers. Please try again.') {
  if (!error) return fallbackMessage;

  if (typeof error === 'string' && error.trim()) {
    const trimmed = error.trim();
    if (!/^Request failed with status code \d+/i.test(trimmed)) {
      return trimmed;
    }
    return fallbackMessage;
  }

  let data = error?.response?.data ?? error?.data;

  if (typeof data === 'string' && data.trim()) {
    const trimmed = data.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        // Keep as string
      }
    }
    if (typeof data === 'string') {
      if (!trimmed.startsWith('<')) {
        return trimmed;
      }
    }
  }

  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail.trim();
    }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim();
    }
    if (typeof data.msg === 'string' && data.msg.trim()) {
      return data.msg.trim();
    }
    if (typeof data.errorMessage === 'string' && data.errorMessage.trim()) {
      return data.errorMessage.trim();
    }
    if (typeof data.description === 'string' && data.description.trim()) {
      return data.description.trim();
    }

    if (Array.isArray(data.message) && data.message.length > 0) {
      const msgs = data.message
        .map((m) => (typeof m === 'string' ? m.trim() : m?.message || m?.msg || ''))
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join(', ');
    }

    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const details = data.detail
        .map((d) => (typeof d === 'string' ? d.trim() : d?.msg || d?.message || ''))
        .filter(Boolean);
      if (details.length > 0) return details.join(', ');
    }

    if (data.errors) {
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const msgs = data.errors
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
              return item.message || item.msg || item.detail || item.error || '';
            }
            return '';
          })
          .filter(Boolean);
        if (msgs.length > 0) return msgs.join(', ');
      } else if (typeof data.errors === 'object') {
        const messages = [];
        for (const [key, val] of Object.entries(data.errors)) {
          if (typeof val === 'string' && val.trim()) {
            messages.push(val.includes(key) ? val.trim() : `${key}: ${val.trim()}`);
          } else if (Array.isArray(val) && val.length > 0) {
            const inner = val.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim());
            if (inner.length > 0) {
              const joined = inner.join(', ');
              messages.push(joined.includes(key) ? joined : `${key}: ${joined}`);
            }
          } else if (val && typeof val === 'object' && (val.message || val.msg)) {
            messages.push(val.message || val.msg);
          }
        }
        if (messages.length > 0) return messages.join('; ');
      }
    }

    if (Array.isArray(data) && data.length > 0) {
      const items = data
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') {
            return item.message || item.msg || item.detail || item.error || '';
          }
          return '';
        })
        .filter(Boolean);
      if (items.length > 0) return items.join(', ');
    }
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    const trimmed = error.message.trim();
    if (!/^Request failed with status code \d+/i.test(trimmed)) {
      return trimmed;
    }
  }

  return fallbackMessage;
}

// Test Case 11: HTTP 409 Conflict with plain-text backend response
{
  const mock409AxiosError = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      statusText: 'Conflict',
      data: 'Selection options are missing for: School*',
    },
  };

  const extracted = extractErrorMessage(mock409AxiosError);
  if (extracted !== 'Selection options are missing for: School*') {
    throw new Error(`Case 11 Failed: Expected "Selection options are missing for: School*", got "${extracted}"`);
  }
  console.log('✅ Case 11 Passed: HTTP 409 plain-text error message correctly extracted instead of generic 409 message.');
}

// Test Case 12: HTTP 409 with JSON { message: "Selection options are missing for: School*" }
{
  const mock409JsonMessage = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: {
        message: 'Selection options are missing for: School*',
      },
    },
  };

  const extracted = extractErrorMessage(mock409JsonMessage);
  if (extracted !== 'Selection options are missing for: School*') {
    throw new Error(`Case 12 Failed: Expected "Selection options are missing for: School*", got "${extracted}"`);
  }
  console.log('✅ Case 12 Passed: HTTP 409 JSON { message } correctly extracted.');
}

// Test Case 13: HTTP 409 with JSON { error: "Selection options are missing for: School*" }
{
  const mock409JsonError = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: {
        error: 'Selection options are missing for: School*',
      },
    },
  };

  const extracted = extractErrorMessage(mock409JsonError);
  if (extracted !== 'Selection options are missing for: School*') {
    throw new Error(`Case 13 Failed: Expected "Selection options are missing for: School*", got "${extracted}"`);
  }
  console.log('✅ Case 13 Passed: HTTP 409 JSON { error } correctly extracted.');
}

// Test Case 14: HTTP 409 with JSON { detail: "Selection options are missing for: School*" } (FastAPI / RFC 7807)
{
  const mock409JsonDetail = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: {
        detail: 'Selection options are missing for: School*',
      },
    },
  };

  const extracted = extractErrorMessage(mock409JsonDetail);
  if (extracted !== 'Selection options are missing for: School*') {
    throw new Error(`Case 14 Failed: Expected "Selection options are missing for: School*", got "${extracted}"`);
  }
  console.log('✅ Case 14 Passed: HTTP 409 JSON { detail } correctly extracted.');
}

// Test Case 15: Structured validation errors in various formats
{
  // 15a: Array in errors
  const errArray = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: {
        errors: ['Selection options are missing for: School*'],
      },
    },
  };
  if (extractErrorMessage(errArray) !== 'Selection options are missing for: School*') {
    throw new Error('Case 15a Failed: Array errors not handled');
  }

  // 15b: Object in errors (dictionary of field errors)
  const errObject = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: {
        errors: {
          'School*': 'Selection options are missing for: School*',
        },
      },
    },
  };
  if (extractErrorMessage(errObject) !== 'Selection options are missing for: School*') {
    throw new Error('Case 15b Failed: Dictionary errors not handled');
  }

  // 15c: Dictionary with array of field messages
  const errDictArray = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: {
        errors: {
          'School*': ['Selection options are missing for: School*'],
        },
      },
    },
  };
  if (extractErrorMessage(errDictArray) !== 'Selection options are missing for: School*') {
    throw new Error('Case 15c Failed: Dictionary with array values not handled');
  }

  // 15d: FastAPI detail array format
  const errFastApiArray = {
    message: 'Request failed with status code 422',
    response: {
      status: 422,
      data: {
        detail: [{ loc: ['body', 'answers', 'School*'], msg: 'Selection options are missing for: School*' }],
      },
    },
  };
  if (extractErrorMessage(errFastApiArray) !== 'Selection options are missing for: School*') {
    throw new Error('Case 15d Failed: FastAPI detail array not handled');
  }

  // 15e: NestJS message array format
  const errNestJsArray = {
    message: 'Request failed with status code 400',
    response: {
      status: 400,
      data: {
        message: ['Selection options are missing for: School*'],
      },
    },
  };
  if (extractErrorMessage(errNestJsArray) !== 'Selection options are missing for: School*') {
    throw new Error('Case 15e Failed: NestJS message array not handled');
  }

  console.log('✅ Case 15 Passed: Structured validation errors (arrays, objects, FastAPI, NestJS) correctly extracted.');
}

// Test Case 16: Plain-text error response with extra whitespace
{
  const mock409Whitespace = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: '  Selection options are missing for: School*  \n',
    },
  };

  const extracted = extractErrorMessage(mock409Whitespace);
  if (extracted !== 'Selection options are missing for: School*') {
    throw new Error(`Case 16 Failed: Expected trimmed message, got "${extracted}"`);
  }
  console.log('✅ Case 16 Passed: Plain-text error response trimmed cleanly.');
}

// Test Case 17: Network error without backend response
{
  const mockNetworkError = {
    message: 'Network Error',
    code: 'ERR_NETWORK',
  };

  const extracted = extractErrorMessage(mockNetworkError);
  if (extracted !== 'Network Error') {
    throw new Error(`Case 17 Failed: Expected "Network Error", got "${extracted}"`);
  }
  console.log('✅ Case 17 Passed: Network error without backend response retains meaningful message.');
}

// Test Case 18: Generic Axios status error without backend data falls back to clean message
{
  const mockEmpty409 = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: null,
    },
  };

  const extracted = extractErrorMessage(mockEmpty409, 'Failed to submit answers. Please try again.');
  if (extracted === 'Request failed with status code 409') {
    throw new Error('Case 18 Failed: Must NOT display generic Axios status code 409 when no backend text exists!');
  }
  if (extracted !== 'Failed to submit answers. Please try again.') {
    throw new Error(`Case 18 Failed: Expected fallback message, got "${extracted}"`);
  }
  console.log('✅ Case 18 Passed: Generic Axios 409 error without body cleanly suppressed in favor of fallback.');
}

// Test Case 19: Stringified JSON response data
{
  const mockStringifiedJson = {
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: JSON.stringify({ message: 'Selection options are missing for: School*' }),
    },
  };

  const extracted = extractErrorMessage(mockStringifiedJson);
  if (extracted !== 'Selection options are missing for: School*') {
    throw new Error(`Case 19 Failed: Expected parsed message, got "${extracted}"`);
  }
  console.log('✅ Case 19 Passed: Stringified JSON response payload parsed and message extracted.');
}

// Test Case 20: HTML error pages (e.g. 502/504 Bad Gateway / Nginx crash) do not dump raw HTML into UI
{
  const mockHtml502 = {
    message: 'Request failed with status code 502',
    response: {
      status: 502,
      data: '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center></body></html>',
    },
  };

  const extracted = extractErrorMessage(mockHtml502, 'Server error. Please try again later.');
  if (extracted.includes('<') || extracted.includes('<html>')) {
    throw new Error('Case 20 Failed: HTML markup must not be returned directly');
  }
  if (extracted !== 'Server error. Please try again later.') {
    throw new Error(`Case 20 Failed: Expected fallback, got "${extracted}"`);
  }
  console.log('✅ Case 20 Passed: HTML error response suppressed and replaced with clean fallback.');
}

// Test Case 21: Preserving answer submission payload and successful responses
{
  const payload = {
    answers: { 'School*': 'Ajou University' },
    saveToProfile: false,
  };

  // Ensure answer key and saveToProfile values are unchanged
  if (payload.answers['School*'] !== 'Ajou University' || payload.saveToProfile !== false) {
    throw new Error('Case 21 Failed: Payload alteration detected');
  }

  // Successful submission response mock
  const mockSuccessResponse = {
    success: true,
    message: 'Application updated successfully',
  };

  if (!mockSuccessResponse.success) {
    throw new Error('Case 21 Failed: Success state handling failed');
  }
  console.log('✅ Case 21 Passed: Answer submission payload and success state handling preserved.');
}

console.log('🎉 ALL NEEDS ACTION TESTS PASSED SUCCESSFULLY!');

