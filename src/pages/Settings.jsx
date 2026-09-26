import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getOnboardingProfile, updateProfileSettings } from "../services/api";

const Settings = () => {
  // Apply Settings States
  const [resumeOptimization, setResumeOptimization] = useState("Honest");
  const [autoApprove, setAutoApprove] = useState(true);
  const [reviewBeforeSubmitToggle, setReviewBeforeSubmitToggle] = useState(false);

  // Resume Tailoring State
  const [resumeTailoring, setResumeTailoring] = useState("job_specific");

  // Application Automation State
  const [automationMode, setAutomationMode] = useState("automatic");

  // Application Questions State
  const [questionsMode, setQuestionsMode] = useState("saved_answers");

  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getOnboardingProfile();
        if (data) {
          const prof = data.profile || {};
          if (prof.resumeOptimization) {
            const opt = String(prof.resumeOptimization).toLowerCase();
            if (opt === "off") setResumeOptimization("Off");
            else if (opt === "aggressive") setResumeOptimization("Aggressive");
            else setResumeOptimization("Honest");
          }
          if (prof.autoApproveEdits !== undefined || prof.autoApprove !== undefined) {
            setAutoApprove(Boolean(prof.autoApproveEdits ?? prof.autoApprove));
          }
          if (prof.reviewBeforeSubmit !== undefined) {
            setReviewBeforeSubmitToggle(Boolean(prof.reviewBeforeSubmit));
          }
          if (prof.applicationQuestionsMode) {
            setQuestionsMode(prof.applicationQuestionsMode);
          }
        }
      } catch (err) {
        console.warn("Could not load initial settings:", err);
      }
    };

    fetchSettings();
  }, []);

  const sendSettingsPatch = async (updates) => {
    const payload = {
      resumeOptimization: (updates.resumeOptimization !== undefined ? updates.resumeOptimization : resumeOptimization).toLowerCase(),
      autoApproveEdits: updates.autoApproveEdits !== undefined ? updates.autoApproveEdits : autoApprove,
      reviewBeforeSubmit: updates.reviewBeforeSubmit !== undefined ? updates.reviewBeforeSubmit : reviewBeforeSubmitToggle,
      applicationQuestionsMode: updates.applicationQuestionsMode !== undefined ? updates.applicationQuestionsMode : questionsMode,
    };

    try {
      const response = await updateProfileSettings(payload);
      const msg = response?.message || (typeof response === "string" ? response : "Settings updated.");
      setToast({
        show: true,
        message: msg,
        type: "success",
      });
    } catch (err) {
      console.error("Failed to update settings:", err);
      const errMsg = err?.message || err?.data?.message || "Failed to update settings";
      setToast({
        show: true,
        message: errMsg,
        type: "error",
      });
    }
  };

  const handleResumeOptimizationChange = (mode) => {
    setResumeOptimization(mode);
    sendSettingsPatch({ resumeOptimization: mode });
  };

  const handleAutoApproveToggle = () => {
    const nextVal = !autoApprove;
    setAutoApprove(nextVal);
    sendSettingsPatch({ autoApproveEdits: nextVal });
  };

  const handleReviewBeforeSubmitToggle = () => {
    const nextVal = !reviewBeforeSubmitToggle;
    setReviewBeforeSubmitToggle(nextVal);
    sendSettingsPatch({ reviewBeforeSubmit: nextVal });
  };

  const handleQuestionsModeChange = (mode) => {
    setQuestionsMode(mode);
    sendSettingsPatch({ applicationQuestionsMode: mode });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Settings Main Content */}
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              Settings
            </h1>
            <p className="text-[13px] text-[#64748B]">
              Manage your account, application preferences, and automation settings.
            </p>
          </div>

          {/* Settings Cards Container */}
          <div className="flex flex-col gap-6 w-full">
            
            {/* 1. Apply Settings Card */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[15px] font-bold text-[#0F172A]">
                    Apply Settings
                  </h2>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5">
                    Control how your applications are submitted.
                  </p>
                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col divide-y divide-slate-100 mt-1">
                {/* Row 1: Resume optimization */}
                <div className="py-4.5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Resume optimization
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5">
                      Optimize your resume for each job description using AI.
                    </span>
                  </div>

                  {/* 3-segment pill */}
                  <div className="p-1 rounded-full bg-[#F1F5F9] flex items-center gap-1">
                    {["Off", "Honest", "Aggressive"].map((mode) => {
                      const isSelected = resumeOptimization === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleResumeOptimizationChange(mode)}
                          className={`h-[28px] px-3.5 rounded-full text-[12.5px] transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white text-[#4F46E5] font-semibold shadow-2xs"
                              : "text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 2: Auto-approve */}
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Auto-approve
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5">
                      Automatically submit applications for jobs that match your criteria.
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[12px] font-medium text-[#64748B]">
                      {autoApprove ? "On" : "Off"}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoApproveToggle}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        autoApprove ? "bg-[#4F46E5]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          autoApprove ? "translate-x-5.5" : "translate-x-0.5"
                        } top-0.5 absolute`}
                      />
                    </button>
                  </div>
                </div>

                {/* Row 3: Review before submit */}
                <div className="py-4.5 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Review before submit
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5">
                      Pause and show application preview before final submission.
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[12px] font-medium text-[#64748B]">
                      {reviewBeforeSubmitToggle ? "On" : "Off"}
                    </span>
                    <button
                      type="button"
                      onClick={handleReviewBeforeSubmitToggle}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        reviewBeforeSubmitToggle ? "bg-[#4F46E5]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          reviewBeforeSubmitToggle ? "translate-x-5.5" : "translate-x-0.5"
                        } top-0.5 absolute`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Resume Tailoring Card */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[15px] font-bold text-[#0F172A]">
                    Resume Tailoring
                  </h2>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5">
                    Choose how we tailor your resume for each job.
                  </p>
                </div>
              </div>

              {/* 2 Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                {/* Option 1: Job specific tailoring */}
                <div
                  onClick={() => setResumeTailoring("job_specific")}
                  className={`p-4 rounded-[14px] flex items-start gap-3 cursor-pointer transition-all ${
                    resumeTailoring === "job_specific"
                      ? "border-2 border-[#4F46E5] bg-white shadow-xs"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {resumeTailoring === "job_specific" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Job specific tailoring
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Automatically tailor my resume to each job description while keeping my experience accurate.
                    </span>
                  </div>
                </div>

                {/* Option 2: Use original resume */}
                <div
                  onClick={() => setResumeTailoring("original")}
                  className={`p-4 rounded-[14px] flex items-start gap-3 cursor-pointer transition-all ${
                    resumeTailoring === "original"
                      ? "border-2 border-[#4F46E5] bg-white shadow-xs"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {resumeTailoring === "original" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Use original resume
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Use my resume exactly as uploaded without any changes.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Application Automation Card */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[15px] font-bold text-[#0F172A]">
                    Application Automation
                  </h2>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5">
                    Set how applications are submitted.
                  </p>
                </div>
              </div>

              {/* 2 Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                {/* Option 1: Automatic */}
                <div
                  onClick={() => setAutomationMode("automatic")}
                  className={`p-4 rounded-[14px] flex items-start gap-3 cursor-pointer transition-all ${
                    automationMode === "automatic"
                      ? "border-2 border-[#4F46E5] bg-white shadow-xs"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {automationMode === "automatic" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Automatic
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Automatically complete and submit supported applications after ATS validation.
                    </span>
                  </div>
                </div>

                {/* Option 2: Review before submit */}
                <div
                  onClick={() => setAutomationMode("review")}
                  className={`p-4 rounded-[14px] flex items-start gap-3 cursor-pointer transition-all ${
                    automationMode === "review"
                      ? "border-2 border-[#4F46E5] bg-white shadow-xs"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {automationMode === "review" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Review before submit
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Pause so you can review the application before submission.
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Alert */}
              <div className="p-3.5 rounded-[12px] bg-[#FFFBEB] border border-[#FEF3C7] flex items-center gap-2.5 text-[12.5px] text-[#92400E] mt-1">
                <svg className="w-4 h-4 text-[#D97706] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  Some applications may require manual intervention if there is a CAPTCHA, unsupported questions, or if we're unsure about the submission status.
                </span>
              </div>
            </div>

            {/* 4. Application Questions Card */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[15px] font-bold text-[#0F172A]">
                    Application Questions
                  </h2>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5">
                    Choose how we answer additional application questions.
                  </p>
                </div>
              </div>

              {/* 2 Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                {/* Option 1: Use saved answers */}
                <div
                  onClick={() => handleQuestionsModeChange("saved_answers")}
                  className={`p-4 rounded-[14px] flex items-start gap-3 cursor-pointer transition-all ${
                    questionsMode === "saved_answers"
                      ? "border-2 border-[#4F46E5] bg-white shadow-xs"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {questionsMode === "saved_answers" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Use saved answers
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Use your profile answers for supported questions.
                    </span>
                  </div>
                </div>

                {/* Option 2: Ask me when needed */}
                <div
                  onClick={() => handleQuestionsModeChange("ask_me")}
                  className={`p-4 rounded-[14px] flex items-start gap-3 cursor-pointer transition-all ${
                    questionsMode === "ask_me"
                      ? "border-2 border-[#4F46E5] bg-white shadow-xs"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {questionsMode === "ask_me" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">
                      Ask me when needed
                    </span>
                    <span className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Pause when a question needs information that is not already saved.
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-6 md:right-8 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_4px_20px_-2px_rgba(79,70,229,0.12)] ${
              toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === "error" ? "bg-red-100 text-red-600" : "bg-[#E0E7FF] text-[#4F46E5]"
              }`}
            >
              {toast.type === "error" ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <p className="text-[13px] font-semibold text-[#4338CA] tracking-wide">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className={`ml-2 cursor-pointer transition-colors ${
                toast.type === "error" ? "text-slate-400 hover:text-slate-600" : "text-[#6366F1] hover:text-[#4338CA]"
              }`}
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
};

export default Settings;
