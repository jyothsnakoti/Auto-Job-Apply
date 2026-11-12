import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  AlertCircle,
  CheckCircle2,
  Check,
  FileText,
  MapPin,
  Briefcase,
  Layers,
  Coins,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";
import {
  getOnboardingProfile,
  updateProfileSettings,
  getResumes,
  getBillingStatus,
} from "../services/api";

const WORKPLACE_OPTIONS = ["Remote", "Hybrid", "On-site"];

const EXPERIENCE_OPTIONS = [
  "Entry Level (0–1 yrs)",
  "Junior (1–3 yrs)",
  "Mid-Level (3–5 yrs)",
  "Senior (5–8 yrs)",
  "Lead / Principal (8+ yrs)",
];

const JOB_TYPE_OPTIONS = ["Full-time"];

const SALARY_OPTIONS = [
  "Any",
  "$80k+",
  "$100k+",
  "$110k+",
  "$120k+",
  "$140k+",
  "$160k+",
  "$180k+",
];

const TIME_OPTIONS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

// All timezone slots default to disabled (unchecked, empty time box) until enabled by Pro user
const DEFAULT_TIMEZONE_SLOTS = [
  {
    id: "pst",
    code: "PST",
    name: "Pacific Standard Time",
    time: "08:00 AM",
    enabled: false,
  },
  {
    id: "mst",
    code: "MST",
    name: "Mountain Standard Time",
    time: "12:00 PM",
    enabled: false,
  },
  {
    id: "cst",
    code: "CST",
    name: "Central Standard Time",
    time: "02:00 PM",
    enabled: false,
  },
  {
    id: "est",
    code: "EST",
    name: "Eastern Standard Time",
    time: "05:00 PM",
    enabled: false,
  },
];

/**
 * Normalizes and checks whether the response from GET /api/billing/status indicates an active Pro plan.
 * Checks explicit proPlan boolean, isPro boolean, as well as planName / planCode containing 'pro'.
 */
export const evaluateProPlan = (data) => {
  if (!data) return false;
  const res = data?.data && typeof data.data === "object" ? data.data : data;

  // 1. Direct boolean flags
  if (typeof res?.proPlan === "boolean") return res.proPlan;
  if (typeof res?.isPro === "boolean") return res.isPro;
  if (typeof res?.isProPlan === "boolean") return res.isProPlan;
  if (typeof res?.isProActive === "boolean") return res.isProActive;

  // 2. String boolean flags
  if (typeof res?.proPlan === "string") {
    return res.proPlan.toLowerCase() === "true";
  }

  // 3. Plan code / name evaluation from backend
  const hasPlan = Boolean(
    res?.hasPlan === true ||
    res?.has_plan === true ||
    res?.status === true ||
    res?.isSubscribed === true ||
    res?.active === true ||
    res?.planActive === true ||
    (typeof res?.status === "string" &&
      ["active", "true", "subscribed", "paid"].includes(res.status.toLowerCase()))
  );

  const planIdentifier = String(
    res?.planCode ||
    res?.plancode ||
    res?.planName ||
    res?.plan ||
    res?.subscriptionPlan ||
    res?.subscription ||
    res?.tier ||
    ""
  )
    .toLowerCase()
    .trim();

  // If user has an active plan and its identifier specifies 'pro'
  if (hasPlan && planIdentifier.includes("pro")) {
    return true;
  }

  return false;
};

const FullTimeAutoApply = () => {
  const navigate = useNavigate();

  // Pro Subscription State
  const [isProPlan, setIsProPlan] = useState(() => {
    try {
      const stored =
        localStorage.getItem("billingStatus") ||
        sessionStorage.getItem("billingStatus");
      if (stored) {
        return evaluateProPlan(JSON.parse(stored));
      }
    } catch (e) { }
    return false;
  });

  const [isVerifyingBilling, setIsVerifyingBilling] = useState(false);
  const verifyingPromiseRef = useRef(null);

  // Enable Full Time Auto Apply Toggle State
  const [isEnabled, setIsEnabled] = useState(false);

  // Dropdown Open State ('workplace' | 'experience' | 'salary' | 'time-pst' | ...)
  const [openDropdown, setOpenDropdown] = useState(null);

  // Settings States (default to empty / "Select option", toggle buttons off default)
  const [primaryResume, setPrimaryResume] = useState(
    "Koti_Jyothsna_Frontend_Developer_Resume.docx"
  );
  const [workplaceTypes, setWorkplaceTypes] = useState([]);
  const [experienceLevels, setExperienceLevels] = useState([]);
  const [jobTypes, setJobTypes] = useState(["Full-time"]);
  const [minSalary, setMinSalary] = useState("");
  const [keywords, setKeywords] = useState(
    "React, TypeScript, Next.js, Tailwind CSS"
  );
  const [standingInstructions, setStandingInstructions] = useState(
    "Prioritize modern front-end frameworks and high-performance web applications."
  );

  const [dailyTarget, setDailyTarget] = useState(10);
  const [timezoneSlots, setTimezoneSlots] = useState(DEFAULT_TIMEZONE_SLOTS);
  const [perCompanyLimit, setPerCompanyLimit] = useState(0);
  const [pauseInterviewing, setPauseInterviewing] = useState(false);
  const [matchQuality, setMatchQuality] = useState(">80%");
  const [resumeOptimizationMode, setResumeOptimizationMode] = useState("Honest");

  // UI Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
    action: null,
  });

  /**
   * Helper: displays the standard subscription toast message.
   */
  const showProPlanToast = () => {
    setToast({
      show: true,
      message: "Upgrade plan to enable Full Time Auto Apply.",
      type: "warning",
      action: {
        label: "Upgrade Plan",
        onClick: () => navigate("/subscriptions"),
      },
    });
  };

  /**
   * Calls the Billing Status API, validates latest subscription status,
   * updates state, prevents duplicate simultaneous calls, and handles errors.
   * Returns: boolean (isPro) or null (if network/API error occurred).
   */
  const verifyProPlan = async () => {
    if (verifyingPromiseRef.current) {
      return verifyingPromiseRef.current;
    }

    setIsVerifyingBilling(true);
    const fetchPromise = (async () => {
      try {
        const data = await getBillingStatus();
        const isPro = evaluateProPlan(data);
        setIsProPlan(isPro);
        if (!isPro) {
          setIsEnabled(false);
          setTimezoneSlots((prev) => prev.map((s) => ({ ...s, enabled: false })));
          setPerCompanyLimit(0);
        }
        return isPro;
      } catch (err) {
        console.warn("[FullTimeAutoApply] Billing verification failed:", err);
        // Do not assume user is Pro on failure; block action and alert user
        setIsProPlan(false);
        setToast({
          show: true,
          message: "Unable to verify subscription status. Please check your connection and try again.",
          type: "error",
          action: null,
        });
        return null;
      } finally {
        setIsVerifyingBilling(false);
        verifyingPromiseRef.current = null;
      }
    })();

    verifyingPromiseRef.current = fetchPromise;
    return fetchPromise;
  };

  /**
   * Guard for restricted setting interactions: validates latest Pro status before allowing action.
   */
  const handleRestrictedAction = async (actionCallback) => {
    const isPro = await verifyProPlan();
    if (isPro === null) {
      // API call failed, error toast already shown
      return;
    }

    if (isPro) {
      if (actionCallback) actionCallback();
    } else {
      showProPlanToast();
    }
  };

  // Load saved settings and resume profile on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fullTimeAutoApplySettings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isEnabled !== undefined && (parsed.isPaidPlanActive || parsed.isProPlan)) {
          setIsEnabled(parsed.isEnabled);
        } else {
          setIsEnabled(false);
        }
        if (parsed.primaryResume) {
          setPrimaryResume(parsed.primaryResume);
        }
        if (Array.isArray(parsed.workplaceTypes) && parsed.workplaceTypes.length > 0) {
          setWorkplaceTypes(parsed.workplaceTypes);
        }
        if (Array.isArray(parsed.experienceLevels) && parsed.experienceLevels.length > 0) {
          setExperienceLevels(parsed.experienceLevels);
        }
        if (Array.isArray(parsed.jobTypes) && parsed.jobTypes.length > 0) {
          const valid = parsed.jobTypes.filter((t) => JOB_TYPE_OPTIONS.includes(t));
          setJobTypes(valid.length > 0 ? valid : ["Full-time"]);
        }
        if (parsed.minSalary) {
          setMinSalary(parsed.minSalary);
        }
        if (parsed.keywords !== undefined) {
          setKeywords(parsed.keywords);
        }
        if (parsed.standingInstructions !== undefined) {
          setStandingInstructions(parsed.standingInstructions);
        }
        if (parsed.dailyTarget !== undefined) {
          const cap = parseInt(parsed.dailyTarget, 10);
          if (!isNaN(cap)) {
            setDailyTarget(cap);
          }
        }
        if ((parsed.isPaidPlanActive || parsed.isProPlan) && Array.isArray(parsed.timezoneSlots) && parsed.timezoneSlots.length === 4) {
          setTimezoneSlots(parsed.timezoneSlots);
        } else {
          setTimezoneSlots(DEFAULT_TIMEZONE_SLOTS);
        }
        if ((parsed.isPaidPlanActive || parsed.isProPlan) && parsed.perCompanyLimit !== undefined) {
          setPerCompanyLimit(parsed.perCompanyLimit);
        } else {
          setPerCompanyLimit(0);
        }
        if (parsed.pauseInterviewing !== undefined) {
          setPauseInterviewing(parsed.pauseInterviewing);
        }
        if (parsed.matchQuality !== undefined) {
          setMatchQuality(parsed.matchQuality);
        }
        if (parsed.resumeOptimizationMode !== undefined) {
          setResumeOptimizationMode(parsed.resumeOptimizationMode);
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved settings:", e);
    }

    // Fetch profile and resumes from backend
    const fetchProfileData = async () => {
      try {
        const data = await getOnboardingProfile();
        if (data?.profile) {
          const prof = data.profile;
          if (prof.resumeOptimization) {
            const opt = String(prof.resumeOptimization);
            if (opt.toLowerCase() === "off") setResumeOptimizationMode("Off");
            else if (opt.toLowerCase() === "aggressive") setResumeOptimizationMode("Aggressive");
            else setResumeOptimizationMode("Honest");
          }
          if (prof.fullTimeTarget !== undefined || prof.dailyTarget !== undefined) {
            const num = parseInt(prof.fullTimeTarget ?? prof.dailyTarget, 10);
            if (!isNaN(num)) {
              setDailyTarget(num);
            }
          }
        }
      } catch (err) { }

      try {
        const resumesData = await getResumes();
        if (Array.isArray(resumesData) && resumesData.length > 0) {
          const names = resumesData
            .map((r) => r.fileName || r.title || r.name)
            .filter(Boolean);
          if (names.length > 0) {
            const matching = names.find(
              (n) => n.toLowerCase().includes("koti") || n.toLowerCase().includes("jyothsna")
            );
            if (matching) {
              setPrimaryResume(matching);
            } else if (!names.includes(primaryResume)) {
              setPrimaryResume(names[0]);
            }
          }
        }
      } catch (err) { }
    };

    fetchProfileData();

    // Verify initial billing status on mount
    const fetchInitialBilling = async () => {
      try {
        const data = await getBillingStatus();
        const isPro = evaluateProPlan(data);
        setIsProPlan(isPro);
        if (!isPro) {
          setIsEnabled(false);
          setTimezoneSlots((prev) => prev.map((s) => ({ ...s, enabled: false })));
          setPerCompanyLimit(0);
        }
      } catch (err) {
        console.warn("[FullTimeAutoApply] Initial billing status check failed:", err);
      }
    };
    fetchInitialBilling();

    const handleBillingUpdate = (e) => {
      if (e?.detail) {
        const isPro = evaluateProPlan(e.detail);
        setIsProPlan(isPro);
        if (!isPro) {
          setIsEnabled(false);
          setTimezoneSlots((prev) => prev.map((s) => ({ ...s, enabled: false })));
          setPerCompanyLimit(0);
        }
      } else {
        fetchInitialBilling();
      }
    };

    window.addEventListener("billingStatusUpdated", handleBillingUpdate);
    window.addEventListener("storage", handleBillingUpdate);
    return () => {
      window.removeEventListener("billingStatusUpdated", handleBillingUpdate);
      window.removeEventListener("storage", handleBillingUpdate);
    };
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Toggle Auto Apply (Validated with Billing Status API)
  const handleToggleAutoApply = async () => {
    if (isVerifyingBilling) return;

    // 1. First call Billing Status API
    const isPro = await verifyProPlan();
    if (isPro === null) {
      // API call failed, error toast already shown
      return;
    }

    // 2. Check whether user has active Pro plan
    if (isPro) {
      const nextVal = !isEnabled;
      setIsEnabled(nextVal);
      setToast({
        show: true,
        message: nextVal
          ? "Full Time Auto Apply enabled for Primary Resume."
          : "Full Time Auto Apply disabled.",
        type: "success",
        action: null,
      });
    } else {
      setIsEnabled(false);
      showProPlanToast();
    }
  };

  // Multi-select toggle helper
  const toggleMultiSelect = (currentList, setList, item) => {
    if (!isProPlan) {
      handleRestrictedAction();
      return;
    }
    if (currentList.includes(item)) {
      setList(currentList.filter((i) => i !== item));
    } else {
      setList([...currentList, item]);
    }
  };

  // Toggle enabled state of a timezone slot
  const toggleTimezoneEnabled = (id) => {
    if (!isProPlan) {
      handleRestrictedAction();
      return;
    }
    setOpenDropdown((curr) => (curr === `time-${id}` ? null : curr));
    setTimezoneSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== id) return slot;
        return { ...slot, enabled: !slot.enabled };
      })
    );
  };

  // Change time of a timezone slot
  const changeTimezoneTime = (id, newTime) => {
    if (!isProPlan) {
      handleRestrictedAction();
      return;
    }
    setTimezoneSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== id) return slot;
        return { ...slot, time: newTime };
      })
    );
    setOpenDropdown(null);
  };

  // Save Settings handler (Protected by Pro Validation)
  const handleSaveSettings = async () => {
    // 1. Call Billing Status API and check latest Pro status
    const isPro = await verifyProPlan();
    if (isPro === null) {
      // Verification failed, error toast already shown
      return;
    }

    // 2. If proPlan is false, block save, show Pro toast and stay on current page
    if (!isPro) {
      showProPlanToast();
      return;
    }

    // 3. Pro validation passed - validate configuration
    if (isEnabled && !timezoneSlots.some((s) => s.enabled)) {
      setToast({
        show: true,
        message: "Please select at least one timezone when Auto Apply is enabled.",
        type: "error",
        action: null,
      });
      return;
    }

    setIsSaving(true);

    const settingsPayload = {
      isEnabled,
      isProPlan: true,
      primaryResume,
      workplaceTypes,
      experienceLevels,
      jobTypes,
      minSalary,
      keywords: keywords.trim(),
      standingInstructions: standingInstructions.trim(),
      dailyTarget,
      timezoneSlots,
      selectedRunTimes: timezoneSlots
        .filter((s) => s.enabled)
        .map((s) => `${s.code} (${s.name}) at ${s.time}`),
      perCompanyLimit,
      pauseInterviewing,
      matchQuality,
      resumeOptimizationMode,
      timezone: "GMT+5:30",
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        "fullTimeAutoApplySettings",
        JSON.stringify(settingsPayload)
      );
      window.dispatchEvent(
        new CustomEvent("fullTimeSettingsUpdated", { detail: settingsPayload })
      );
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    try {
      await updateProfileSettings({
        resumeOptimization:
          resumeOptimizationMode === "Off"
            ? "off"
            : resumeOptimizationMode.toLowerCase(),
        autoApply: isEnabled,
        fullTimeTarget: dailyTarget,
      });
    } catch (err) { }

    setTimeout(() => {
      setIsSaving(false);
      setToast({
        show: true,
        message: "Full Time Auto Apply settings saved successfully!",
        type: "success",
        action: null,
      });
    }, 350);
  };

  const selectedCount = timezoneSlots.filter((s) => s.enabled).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Global Transparent Backdrop for closing open dropdowns */}
        {openDropdown && (
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpenDropdown(null)}
          />
        )}

        {/* Floating Popup Toast Notification */}
        {toast.show && (
          <div className="fixed top-20 right-6 sm:right-8 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18)] border text-sm font-medium transition-all ${
                toast.type === "success"
                  ? "bg-white text-slate-800 border-indigo-200"
                  : toast.type === "warning"
                    ? "bg-white text-slate-800 border-amber-300 shadow-amber-500/10"
                    : "bg-white text-slate-800 border-rose-200 shadow-rose-500/10"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-[#4F46E5] shrink-0" />
              ) : toast.type === "warning" ? (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <span className="font-medium text-[13.5px] text-slate-800">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  onClick={toast.action.onClick}
                  className="ml-1.5 px-3 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs shrink-0"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast((prev) => ({ ...prev, show: false }))}
                className="ml-1 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-5xl w-full mx-auto flex flex-col gap-6">
          {/* Page Heading & Subtitle */}
          <div className="flex flex-col gap-1 min-h-[46px]">
            <h1 className="text-[24px] sm:text-[26px] font-bold text-slate-900 tracking-tight">
              Full Time Auto Select Auto Apply Settings
            </h1>
            <p className="text-[13.5px] sm:text-[14px] text-slate-500">
              Automatically find and apply to the best full-time jobs that match your resume and preferences.
            </p>
          </div>

          {/* Enable Auto Apply Toggle Section */}
          <div className="relative flex items-center justify-between gap-4 rounded-2xl border border-[#6A5CFF] border-l-[6px] bg-[#EFEEFF] p-4 sm:p-5 shadow-2xs">
            <div className="min-w-0 pr-2">
              <h3 className="text-[14.5px] sm:text-[15px] font-bold text-[#1A0EA5] tracking-tight">
                Enable Full Time Auto Apply For Primary Resume
              </h3>
              <p className="mt-1 text-[12.5px] sm:text-[13px] text-[#1A0EA5]/90 leading-relaxed">
                Turn on auto-apply to apply automatically using your saved settings.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              disabled={isVerifyingBilling}
              onClick={handleToggleAutoApply}
              className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${isVerifyingBilling ? "opacity-60 cursor-wait" : "cursor-pointer"
                } ${isEnabled ? "bg-[#6A5CFF]" : "bg-slate-300"}`}
              title={isEnabled ? "Disable Full Time Auto Apply" : "Enable Full Time Auto Apply"}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </button>
          </div>

          {/* ONE SINGLE CONTINUOUS WHITE CONTAINER FOR ALL SETTINGS */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs flex flex-col gap-6">

            {/* 1. Primary Resume */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F0F2FF] flex items-center justify-center text-[#5551FF] shrink-0">
                  <FileText className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">
                    Resume
                  </h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    Selected primary resume used for all full-time automated applications.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  if (!isProPlan) {
                    handleRestrictedAction();
                  }
                }}
                className="w-full sm:w-[380px] rounded-2xl bg-[#F0F2FF]/70 border border-[#E0E4FC] px-4 py-2.5 flex items-center gap-2.5 text-[14px] font-medium text-slate-800 shadow-2xs cursor-pointer select-none"
              >
                <FileText className="w-4 h-4 text-[#5551FF] shrink-0" />
                <span className="truncate font-semibold">{primaryResume}</span>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* 2. Workplace Type */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F0F2FF] flex items-center justify-center text-[#5551FF] shrink-0">
                  <MapPin className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">
                    Workplace Type
                  </h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    Workplace arrangements you are willing to accept for your applications.
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-[380px]">
                <button
                  type="button"
                  onClick={() => {
                    if (!isProPlan) {
                      handleRestrictedAction();
                      return;
                    }
                    setOpenDropdown(openDropdown === "workplace" ? null : "workplace");
                  }}
                  className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-2.5 flex items-center justify-between text-[14px] text-slate-800 font-medium shadow-2xs hover:border-slate-300 transition-colors cursor-pointer select-none"
                >
                  <span
                    className={
                      workplaceTypes.length > 0
                        ? "truncate text-slate-800 font-medium"
                        : "text-slate-400 font-normal"
                    }
                  >
                    {workplaceTypes.length > 0
                      ? workplaceTypes.join(", ")
                      : "Select option"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${openDropdown === "workplace" ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isProPlan && openDropdown === "workplace" && (
                  <div className="absolute right-0 top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-30 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                    {WORKPLACE_OPTIONS.map((item) => {
                      const isSelected = workplaceTypes.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            toggleMultiSelect(workplaceTypes, setWorkplaceTypes, item)
                          }
                          className={`w-full px-3 py-2 rounded-xl text-[13.5px] font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                            ? "bg-[#F0F2FF] text-[#5551FF] font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                            }`}
                        >
                          <span>{item}</span>
                          <div
                            className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all ${isSelected
                              ? "bg-[#5551FF] text-white"
                              : "border border-slate-300"
                              }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* 3. Experience Level */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F0F2FF] flex items-center justify-center text-[#5551FF] shrink-0">
                  <Briefcase className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">
                    Experience Level
                  </h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    Seniority bands and required years of professional experience.
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-[380px]">
                <button
                  type="button"
                  onClick={() => {
                    if (!isProPlan) {
                      handleRestrictedAction();
                      return;
                    }
                    setOpenDropdown(openDropdown === "experience" ? null : "experience");
                  }}
                  className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-2.5 flex items-center justify-between text-[14px] text-slate-800 font-medium shadow-2xs hover:border-slate-300 transition-colors cursor-pointer select-none"
                >
                  <span
                    className={
                      experienceLevels.length > 0
                        ? "truncate text-slate-800 font-medium"
                        : "text-slate-400 font-normal"
                    }
                  >
                    {experienceLevels.length > 0
                      ? experienceLevels.join(", ")
                      : "Select option"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${openDropdown === "experience" ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isProPlan && openDropdown === "experience" && (
                  <div className="absolute right-0 top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-30 flex flex-col gap-1 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {EXPERIENCE_OPTIONS.map((item) => {
                      const isSelected = experienceLevels.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            toggleMultiSelect(experienceLevels, setExperienceLevels, item)
                          }
                          className={`w-full px-3 py-2 rounded-xl text-[13.5px] font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                            ? "bg-[#F0F2FF] text-[#5551FF] font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                            }`}
                        >
                          <span>{item}</span>
                          <div
                            className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all ${isSelected
                              ? "bg-[#5551FF] text-white"
                              : "border border-slate-300"
                              }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* 4. Job Type */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F0F2FF] flex items-center justify-center text-[#5551FF] shrink-0">
                  <Layers className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">
                    Job Type
                  </h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    Full-time employment structure for targeted positions.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  if (!isProPlan) {
                    handleRestrictedAction();
                  }
                }}
                className="w-full sm:w-[380px] rounded-2xl bg-white border border-slate-200 px-4 py-2.5 flex items-center text-[14px] text-slate-800 font-medium shadow-2xs cursor-pointer select-none"
              >
                <span>Full-time</span>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* 5. Minimum Base Salary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F0F2FF] flex items-center justify-center text-[#5551FF] shrink-0">
                  <Coins className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">
                    Minimum Base Salary
                  </h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    Filter out job postings below your minimum target compensation.
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-[380px]">
                <button
                  type="button"
                  onClick={() => {
                    if (!isProPlan) {
                      handleRestrictedAction();
                      return;
                    }
                    setOpenDropdown(openDropdown === "salary" ? null : "salary");
                  }}
                  className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-2.5 flex items-center justify-between text-[14px] text-slate-800 font-medium shadow-2xs hover:border-slate-300 transition-colors cursor-pointer select-none"
                >
                  <span
                    className={
                      minSalary
                        ? "text-slate-800 font-medium"
                        : "text-slate-400 font-normal"
                    }
                  >
                    {minSalary || "Select option"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${openDropdown === "salary" ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isProPlan && openDropdown === "salary" && (
                  <div className="absolute right-0 top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-30 flex flex-col gap-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {SALARY_OPTIONS.map((item) => {
                      const isSelected = minSalary === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setMinSalary(item);
                            setOpenDropdown(null);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-[13.5px] font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                            ? "bg-[#F0F2FF] text-[#5551FF] font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                            }`}
                        >
                          <span>{item}</span>
                          {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* 6. Run Times Section */}
            <div className="flex flex-col gap-4 py-1">
              {/* Header */}
              <div
                className="flex items-center justify-between gap-4 cursor-pointer select-none"
                onClick={() => {
                  if (!isProPlan) {
                    handleRestrictedAction();
                  }
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#F0F2FF] flex items-center justify-center text-[#5551FF] shrink-0">
                    <Clock className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[16px] text-slate-900 tracking-tight">
                      Auto Select Auto Apply Run Times
                    </h4>
                    <p className="text-[12.5px] text-slate-500 mt-0.5">
                      Configure your auto-apply scheduling windows and applicable time zones.
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[12.5px] font-bold px-3 py-1 rounded-full shrink-0 transition-colors ${
                    selectedCount > 0
                      ? "bg-[#EEF2FF] text-[#5551FF]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {selectedCount}/4 selected
                </span>
              </div>

              {/* 4 Timezone Cards Stacked Vertically */}
              <div className="flex flex-col gap-3 pt-1">
                {timezoneSlots.map((slot) => {
                  const isTimeDropdownOpen = openDropdown === `time-${slot.id}`;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (!isProPlan) {
                          handleRestrictedAction();
                          return;
                        }
                        toggleTimezoneEnabled(slot.id);
                      }}
                      className={`rounded-2xl border transition-all px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer ${slot.enabled
                          ? "bg-white border-[#E2E8F0] shadow-2xs hover:border-slate-300"
                          : "bg-slate-50/60 border-slate-200/60 hover:border-slate-300"
                        }`}
                    >
                      {/* Left: Checkbox + Vertical line + Code + Full name */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isProPlan) {
                              handleRestrictedAction();
                              return;
                            }
                            toggleTimezoneEnabled(slot.id);
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${slot.enabled
                              ? "bg-[#5551FF] text-white shadow-2xs"
                              : "bg-white border-2 border-slate-300"
                            }`}
                          title={slot.enabled ? "Disable slot" : "Enable slot"}
                        >
                          {slot.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="h-5 w-px bg-slate-200 mx-1.5 sm:mx-2 shrink-0" />

                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isProPlan) {
                              handleRestrictedAction();
                              return;
                            }
                            toggleTimezoneEnabled(slot.id);
                          }}
                          className={`font-bold text-[15px] sm:text-[16px] w-12 shrink-0 select-none cursor-pointer transition-colors ${slot.enabled ? "text-slate-900" : "text-slate-400"
                            }`}
                        >
                          {slot.code}
                        </span>

                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isProPlan) {
                              handleRestrictedAction();
                              return;
                            }
                            toggleTimezoneEnabled(slot.id);
                          }}
                          className={`text-[13px] sm:text-[14px] font-normal truncate select-none cursor-pointer transition-colors ${slot.enabled ? "text-slate-500" : "text-slate-400"
                            }`}
                        >
                          {slot.name}
                        </span>
                      </div>

                      {/* Right: "Run at" + Time Input Box (empty when unticked) */}
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-10 sm:pl-0">
                        <span
                          className={`text-[13px] sm:text-[13.5px] font-medium shrink-0 transition-colors ${slot.enabled ? "text-slate-500" : "text-slate-400"
                            }`}
                        >
                          Run at
                        </span>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isProPlan) {
                                handleRestrictedAction();
                                return;
                              }
                              if (!slot.enabled) {
                                setTimezoneSlots((prev) =>
                                  prev.map((s) =>
                                    s.id === slot.id ? { ...s, enabled: true } : s
                                  )
                                );
                                setOpenDropdown(`time-${slot.id}`);
                                return;
                              }
                              setOpenDropdown(isTimeDropdownOpen ? null : `time-${slot.id}`);
                            }}
                            className={`w-[120px] h-[38px] rounded-xl border px-3.5 py-1.5 flex items-center justify-between text-[13.5px] sm:text-[14px] font-semibold transition-all select-none cursor-pointer ${slot.enabled
                                ? "border-slate-200 bg-white text-slate-800 shadow-2xs hover:border-slate-300"
                                : "border-slate-200 bg-slate-50/70 text-slate-400 hover:border-slate-300"
                              }`}
                          >
                            <span>{slot.enabled ? slot.time : ""}</span>
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>

                          {/* Time Selector Dropdown */}
                          {isProPlan && slot.enabled && isTimeDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-30 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                              {TIME_OPTIONS.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => changeTimezoneTime(slot.id, t)}
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${slot.time === t
                                    ? "bg-[#F0F2FF] text-[#5551FF]"
                                    : "hover:bg-slate-50 text-slate-700"
                                    }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* 7. Per-Company Limit */}
            <div
              onClick={() => {
                if (!isProPlan) {
                  handleRestrictedAction();
                }
              }}
              className="flex items-center justify-between gap-4 py-1"
            >
              <div className="flex-1">
                <h4 className="text-[16px] font-bold text-slate-900 tracking-tight">
                  Per-Company Limit
                </h4>
                <p className="text-[12.5px] text-slate-500 mt-0.5">
                  Stop applying to a company once it has this many of your applications from the last 30 days.
                </p>
              </div>

              <div
                onClick={(e) => {
                  if (!isProPlan) {
                    e.stopPropagation();
                    handleRestrictedAction();
                  }
                }}
                className="shrink-0"
              >
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={perCompanyLimit}
                  readOnly={!isProPlan}
                  onFocus={(e) => {
                    if (!isProPlan) {
                      e.target.blur();
                      handleRestrictedAction();
                    }
                  }}
                  onChange={(e) => {
                    if (!isProPlan) {
                      handleRestrictedAction();
                      return;
                    }
                    const val = e.target.value;
                    if (val === "") {
                      setPerCompanyLimit(0);
                      return;
                    }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setPerCompanyLimit(Math.max(0, Math.min(30, num)));
                    }
                  }}
                  className={`w-20 h-10 px-3 rounded-xl border text-[14px] font-semibold shadow-2xs outline-none transition-all text-center select-none ${
                    isProPlan
                      ? "border-slate-200 bg-white text-slate-800 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF] cursor-text"
                      : "border-slate-200 bg-slate-50/70 text-slate-400 cursor-pointer"
                  }`}
                />
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* 8. Pause Companies You're Interviewing With */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <h4 className="text-[16px] font-bold text-slate-900 tracking-tight">
                  Pause Companies You're Interviewing With
                </h4>
                <p className="text-[12.5px] text-slate-500 mt-0.5">
                  Auto Apply stops applying to a company for 60 days after an interview or offer from it, or until it turns you down.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pauseInterviewing}
                onClick={() => {
                  if (!isProPlan) {
                    handleRestrictedAction();
                    return;
                  }
                  setPauseInterviewing(!pauseInterviewing);
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${pauseInterviewing ? "bg-[#5551FF]" : "bg-slate-200"
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${pauseInterviewing ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* 9. Save Settings Button (Protected by Pro Validation) */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <div
                onClick={() => {
                  if (!isProPlan) {
                    handleRestrictedAction();
                  }
                }}
                className={!isProPlan ? "cursor-not-allowed" : ""}
              >
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={!isProPlan || isSaving || isVerifyingBilling}
                  className={`px-6 py-3 rounded-xl text-[14px] font-bold transition-all flex items-center gap-2 select-none ${
                    !isProPlan
                      ? "bg-slate-200 text-slate-400 shadow-none pointer-events-none cursor-not-allowed"
                      : "bg-[#4F46E5] hover:bg-[#4338CA] text-white cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>
                    {isVerifyingBilling
                      ? "Verifying Plan..."
                      : isSaving
                        ? "Saving Settings..."
                        : "Save Settings"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FullTimeAutoApply;
