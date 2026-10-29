import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import fulltimeone from "../assets/fulltimeone.svg";
import {
  Sparkles,
  Send,
  Settings,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Bot,
  User,
  Plus,
  Trash2,
  Copy,
  Check,
  MoreHorizontal,
  X,
  Lock,
  Zap,
  Target,
  Workflow,
  FileCheck,
} from "lucide-react";
import { getOnboardingProfile, updateProfileSettings } from "../services/api";

const SUGGESTED_QUESTIONS = [
  {
    id: "jobs-fit",
    text: "What jobs fit me?",
    icon: Target,
  },
  {
    id: "how-works",
    text: "How does Auto Apply work?",
    icon: Workflow,
  },
  {
    id: "resume-ready",
    text: "Is my resume ready?",
    icon: FileCheck,
  },
];

const TWENTY_FOUR_SLOTS = [
  "12 AM",
  "1 AM",
  "2 AM",
  "3 AM",
  "4 AM",
  "5 AM",
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
];

const INITIAL_RUN_TIMES = ["2 AM", "8 AM", "2 PM", "8 PM"];

const FullTimeAutoApply = () => {
  // Settings States
  const [isEnabled, setIsEnabled] = useState(true);
  const [dailyTarget, setDailyTarget] = useState(10);
  const [selectedRunTimes, setSelectedRunTimes] = useState(INITIAL_RUN_TIMES);

  // Lanes State (Max 5 lanes)
  const [lanes, setLanes] = useState([
    {
      id: "lane-default",
      name: "Default",
      description: "Excellent and better · No filters",
      active: true,
      isDefault: true,
    },
  ]);

  // Manual Settings Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual Settings Internal States (Matching Images 1, 2, 3)
  const [perCompanyLimit, setPerCompanyLimit] = useState(10);
  const [pauseInterviewing, setPauseInterviewing] = useState(true);
  const [selectedResumeProfile, setSelectedResumeProfile] = useState("Default (default)");
  const [standingInstructions, setStandingInstructions] = useState("");
  const [reviewBeforeSubmit, setReviewBeforeSubmit] = useState(false);
  const [matchQuality, setMatchQuality] = useState(">80%");
  const [resumeOptimizationMode, setResumeOptimizationMode] = useState("Honest");

  // Shared daily cap used count
  const [usedCount] = useState(0);

  // Chat / Assistant States
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAwaitingLaneRole, setIsAwaitingLaneRole] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatScrollRef = useRef(null);
  const chatInputRef = useRef(null);

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Load saved settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fullTimeAutoApplySettings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isEnabled !== undefined) setIsEnabled(parsed.isEnabled);
        if (parsed.dailyTarget !== undefined) setDailyTarget(parsed.dailyTarget);
        if (Array.isArray(parsed.selectedRunTimes)) setSelectedRunTimes(parsed.selectedRunTimes);
        if (Array.isArray(parsed.lanes) && parsed.lanes.length > 0) setLanes(parsed.lanes);
        if (parsed.perCompanyLimit !== undefined) setPerCompanyLimit(parsed.perCompanyLimit);
        if (parsed.pauseInterviewing !== undefined) setPauseInterviewing(parsed.pauseInterviewing);
        if (parsed.standingInstructions !== undefined) setStandingInstructions(parsed.standingInstructions);
        if (parsed.reviewBeforeSubmit !== undefined) setReviewBeforeSubmit(parsed.reviewBeforeSubmit);
        if (parsed.matchQuality !== undefined) setMatchQuality(parsed.matchQuality);
        if (parsed.resumeOptimizationMode !== undefined) setResumeOptimizationMode(parsed.resumeOptimizationMode);
      }
    } catch (e) {
      console.warn("Failed to parse saved settings:", e);
    }

    // Try fetching from server profile
    const fetchProfileSettings = async () => {
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
        }
      } catch (err) {
        // Backend optional/fallback
      }
    };
    fetchProfileSettings();
  }, []);

  // Auto-scroll chat when new messages appear
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Toast auto-hide
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Handle run time selection (max 4)
  const toggleRunTime = (time) => {
    if (selectedRunTimes.includes(time)) {
      setSelectedRunTimes(selectedRunTimes.filter((t) => t !== time));
    } else {
      if (selectedRunTimes.length >= 4) {
        setToast({
          show: true,
          message: "You can select up to 4 run times per day. Please deselect one first.",
          type: "warning",
        });
        return;
      }
      setSelectedRunTimes([...selectedRunTimes, time]);
    }
  };

  // Stepper increment/decrement
  const handleTargetChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setDailyTarget(1);
    } else {
      const clamped = Math.max(1, Math.min(150, num));
      setDailyTarget(clamped);
    }
  };

  // Trigger Add Lane Flow in the Left Assistant (Matching Image 2)
  const handleTriggerAddLaneInChat = () => {
    if (lanes.length >= 5) {
      setToast({
        show: true,
        message: "Maximum of 5 lanes reached.",
        type: "warning",
      });
      return;
    }

    // 1. User message matching Image 2
    const userMsg = {
      sender: "user",
      text: "I want to add another Auto Apply lane for a different kind of role. Ask me what to target, then dry-run it and show me what it would apply to before saving anything.",
      time: new Date(),
    };

    // 2. Assistant message matching Image 2
    const botMsg = {
      sender: "bot",
      isLaneSetup: true,
      thoughtTitle: "Thought process",
      thoughtStatus: "Reading your Auto Apply setup",
      text: `This account isn't eligible yet: Auto Apply needs the Power plan, and this account has no active subscription, plus Auto Apply itself is currently off. I can still set up and save a new lane now so it's ready to go once the plan is active, but it won't actually run or apply anything until then.

Also worth noting: configExists is false, meaning you've never saved Auto Apply settings before. The one lane shown is just the system default, not something you chose.

That said, let's get your second lane defined. What different kind of role do you want this new lane to target (e.g. a different role family like data engineering, product management, a different seniority band, or something else)? And any location/remote preference that should differ from your main search?`,
      time: new Date(),
      quickPills: [
        "Data Engineering (Remote)",
        "Product Management",
        "Senior Full Stack Developer",
      ],
    };

    setChatMessages((prev) => [...prev, userMsg, botMsg]);
    setIsAwaitingLaneRole(true);

    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // Handle user responding to the lane question
  const handleUserLaneResponse = (roleText) => {
    if (!roleText.trim()) return;

    const userMsg = { sender: "user", text: roleText, time: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const cleanRole = roleText.replace(/\(.*?\)/g, "").trim() || roleText.trim();
      const isRemote = roleText.toLowerCase().includes("remote");
      const description = isRemote
        ? "Excellent and better · Remote only"
        : "Excellent and better · No filters";

      const newLane = {
        id: `lane-${Date.now()}`,
        name: cleanRole,
        description: description,
        active: true,
        isDefault: false,
      };

      setLanes((prev) => [...prev, newLane]);
      setIsAwaitingLaneRole(false);

      const botMsg = {
        sender: "bot",
        text: `Got it! I've configured your new lane for "${cleanRole}" (${description}) and added it to your LANES list on the right.

Every lane draws from your shared daily budget of ${dailyTarget} applications per day, best matches first. You can adjust its criteria in Manual settings or delete it anytime. Click "Save Settings" whenever you're ready to persist these changes!`,
        time: new Date(),
      };

      setChatMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      setToast({
        show: true,
        message: `Lane "${cleanRole}" added to Auto Apply setup.`,
        type: "success",
      });
    }, 600);
  };

  // Remove a custom lane
  const handleRemoveLane = (id) => {
    setLanes(lanes.filter((l) => l.id !== id || l.isDefault));
    setToast({
      show: true,
      message: "Lane removed.",
      type: "success",
    });
  };

  // Handle suggested question card click
  const handleSuggestedQuestionClick = (questionText) => {
    if (isTyping) return; // Prevent duplicate submissions if user clicks repeatedly
    handleAssistantQuery(questionText);
  };

  // General assistant query simulation
  const handleAssistantQuery = (queryText) => {
    if (!queryText.trim()) return;

    if (isAwaitingLaneRole) {
      handleUserLaneResponse(queryText);
      return;
    }

    const userMsg = { sender: "user", text: queryText, time: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let responseText = "";
      const lower = queryText.toLowerCase();

      if (lower.includes("fit me") || (lower.includes("what jobs") && lower.includes("fit"))) {
        responseText =
          "Based on your profile and uploaded resume, your best matches are Full Stack Software Engineer, Frontend Developer, and React / Node.js roles. Tsenta currently identifies 24 active full-time positions matching your criteria with an 85%+ match score in your selected locations.";
      } else if (lower.includes("how does auto apply work") || (lower.includes("auto apply") && lower.includes("work"))) {
        responseText =
          "Auto Apply continuously monitors newly posted job openings that fit your resume criteria and lanes. Up to 4 times a day during your configured run hours, it automatically submits tailored applications drawing from your daily cap, prioritizing your strongest matches first.";
      } else if (lower.includes("resume ready") || lower.includes("is my resume")) {
        responseText =
          "Yes! Your primary resume 'Default (default)' is active, formatted for standard ATS systems, and verified. 122 matches were found this week. You can adjust ATS optimization in Manual settings to choose between 'Honest' and 'Aggressive' tailoring.";
      } else if (lower.includes("lane")) {
        responseText = `You currently have ${lanes.length} configured lane(s): ${lanes.map((l) => l.name).join(", ")}. Another lane changes what gets considered, not how much gets applied to. Click "Add a lane for another kind of role" to set up more.`;
      } else if (lower.includes("remote")) {
        responseText =
          "I've prioritized remote full-time positions. Currently tracking 18 remote openings aligned with your experience and salary expectations.";
      } else if (lower.includes("developer") || lower.includes("engineer")) {
        responseText =
          "Targeting full-time Software Developer opportunities. Resume highlights and tech stack matches are active for upcoming scheduled runs.";
      } else if (lower.includes("target") || lower.includes("cap") || lower.includes("applications")) {
        responseText = `Your current daily target is ${dailyTarget} applications. With your shared daily cap, every lane draws from this budget, best matches first.`;
      } else if (lower.includes("settings") || lower.includes("run time") || lower.includes("schedule")) {
        responseText = `Configured run times: ${selectedRunTimes.join(", ")}. Resume optimization is ${resumeOptimizationMode}. You can fine-tune these anytime in Manual settings.`;
      } else {
        responseText =
          "I've noted that preference. I will use your resume and settings to match the most suitable full-time positions and prepare them for submission during your scheduled run windows.";
      }

      const botMsg = { sender: "bot", text: responseText, time: new Date() };
      setChatMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 550);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;
    const text = inputMessage;
    setInputMessage("");
    handleAssistantQuery(text);
  };

  // Copy message text
  const handleCopyMessage = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Save Settings handler
  const handleSaveSettings = async () => {
    if (isEnabled && selectedRunTimes.length === 0) {
      setToast({
        show: true,
        message: "Please select at least 1 run time when Auto Apply is enabled.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    const settingsPayload = {
      isEnabled,
      dailyTarget,
      selectedRunTimes,
      lanes,
      perCompanyLimit,
      pauseInterviewing,
      selectedResumeProfile,
      standingInstructions,
      reviewBeforeSubmit,
      matchQuality,
      resumeOptimizationMode,
      timezone: "GMT+5:30",
      updatedAt: new Date().toISOString(),
    };

    // Save to local storage for immediate persistence
    try {
      localStorage.setItem("fullTimeAutoApplySettings", JSON.stringify(settingsPayload));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    // Try updating profile settings via API
    try {
      await updateProfileSettings({
        resumeOptimization: resumeOptimizationMode === "Off" ? "off" : resumeOptimizationMode.toLowerCase(),
        autoApply: isEnabled,
        fullTimeTarget: dailyTarget,
      });
    } catch (err) {
      console.log("Profile backend synced or offline, settings saved locally.");
    }

    setTimeout(() => {
      setIsSaving(false);
      setToast({
        show: true,
        message: "Full Time Auto Apply settings saved successfully!",
        type: "success",
      });
    }, 400);
  };

  const capPercentage = Math.min(100, Math.round((usedCount / dailyTarget) * 100));

  // Formatted run time array and string display: matches Image 2
  const runTimesList =
    selectedRunTimes.length === 4 &&
    selectedRunTimes.includes("2 AM") &&
    selectedRunTimes.includes("8 AM") &&
    selectedRunTimes.includes("2 PM") &&
    selectedRunTimes.includes("8 PM")
      ? ["2:30 AM", "8:30 AM", "2:30 PM", "8:30 PM"]
      : selectedRunTimes.length > 0
      ? selectedRunTimes
      : ["2:30 AM", "8:30 AM", "2:30 PM", "8:30 PM"];

  const runTimesFormatted =
    runTimesList.length > 2
      ? `${runTimesList.slice(0, -1).join(", ")} and ${runTimesList[runTimesList.length - 1]}`
      : runTimesList.join(" and ");

  const activeLanesCount = lanes.filter((l) => l.active).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight">
              Full Time Auto Apply
            </h1>
            <p className="text-[13.5px] sm:text-[14px] text-slate-500">
              Let our AI find and apply to the best full time jobs that match your resume and preferences.
            </p>
          </div>

          {/* Toast Notification */}
          {toast.show && (
            <div
              className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-2 duration-200 ${
                toast.type === "success"
                  ? "bg-white text-indigo-700 border-indigo-200 shadow-indigo-500/10"
                  : toast.type === "warning"
                  ? "bg-white text-amber-700 border-amber-200 shadow-amber-500/10"
                  : "bg-white text-rose-700 border-rose-200 shadow-rose-500/10"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-[#4F46E5] shrink-0" />
              ) : toast.type === "warning" ? (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ================= LEFT SECTION: Auto Apply Assistant ================= */}
            <div className="lg:col-span-7 bg-white rounded-[20px] border border-[#E2E8F0] p-5 sm:p-7 mt-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[560px]">
              <div className="flex flex-col flex-1">
                {/* Auto Apply Assistant Header (Image 2) */}
                <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center shrink-0 mt-0.5">
  <img
    src={fulltimeone}
    alt="Auto Apply Assistant"
    className="w-5 h-5 object-contain"
  />
</div>
                  <div className="flex flex-col">
                    <h2 className="text-[17px] font-bold text-slate-900 leading-snug">
                      Auto Apply Assistant
                    </h2>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                      Tell me what kind of jobs you want to apply for. I'll use your resume and settings to find the best matches and apply automatically.
                    </p>
                  </div>
                </div>

                {/* Conversation Thread or Clean Empty State */}
                {chatMessages.length > 0 ? (
                  <div className="mt-2 mb-4 flex flex-col flex-1 gap-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Conversation
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setChatMessages([]);
                          setIsAwaitingLaneRole(false);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Clear conversation
                      </button>
                    </div>

                    <div
                      ref={chatScrollRef}
                      className="flex-1 min-h-[300px] max-h-[460px] overflow-y-auto pr-1 flex flex-col gap-4"
                    >
                      {chatMessages.map((msg, idx) => {
                        const isUser = msg.sender === "user";
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col gap-1.5 ${
                              isUser ? "items-end" : "items-start"
                            }`}
                          >
                            {isUser ? (
                              <div className="bg-[#4F46E5] text-white rounded-2xl p-4 sm:p-5 text-[13.5px] leading-relaxed max-w-full shadow-xs">
                                {msg.text}
                              </div>
                            ) : (
                              <div className="w-full flex items-start gap-3 pt-1">
                                <div className="w-7 h-7 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                                  A
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                  {msg.isLaneSetup && (
                                    <div className="flex flex-col gap-1 text-[12.5px] text-slate-500">
                                      <div className="flex items-center gap-1.5 cursor-pointer select-none text-slate-400 hover:text-slate-600">
                                        <span className="font-medium">Thought process</span>
                                        <ChevronDown className="w-3 h-3" />
                                      </div>
                                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                        <Check className="w-3.5 h-3.5 text-[#4F46E5] stroke-[2.5]" />
                                        <span>Reading your Auto Apply setup</span>
                                      </div>
                                    </div>
                                  )}

                                  <div className="text-[13px] sm:text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-line">
                                    {msg.text.split("configExists").map((part, i, arr) => (
                                      <React.Fragment key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                          <code className="bg-slate-100 text-slate-800 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200">
                                            configExists
                                          </code>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </div>

                                  {msg.quickPills && (
                                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                      {msg.quickPills.map((pill, pIdx) => (
                                        <button
                                          key={pIdx}
                                          type="button"
                                          onClick={() => handleUserLaneResponse(pill)}
                                          className="text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-[#4F46E5] hover:text-white transition-all cursor-pointer shadow-2xs"
                                        >
                                          + {pill}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 text-slate-400 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyMessage(msg.text, idx)}
                                      className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                                      title="Copy message"
                                    >
                                      {copiedIndex === idx ? (
                                        <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAssistantQuery("Tell me more about lane setup")}
                                      className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                                      title="Retry / Regenerate"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                                      title="More"
                                    >
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isTyping && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 pl-8 italic">
                          <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                          Assistant is thinking...
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-8 pt-12 w-full">
                    <div className="flex flex-col gap-3 w-full max-w-md sm:max-w-lg">
                      {SUGGESTED_QUESTIONS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={isTyping}
                            onClick={() => handleSuggestedQuestionClick(item.text)}
                            className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-200 hover:border-[#4F46E5] bg-white hover:bg-[#EEF2FF]/40 text-left transition-all duration-200 group cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white transition-colors shrink-0 shadow-2xs">
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-[13.5px] sm:text-[14px] font-semibold text-slate-800 group-hover:text-[#4F46E5] transition-colors leading-snug">
                              {item.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Chat Input */}
              <div className="pt-5 mt-4 border-t border-slate-100">
                <form
                  onSubmit={handleSendMessage}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 flex items-center gap-3 focus-within:border-[#6366F1] focus-within:ring-2 focus-within:ring-[#EEF2FF] transition-all shadow-2xs"
                >
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about your Auto Apply setup..."
                    className="flex-1 bg-transparent text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      inputMessage.trim()
                        ? "bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white cursor-pointer"
                        : "text-slate-300 cursor-not-allowed"
                    }`}
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* ================= RIGHT SECTION: Image 2 Data in Image 1 Colors ================= */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Settings Header Row (Image 1 Header) */}
              <div className="flex items-center justify-between mb-0.5">
                

                
              </div>

              {/* Unified Settings Card Containing Image 2 Data in Image 1 Colors */}
              <div className="bg-white rounded-[18px] border border-[#E2E8F0] shadow-2xs overflow-hidden">
                {/* 1. LANES SECTION (Clean - Triggers Chat Flow) */}
                <div className="p-5 border-b border-[#E2E8F0] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Lanes
                    </span>
                    <span className="text-[12px] font-semibold text-slate-500">
                      {activeLanesCount} of 5 active
                    </span>
                  </div>

                  {/* Active Lanes List */}
                  <div className="flex flex-col gap-2.5">
                    {lanes.map((lane) => (
                      <div
                        key={lane.id}
                        className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-bold text-slate-900 leading-none">
                                {lane.name}
                              </span>
                            </div>
                            <p className="text-[12.5px] text-slate-500 mt-1">
                              {lane.description}
                            </p>
                          </div>
                        </div>

                        {!lane.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLane(lane.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                            title="Delete lane"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add a lane button: Triggers Question in Left Assistant */}
                  <button
                    type="button"
                    onClick={handleTriggerAddLaneInChat}
                    disabled={lanes.length >= 5}
                    className="w-full py-3 px-4 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#818CF8] bg-white hover:bg-[#EEF2FF]/40 text-slate-700 hover:text-[#4F46E5] text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 text-[#4F46E5]" />
                    <span>Add a lane for another kind of role</span>
                  </button>
                </div>

                {/* 2. RUN TIMES SECTION */}
                <div className="p-5 border-b border-[#E2E8F0] flex flex-col gap-2">
                  <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider">
                    Run Times
                  </span>
                  <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 text-[15px] sm:text-[15.5px] font-bold text-slate-900 mt-0.5">
                    {runTimesList.map((time, idx) => {
                      const isSecondToLast = idx === runTimesList.length - 2;
                      const hasComma = runTimesList.length > 2 && idx < runTimesList.length - 2;

                      return (
                        <React.Fragment key={idx}>
                          <span className="whitespace-nowrap">
                            {time}
                            {hasComma ? "," : ""}
                          </span>
                          {isSecondToLast && runTimesList.length > 1 && (
                            <span className="text-slate-500 font-medium whitespace-nowrap">and</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    The default times. Pick your own in Manual settings.
                  </p>
                </div>

                {/* 3. SHARED DAILY CAP SECTION */}
                <div className="p-5 border-b border-[#E2E8F0] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Shared Daily Cap
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-7 w-16 rounded-md border border-[#E2E8F0] bg-white flex items-center justify-between px-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300">
                        <input
                          type="number"
                          min={1}
                          max={150}
                          value={dailyTarget}
                          onChange={(e) => handleTargetChange(e.target.value)}
                          className="w-8 bg-transparent text-center focus:outline-none font-semibold text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="flex flex-col text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleTargetChange(dailyTarget + 1)}
                            className="hover:text-indigo-600 cursor-pointer"
                            title="Increase"
                          >
                            <ChevronUp className="w-2.5 h-2.5 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTargetChange(dailyTarget - 1)}
                            className="hover:text-indigo-600 cursor-pointer"
                            title="Decrease"
                          >
                            <ChevronDown className="w-2.5 h-2.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-600">/ day</span>
                    </div>
                  </div>

                  {/* Progress Bar (Image 1 Colors) */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-[#4F46E5] transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(usedCount > 0 ? 5 : 0, capPercentage)}%` }}
                    />
                  </div>

                  {/* Used / Today info */}
                  <div className="text-[13px] font-medium text-slate-700">
                    {usedCount} of {dailyTarget} used today
                  </div>

                  {/* Explanation text */}
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    Every lane draws from this one budget, best matches first. Another lane changes what gets considered, not how much gets applied to.
                  </p>
                </div>

                {/* 4. MANUAL SETTINGS BUTTON: Opens Popup Modal */}
                <div className="p-4.5 flex flex-col">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="w-full flex items-center justify-between cursor-pointer select-none group py-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#4F46E5] shrink-0 group-hover:bg-[#EEF2FF] transition-colors">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[14px] font-semibold text-slate-800 group-hover:text-[#4F46E5] transition-colors">
                        settings
                      </span>
                    </div>

                    <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <ChevronRight className="w-4.5 h-4.5" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MANUAL SETTINGS POPUP MODAL (Anchored to Right Corner, Image 2 Blue) ================= */}
      {isManualModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex justify-end items-start sm:items-stretch overflow-hidden"
          onClick={() => setIsManualModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl h-full sm:h-[96vh] sm:my-auto sm:mr-4 md:mr-6 rounded-none sm:rounded-2xl flex flex-col shadow-2xl border border-slate-200 animate-in slide-in-from-right duration-300 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-[17px] font-bold text-slate-900">
                 settings
              </h2>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* SECTION 1: Auto Apply Banner */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0 mt-0.5">
                    <Zap className="w-5 h-5 fill-[#4F46E5]/15 text-[#4F46E5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[17px] font-bold text-slate-900">Auto Apply</h3>
                      
                    </div>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      Set it once. Tsenta applies to your best new matches at the times you choose, up to 4 times a day.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsManualModalOpen(false);
                    handleTriggerAddLaneInChat();
                  }}
                  className="shrink-0 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[12.5px] font-semibold px-3.5 py-2 rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tune with AI</span>
                </button>
              </div>

              <div className="h-px w-full bg-slate-100" />

              {/* SECTION 2: Enable auto-apply */}
             
{/* SECTION 2: Enable auto-apply */}

{/* SECTION 2: Enable auto-apply */}

{/* SECTION 2: Enable auto-apply */}
<div className="relative flex items-center justify-between gap-4 rounded-xl border border-[#6A5CFF] border-l-4 bg-[#EFEEFF] p-3 sm:p-4">

  <div className="min-w-0">
    <h4 className="text-[14px] font-bold text-[#1A0EA5]">
      Enable auto-apply
    </h4>

    <p className="mt-0.5 text-[12px] text-[#1A0EA5]">
      Turn on auto-apply to apply automatically using your saved settings.
    </p>
  </div>

  <button
    type="button"
    role="switch"
    aria-checked={isEnabled}
    onClick={() => setIsEnabled((prev) => !prev)}
    className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
      isEnabled ? "bg-[#6A5CFF]" : "bg-slate-300"
    }`}
  >
    <span
      className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        isEnabled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>

</div>




              {/* SECTION 3: Daily application cap */}
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[14px] font-bold text-slate-900">Daily application cap</h4>
                <p className="text-[12.5px] text-slate-500">
                  At most this many auto-applications per day (1–150)
                </p>
                <div className="mt-1">
                  <input
                    type="number"
                    min={1}
                    max={150}
                    value={dailyTarget}
                    onChange={(e) => handleTargetChange(e.target.value)}
                    className="w-24 text-[15px] font-semibold text-slate-900 pb-1 border-b border-slate-300 focus:border-[#4F46E5] focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 4: Run times (24 Slots matching Image 1, styled with Image 2 Blue) */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[14px] font-bold text-slate-900">Run times</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  Pick up to 4 times a day. Each run picks up jobs posted since the last one. Times are in your time zone (GMT+5:30).
                </p>

                {/* 24 slots: 12 AM to 11 PM */}
                <div className="grid grid-cols-8 gap-1.5 pt-2">
                  {TWENTY_FOUR_SLOTS.map((slot) => {
                    const isSelected = selectedRunTimes.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleRunTime(slot)}
                        className={`py-2 px-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer text-center select-none ${
                          isSelected
                            ? "bg-[#4F46E5] text-white shadow-2xs hover:bg-[#4338CA]"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[12px] text-slate-500 mt-1">
                  <p>Default times: 2:30 AM, 8:30 AM, 2:30 PM and 8:30 PM.</p>
                  <p className="text-slate-400 mt-0.5">
                    4 runs a day is the most. Turn one off to pick another. ({selectedRunTimes.length}/4 selected)
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100" />

              
{/* SECTION 5: Per-company limit */}
<div className="flex items-center justify-between gap-4">
  <div className="flex-1">
    <h4 className="text-[14px] font-bold text-slate-900">
      Per-company limit
    </h4>
    <p className="text-[12.5px] text-slate-500 mt-0.5">
      Stop applying to a company once it has this many of your applications from the last 30 days.
    </p>
  </div>

  <div className="shrink-0">
  <input
    type="number"
    min={1}
    max={30}
    value={perCompanyLimit}
    onChange={(e) =>
      setPerCompanyLimit(
        Math.max(1, Math.min(30, Number(e.target.value) || 1))
      )
    }
    className="w-20 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[14px] font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF]"
  />
</div>
</div>


              {/* SECTION 6: Pause companies you're interviewing with (Image 2 Blue, NOT green) */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900">
                    Pause companies you're interviewing with
                  </h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    Auto Apply stops applying to a company for 60 days after an interview or offer from it, or until it turns you down.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pauseInterviewing}
                  onClick={() => setPauseInterviewing(!pauseInterviewing)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    pauseInterviewing ? "bg-[#4F46E5]" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                      pauseInterviewing ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* SECTION 7: Resume Profile, Filters & Match Quality (Image 2 Blue Accents) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-5 shadow-2xs">
                {/* Resume Profile */}
                <div className="flex flex-col gap-2">
                  
                
                  
                </div>

                

                {/* Minimum Match Quality (Image 2 Blue active pill) */}
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">
                    Minimum Match Quality
                  </span>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    We only auto-apply to jobs that are at least this strong a match for this resume. A higher bar means fewer, sharper applications; a lower bar means more volume.
                  </p>
                  


<div className="flex flex-wrap items-center gap-2 pt-1">
  {[">80%", ">70%", ">60%"].map((qual) => {
    const isSel = matchQuality === qual;

    return (
      <button
        key={qual}
        type="button"
        onClick={() => setMatchQuality(qual)}
        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          isSel
            ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        {qual}
      </button>
    );
  })}
</div>



                  <p className="text-[12px] text-slate-400 mt-0.5">
                    Only your very best matches. Fewest applications, highest quality. The preview updates as you change this.
                  </p>
                </div>

                <div className="h-px w-full bg-slate-100" />

                {/* SECTION 8: Optimization (Image 2 Blue active pill) */}
                <div className="flex flex-col gap-3">
                 

               
{/* Resume optimization */}
<div className="flex items-center justify-between gap-4">
  <div>
    <h5 className="text-[13.5px] font-bold text-slate-900">
      Resume optimization
    </h5>
    <p className="text-[12px] text-slate-500 mt-0.5">
      Reorder and highlight relevant experience for each job.
    </p>
  </div>

  <div className="flex items-center gap-1 p-0.5 rounded-full border border-slate-200 bg-white shrink-0">
    {["Off", "On"].map((mode) => {
      const isSel = resumeOptimizationMode === mode;

      return (
        <button
          key={mode}
          type="button"
          onClick={() => setResumeOptimizationMode(mode)}
          className={`px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            isSel
              ? "bg-[#4F46E5] text-white shadow-2xs hover:bg-[#4338CA]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {mode}
        </button>
      );
    })}
  </div>
</div>


                  {/* Cover letter */}
                  
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-medium text-slate-700 cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveSettings();
                  setIsManualModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullTimeAutoApply;
