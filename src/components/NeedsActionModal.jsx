import { useState, useEffect, useCallback, useId } from 'react';
import {
  fetchNeedsActionQuestions,
  parseNeedsActionQuestions,
  submitNeedsActionAnswers,
  extractErrorMessage,
} from '../services/applicationNeedsActionService';
import { extractApplicationId } from '../services/applicationService';

/**
 * NeedsActionModal component
 *
 * Renders the question-and-answer flow for applications in NEEDS_ACTION status.
 * Dynamically renders question types (text, textarea, select, Yes/No, etc.)
 * Validates required questions and submits answers using the existing API service.
 */
export default function NeedsActionModal({ application, onClose, onSuccess, onShowToast }) {
  const formId = useId();

  // Extract application ID
  const appId =
    extractApplicationId(application) ||
    application?.id ||
    application?.applicationId ||
    application?.application_id ||
    null;

  // Header display details
  const companyName =
    application?.companyName ||
    application?.company ||
    application?.job?.companyName ||
    application?.job?.company ||
    'Company';

  const jobTitle =
    application?.jobTitle ||
    application?.title ||
    application?.job?.jobTitle ||
    application?.job?.title ||
    'Position';

  // Questions state
  const [questions, setQuestions] = useState(() => {
    if (application?.needsActionQuestions) {
      return parseNeedsActionQuestions(application.needsActionQuestions);
    }
    return [];
  });

  const [answers, setAnswers] = useState({});
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Toast notification state for validation feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const showToast = useCallback((message, type = 'error') => {
    setToast({ show: true, message, type });
    if (typeof onShowToast === 'function') {
      onShowToast(message, type);
    }
  }, [onShowToast]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Fetch the latest questions for this specific application
  const loadQuestions = useCallback(async () => {
    if (!appId) {
      setFetchError('Valid Application ID is missing.');
      return;
    }

    setIsLoadingQuestions(true);
    setFetchError(null);

    try {
      const result = await fetchNeedsActionQuestions(appId);

      // Verify that questions belong to the selected application
      if (result?.application) {
        const resultAppId =
          extractApplicationId(result.application) ||
          result.application.id ||
          result.application.applicationId;

        if (String(resultAppId) !== String(appId)) {
          console.warn('[NeedsActionModal] Application ID mismatch in response:', {
            expected: appId,
            received: resultAppId,
          });
          setQuestions([]);
          return;
        }
      }

      const fetchedQuestions = Array.isArray(result?.questions) ? result.questions : [];
      setQuestions(fetchedQuestions);
    } catch (err) {
      console.error('[NeedsActionModal] Error fetching questions:', err);
      // If we already had questions from the row data, don't completely lock out the user
      if (!questions || questions.length === 0) {
        setFetchError(extractErrorMessage(err, 'Failed to load questions. Please check your connection.'));
      }
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [appId, questions]);

  // Load questions on mount or when appId changes
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  // Update a single answer value and clear its error
  const handleAnswerChange = (questionKey, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value,
    }));

    if (validationErrors[questionKey]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[questionKey];
        return copy;
      });
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  // Helper to test if an answer value is empty or whitespace-only
  const isValueEmpty = (val) => {
    if (val === undefined || val === null) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    return false;
  };

  // Validate all required questions
  const validateForm = () => {
    const errors = {};
    let firstEmptyQuestion = null;

    questions.forEach((q) => {
      if (q.required) {
        const val = answers[q.key];
        if (isValueEmpty(val)) {
          errors[q.key] = 'This field needs to be filled.';
          if (!firstEmptyQuestion) {
            firstEmptyQuestion = q;
          }
        }
      }
    });

    setValidationErrors(errors);
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstEmptyQuestion,
    };
  };

  // Handle Apply / Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!appId) {
      setSubmitError('Invalid application ID. Cannot submit answers.');
      return;
    }

    const { isValid, firstEmptyQuestion } = validateForm();
    if (!isValid && firstEmptyQuestion) {
      // Show toast notification once per Apply click
      showToast('This field needs to be filled.', 'error');

      // Scroll the first empty required field into view
      const firstInputId = `${formId}-${firstEmptyQuestion.key}`;
      const element = document.getElementById(firstInputId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the corresponding input field if possible
        setTimeout(() => {
          try {
            if (typeof element.focus === 'function' && element.tagName !== 'DIV') {
              element.focus();
            } else {
              const focusable = element.querySelector('input, textarea, select, button');
              if (focusable && typeof focusable.focus === 'function') {
                focusable.focus();
              }
            }
          } catch {
            // ignore focus errors
          }
        }, 150);
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        answers,
        saveToProfile,
      };

      const result = await submitNeedsActionAnswers(appId, payload);

      // On successful submission: invoke success callback
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('[NeedsActionModal] Submission failed:', err);
      // Keep modal open, preserve answers, and display backend error message
      setSubmitError(extractErrorMessage(err, 'Failed to submit answers. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if options list represents a standard Yes/No question
  const isYesNoOptions = (options) => {
    if (!Array.isArray(options) || options.length !== 2) return false;
    const lower = options.map((o) => String(o).trim().toLowerCase());
    return lower.includes('yes') && lower.includes('no');
  };

  // Render dynamic question input field
  const renderQuestionField = (q) => {
    const questionKey = q.key;
    const inputId = `${formId}-${questionKey}`;
    const fieldError = validationErrors[questionKey];
    const currentValue = answers[questionKey] ?? '';
    const qType = (q.type || 'text').toLowerCase();
    const options = Array.isArray(q.options) ? q.options : [];

    // Render Yes/No pills for binary options
    if (qType === 'select' && isYesNoOptions(options)) {
      return (
        <div>
          <div className="flex items-center gap-3 mt-1.5" id={inputId}>
            {options.map((opt) => {
              const optStr = String(opt);
              const isSelected = currentValue === optStr;
              const isYes = optStr.toLowerCase() === 'yes';

              return (
                <button
                  key={optStr}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAnswerChange(questionKey, optStr)}
                  className={`h-10 px-5 rounded-xl border text-[13.5px] font-semibold transition-all cursor-pointer flex items-center gap-2 select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? isYes
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200/70'
                        : 'border-slate-700 bg-slate-100 text-slate-800 ring-2 ring-slate-200'
                      : fieldError
                      ? 'border-rose-300 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? isYes
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-slate-700 bg-slate-700'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{optStr}</span>
                </button>
              );
            })}
          </div>
          {fieldError && (
            <p className="text-[12px] font-medium text-rose-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{fieldError}</span>
            </p>
          )}
        </div>
      );
    }

    // Render Dropdown Select when options exist
    if (qType === 'select' && options.length > 0) {
      return (
        <div>
          <div className="relative mt-1.5">
            <select
              id={inputId}
              value={currentValue}
              disabled={isSubmitting}
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-[13.5px] bg-white transition-all appearance-none cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                fieldError
                  ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20 text-slate-800'
                  : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 text-slate-800'
              }`}
            >
              <option value="">Select an option...</option>
              {options.map((opt, optIdx) => {
                const optVal = typeof opt === 'object' && opt !== null ? opt.value ?? opt.label : opt;
                const optLabel = typeof opt === 'object' && opt !== null ? opt.label ?? opt.value : opt;
                return (
                  <option key={optIdx} value={optVal}>
                    {optLabel}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {fieldError && (
            <p className="text-[12px] font-medium text-rose-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{fieldError}</span>
            </p>
          )}
        </div>
      );
    }

    // Render Textarea for multi-line written responses
    if (qType === 'textarea') {
      return (
        <div>
          <textarea
            id={inputId}
            rows={3}
            value={currentValue}
            disabled={isSubmitting}
            onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            placeholder="Type your detailed answer here..."
            className={`w-full px-3.5 py-2.5 rounded-xl border text-[13.5px] placeholder-slate-400 focus:outline-none transition-all resize-y mt-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              fieldError
                ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20 text-slate-800'
                : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 bg-white text-slate-800'
            }`}
          />
          {fieldError && (
            <p className="text-[12px] font-medium text-rose-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{fieldError}</span>
            </p>
          )}
        </div>
      );
    }

    // Default: Standard Text Input (handles type="text", unexpected types, or select with empty options)
    return (
      <div>
        <input
          id={inputId}
          type={qType === 'number' ? 'number' : 'text'}
          value={currentValue}
          disabled={isSubmitting}
          onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
          placeholder="Enter your answer..."
          className={`w-full px-3.5 py-2.5 rounded-xl border text-[13.5px] placeholder-slate-400 focus:outline-none transition-all mt-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
            fieldError
              ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20 text-slate-800'
              : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 bg-white text-slate-800'
          }`}
        />
        {fieldError && (
          <p className="text-[12px] font-medium text-rose-600 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{fieldError}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shrink-0 mt-0.5 shadow-2xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight leading-snug">
                Complete Required Questions
              </h2>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#64748B] mt-0.5 truncate">
                <span className="font-semibold text-slate-700 truncate">{companyName}</span>
                <span className="text-slate-300">•</span>
                <span className="truncate">{jobTitle}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Loading Indicator */}
          {isLoadingQuestions && questions.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <svg className="w-8 h-8 animate-spin text-[#4F46E5] mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-[13.5px] font-medium text-slate-600">Loading required questions...</p>
            </div>
          )}

          {/* Fetch Error Banner */}
          {fetchError && questions.length === 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">{fetchError}</p>
                <button
                  type="button"
                  onClick={loadQuestions}
                  className="mt-2 text-xs font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                >
                  Retry loading questions
                </button>
              </div>
            </div>
          )}

          {/* Empty Questions State */}
          {!isLoadingQuestions && !fetchError && questions.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-slate-800">No Action Required</h3>
              <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
                No incomplete questions were found for this application.
              </p>
            </div>
          )}

          {/* Questions Form */}
          {questions.length > 0 && (
            <div className="space-y-6">
              {questions.map((q, idx) => {
                const rawText = String(q.label || q.key || '').trim();
                // Strip any existing trailing asterisk(s) and whitespace so we don't duplicate it
                const cleanLabelText = rawText.replace(/[\s*]+$/, '').trim();
                const isRequired = Boolean(q.required);
                const isSensitive = Boolean(q.sensitive);

                return (
                  <div
                    key={q.key || idx}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 transition-all hover:border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <label
                        htmlFor={`${formId}-${q.key}`}
                        className="text-[13.5px] font-semibold text-slate-800 leading-snug cursor-pointer select-none"
                      >
                        <span>{cleanLabelText}</span>
                        {isRequired && (
                          <span className="text-rose-500 font-medium ml-1" aria-hidden="true">
                            *
                          </span>
                        )}
                      </label>

                      {isSensitive && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                            title="Confidential response"
                          >
                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Sensitive</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {renderQuestionField(q, idx)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/60 flex flex-col gap-3 shrink-0">
          {/* Submit Error Alert */}
          {submitError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px] flex items-start gap-2.5 transition-all"
            >
              <svg className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium flex-1 min-w-0 break-words leading-relaxed">{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Save to Profile Option */}
            <label className="flex items-center gap-2 text-[12.5px] text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveToProfile}
                disabled={isSubmitting}
                onChange={(e) => setSaveToProfile(e.target.checked)}
                className="w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] border-slate-300"
              />
              <span>Save answers to profile for future applications</span>
            </label>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting || questions.length === 0}
                onClick={handleSubmit}
                className="h-10 px-6 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Applying...</span>
                  </>
                ) : (
                  <span>Apply</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[70] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'error'
                  ? 'bg-rose-100 text-rose-600'
                  : toast.type === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {toast.type === 'error' ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : toast.type === 'warning' ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <p className="text-[13px] font-semibold tracking-wide">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              title="Close notification"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
