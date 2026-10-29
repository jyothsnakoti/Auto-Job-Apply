import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Lock } from "lucide-react";
import {
  Mail,
  Phone,
  FileText,
  Clock,
  Briefcase,
  MapPin,
  Plus,
  X,
  Info,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Save,
} from "lucide-react";
import {
  getStoredUser,
  getOnboardingProfile,
  getResumes,
  updatePersonalProfile,
} from "../services/api";

// Google Gmail Icon Component Matching Image 2
const GmailLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
    <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
    <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
    <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
    <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L4.376,4.732C3.537,4.103,2.337,4.469,2.072,5.503 C2.025,5.687,3,12.298,3,12.298z" />
    <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l8.624-6.468c0.839-0.629,2.039-0.263,2.304,0.771 C45.975,5.687,45,12.298,45,12.298z" />
  </svg>
);

const TIME_OPTIONS = [
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

const DEFAULT_RESUME_NAME = "Default (Vasim_Lureshi_Mission_Lead_SOF_Resume.pdf)";

const C2CAutoApply = () => {
  // Contact States
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [connectedGmail, setConnectedGmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailInput, setGmailInput] = useState("");

  // Resume Settings States
  const [resumesList, setResumesList] = useState([
    { id: "default", name: DEFAULT_RESUME_NAME },
  ]);
  const [selectedResume, setSelectedResume] = useState(DEFAULT_RESUME_NAME);
  const [isResumeDropdownOpen, setIsResumeDropdownOpen] = useState(false);
  const resumeDropdownRef = useRef(null);

  // Schedule & Targeting States
  const [appsCount, setAppsCount] = useState(10);
  const [selectedTime, setSelectedTime] = useState("9:00 AM");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const timeDropdownRef = useRef(null);

  // Job Titles State
  const [jobTitleInput, setJobTitleInput] = useState("");
  const [jobTitles, setJobTitles] = useState(["Data Engineer"]);

  // Locations State
  const [locationInput, setLocationInput] = useState("");
  const [locations, setLocations] = useState(["Dallas, TX"]);

  // UI & Toast States
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (resumeDropdownRef.current && !resumeDropdownRef.current.contains(e.target)) {
        setIsResumeDropdownOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setIsTimeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Toast Auto-hide
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Load initial settings, profile, and resumes
  useEffect(() => {
    // 1. Check local storage for C2C Auto Apply settings
    try {
      const savedSettings = localStorage.getItem("c2c_auto_apply_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.isGmailConnected !== undefined) setIsGmailConnected(parsed.isGmailConnected);
        if (parsed.connectedGmail) setConnectedGmail(parsed.connectedGmail);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.selectedResume) setSelectedResume(parsed.selectedResume);
        if (parsed.appsCount !== undefined) setAppsCount(parsed.appsCount);
        if (parsed.selectedTime) setSelectedTime(parsed.selectedTime);
        if (Array.isArray(parsed.jobTitles) && parsed.jobTitles.length > 0) {
          setJobTitles(parsed.jobTitles);
        }
        if (Array.isArray(parsed.locations) && parsed.locations.length > 0) {
          setLocations(parsed.locations);
        }
      }
    } catch (e) {
      console.warn("Could not load local C2C settings:", e);
    }

    // 2. Load profile phone & email
    const loadProfileData = async () => {
      try {
        const user = getStoredUser();
        if (user?.email && !connectedGmail) {
          setGmailInput(user.email);
        }

        const profileData = await getOnboardingProfile();
        if (profileData?.profile) {
          const prof = profileData.profile;
          if ((prof.phone || prof.phoneNumber) && !phoneNumber) {
            const ph = prof.phone || prof.phoneNumber;
            setPhoneNumber(ph);
          }
          if (prof.email && !connectedGmail) {
            setGmailInput(prof.email);
          }
        }
      } catch (err) {
        // Backend optional
      }
    };
    loadProfileData();

    // 3. Load Resumes
    const loadUserResumes = async () => {
      try {
        const resList = await getResumes();
        if (Array.isArray(resList) && resList.length > 0) {
          const formatted = resList.map((r, i) => ({
            id: r.id || r.resumeId || `res-${i}`,
            name: r.fileName || r.name || r.originalFileName || `Resume_${i + 1}.pdf`,
          }));
          // Prepend default reference resume
          setResumesList([
            { id: "default", name: DEFAULT_RESUME_NAME },
            ...formatted.filter((f) => f.name !== DEFAULT_RESUME_NAME),
          ]);
        }
      } catch (err) {
        // Keep default list
      }
    };
    loadUserResumes();
  }, []);

  // Save changes to localStorage
  const persistSettings = (overrides = {}) => {
    const payload = {
      isGmailConnected: overrides.isGmailConnected !== undefined ? overrides.isGmailConnected : isGmailConnected,
      connectedGmail: overrides.connectedGmail !== undefined ? overrides.connectedGmail : connectedGmail,
      phoneNumber: overrides.phoneNumber !== undefined ? overrides.phoneNumber : phoneNumber,
      selectedResume: overrides.selectedResume !== undefined ? overrides.selectedResume : selectedResume,
      appsCount: overrides.appsCount !== undefined ? overrides.appsCount : appsCount,
      selectedTime: overrides.selectedTime !== undefined ? overrides.selectedTime : selectedTime,
      jobTitles: overrides.jobTitles !== undefined ? overrides.jobTitles : jobTitles,
      locations: overrides.locations !== undefined ? overrides.locations : locations,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("c2c_auto_apply_settings", JSON.stringify(payload));
    } catch (e) {
      console.warn("Error saving C2C settings:", e);
    }
  };

  // Connect Gmail Handlers
  const handleOpenGmailModal = () => {
    if (!gmailInput) {
      const user = getStoredUser();
      setGmailInput(user?.email || "jyothsna@gmail.com");
    }
    setIsGmailModalOpen(true);
  };

  const handleConfirmGmailConnect = () => {
    const emailToConnect = gmailInput.trim() || "jyothsna@gmail.com";
    setIsGmailConnected(true);
    setConnectedGmail(emailToConnect);
    setIsGmailModalOpen(false);
    persistSettings({ isGmailConnected: true, connectedGmail: emailToConnect });
    setToast({
      show: true,
      message: `Gmail connected successfully (${emailToConnect})`,
      type: "success",
    });
  };

  const handleDisconnectGmail = () => {
    setIsGmailConnected(false);
    setConnectedGmail("");
    persistSettings({ isGmailConnected: false, connectedGmail: "" });
    setToast({
      show: true,
      message: "Gmail disconnected.",
      type: "warning",
    });
  };

  // Phone Number Handlers
  const handleOpenPhoneModal = () => {
    setPhoneInput(phoneNumber || "");
    setPhoneError("");
    setIsPhoneModalOpen(true);
  };

  const handleSavePhone = async () => {
    const cleaned = phoneInput.trim();
    if (!cleaned) {
      setPhoneError("Please enter a valid phone number.");
      return;
    }
    const digitsOnly = cleaned.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      setPhoneError("Phone number must contain at least 10 digits.");
      return;
    }

    try {
      await updatePersonalProfile({ phone: cleaned });
    } catch {
      // Backend optional
    }

    setPhoneNumber(cleaned);
    setIsPhoneModalOpen(false);
    persistSettings({ phoneNumber: cleaned });
    setToast({
      show: true,
      message: "Phone number updated successfully!",
      type: "success",
    });
  };

  // Job Titles Add/Remove
  const handleAddJobTitle = (e) => {
    e?.preventDefault();
    const val = jobTitleInput.trim();
    if (!val) return;
    if (jobTitles.some((t) => t.toLowerCase() === val.toLowerCase())) {
      setToast({
        show: true,
        message: `"${val}" is already in your target job titles list.`,
        type: "warning",
      });
      return;
    }
    const updated = [...jobTitles, val];
    setJobTitles(updated);
    setJobTitleInput("");
    persistSettings({ jobTitles: updated });
  };

  const handleRemoveJobTitle = (titleToRemove) => {
    const updated = jobTitles.filter((t) => t !== titleToRemove);
    setJobTitles(updated);
    persistSettings({ jobTitles: updated });
  };

  // Location Add/Remove
  const handleAddLocation = (e) => {
    e?.preventDefault();
    const val = locationInput.trim();
    if (!val) return;
    if (locations.some((l) => l.toLowerCase() === val.toLowerCase())) {
      setToast({
        show: true,
        message: `"${val}" is already in your locations list.`,
        type: "warning",
      });
      return;
    }
    const updated = [...locations, val];
    setLocations(updated);
    setLocationInput("");
    persistSettings({ locations: updated });
  };

  const handleRemoveLocation = (locToRemove) => {
    const updated = locations.filter((l) => l !== locToRemove);
    setLocations(updated);
    persistSettings({ locations: updated });
  };

  // Save Settings
  const handleSaveAll = () => {
    setIsSaving(true);
    persistSettings();
    setTimeout(() => {
      setIsSaving(false);
      setToast({
        show: true,
        message: "C2C Auto Apply settings saved successfully!",
        type: "success",
      });
    }, 350);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Main C2C Auto Apply Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight">
                C2C Auto Select Auto  Apply
              </h1>
              <p className="text-[13.5px] sm:text-[14px] text-slate-500">
                Configure your contact information, resume and other settings to start automatic C2C job applications.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>

          {/* Toast Notification */}
          {toast.show && (
            <div
              className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-2 duration-200 ${
                toast.type === "success"
                  ? "bg-white text-emerald-700 border-emerald-200 shadow-emerald-500/10"
                  : toast.type === "warning"
                  ? "bg-white text-amber-700 border-amber-200 shadow-amber-500/10"
                  : "bg-white text-rose-700 border-rose-200 shadow-rose-500/10"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          {/* ================= SECTION A: Contact Settings Card ================= */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-4.5">
            {/* Card Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#4F46E5] shrink-0 mt-0.5">
                <Mail className="w-4.5 h-4.5 text-[#4F46E5]" />
              </div>
              <div>
                <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 leading-snug">
                  Contact Settings
                </h2>
                <p className="text-[12.5px] sm:text-[13px] text-slate-500 mt-0.5">
                  Connect your email and phone number to send C2C job applications automatically.
                </p>
              </div>
            </div>

            {/* Contact Rows Container */}
            <div className="flex flex-col gap-3">
              {/* Row 1: Gmail */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 sm:p-4 flex items-center justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                    <GmailLogo />
                  </div>
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-slate-900 leading-tight">
                      Gmail
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isGmailConnected ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      <span className="text-[12px] text-slate-500 font-medium">
                        {isGmailConnected
                          ? `Connected (${connectedGmail || "Active"})`
                          : "Not connected"}
                      </span>
                    </div>
                  </div>
                </div>

                {isGmailConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={handleDisconnectGmail}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenGmailModal}
                    className="px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[12.5px] font-semibold transition-all shadow-2xs hover:shadow cursor-pointer"
                  >
                    Connect Gmail
                  </button>
                )}
              </div>

              {/* Row 2: Phone Number */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 sm:p-4 flex items-center justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#4F46E5] shrink-0">
                    <Phone className="w-4.5 h-4.5 text-[#4F46E5]" />
                  </div>
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-slate-900 leading-tight">
                      Phone Number
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          phoneNumber ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      <span className="text-[12px] text-slate-500 font-medium">
                        {phoneNumber ? phoneNumber : "Not added"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenPhoneModal}
                  className="px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[12.5px] font-semibold transition-all shadow-2xs hover:shadow cursor-pointer"
                >
                  {phoneNumber ? "Edit Phone Number" : "Add Phone Number"}
                </button>
              </div>
            </div>
          </div>
          
          {/* SECTION 2: Enable auto-apply */}
          <div className="flex items-center justify-between gap-4 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] p-4">
            <div>
              <h4 className="text-[14px] font-bold text-slate-900">
                Enable auto-apply
              </h4>
              <p className="text-[12.5px] text-slate-600 mt-0.5">
                Upgrade to Pro to turn this on. You can configure everything else below now.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setToast({
                  show: true,
                  message: "Auto Apply requires the Pro subscription plan.",
                  type: "warning",
                });
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0E7FF] bg-white hover:bg-indigo-50 text-[12px] font-semibold text-[#4F46E5] shadow-2xs cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Requires Pro Plan</span>
            </button>
          </div>


          {/* ================= SECTION B: Resume Settings Card ================= */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-4">
            {/* Card Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#4F46E5] shrink-0 mt-0.5">
                <FileText className="w-4.5 h-4.5 text-[#4F46E5]" />
              </div>
              <div>
                <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 leading-snug">
                  Resume Settings
                </h2>
                <p className="text-[12.5px] sm:text-[13px] text-slate-500 mt-0.5">
                  Select which resume to use for C2C job applications.
                </p>
              </div>
            </div>

            {/* Select Resume Dropdown Container */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-slate-700">
                Select Resume
              </label>

              <div ref={resumeDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsResumeDropdownOpen(!isResumeDropdownOpen)}
                  className="w-full h-[42px] px-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between text-left text-[13px] font-medium text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#818CF8] transition-all cursor-pointer shadow-2xs"
                >
                  <span className="truncate pr-3">{selectedResume}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {isResumeDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto">
                    {resumesList.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          setSelectedResume(res.name);
                          setIsResumeDropdownOpen(false);
                          persistSettings({ selectedResume: res.name });
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          selectedResume === res.name
                            ? "bg-[#EEF2FF] text-[#4F46E5]"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{res.name}</span>
                        {selectedResume === res.name && (
                          <Check className="w-4 h-4 text-[#4F46E5] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tips Information Panel Matching Image 2 */}
            <div className="rounded-xl bg-[#EEF2FF]/60 border border-[#C7D2FE]/60 p-3.5 sm:p-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                i
              </div>
              <div className="flex flex-col gap-1 text-[12.5px] text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Tips</span>
                <ul className="space-y-0.5 text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <span>Use an updated resume with relevant C2C skills.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <span>Make sure your resume is clear and well-formatted.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <span>You can update your resume anytime from Profile.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ================= SECTION C: Schedule & Targeting Card ================= */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-5">
            {/* Card Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#4F46E5] shrink-0 mt-0.5">
                <Clock className="w-4.5 h-4.5 text-[#4F46E5]" />
              </div>
              <div>
                <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 leading-snug">
                  Schedule & Targeting
                </h2>
                <p className="text-[12.5px] sm:text-[13px] text-slate-500 mt-0.5">
                  Set when and what type of C2C jobs to apply for.
                </p>
              </div>
            </div>

            {/* WHEN TO SEND Row Matching Image 2 */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>WHEN TO SEND</span>
                </div>
                <div className="flex items-center gap-1 text-[11.5px] text-slate-400 font-medium">
                  <span>max 10 per hour</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Number of apps + time dropdown */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="text-[13px] font-medium text-slate-700">Send</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={appsCount}
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10);
                    if (isNaN(num)) setAppsCount(1);
                    else setAppsCount(Math.max(1, Math.min(10, num)));
                  }}
                  className="w-16 h-[38px] rounded-lg border border-[#E2E8F0] bg-white text-center text-[13.5px] font-semibold text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[#EEF2FF] shadow-2xs"
                />
                <span className="text-[13px] font-medium text-slate-700">applications at</span>

                {/* Time selector dropdown */}
                <div ref={timeDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                    className="h-[38px] px-3.5 rounded-lg border border-[#E2E8F0] bg-white flex items-center gap-2 text-[13px] font-semibold text-slate-800 hover:border-slate-300 shadow-2xs cursor-pointer focus:outline-none"
                  >
                    <span>{selectedTime}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isTimeDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {TIME_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setSelectedTime(t);
                            setIsTimeDropdownOpen(false);
                            persistSettings({ selectedTime: t });
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center justify-between ${
                            selectedTime === t ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{t}</span>
                          {selectedTime === t && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* JOB TITLES & LOCATION 2-Column Section Matching Image 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
              {/* Left Column: JOB TITLES */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>JOB TITLES</span>
                </div>

                {/* Input + Plus Button */}
                <form onSubmit={handleAddJobTitle} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={jobTitleInput}
                    onChange={(e) => setJobTitleInput(e.target.value)}
                    placeholder="e.g. Data Engineer"
                    className="flex-1 h-[40px] px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[#EEF2FF] shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="w-10 h-[40px] rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow"
                    title="Add Job Title"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </form>

                {/* Added Job Title Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1 min-h-[32px]">
                  {jobTitles.map((title) => (
                    <span
                      key={title}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]/70 shadow-2xs"
                    >
                      <span>{title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveJobTitle(title)}
                        className="hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: LOCATION */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>LOCATION</span>
                </div>

                {/* Input + Plus Button */}
                <form onSubmit={handleAddLocation} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="e.g. Dallas, TX"
                    className="flex-1 h-[40px] px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[#EEF2FF] shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="w-10 h-[40px] rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow"
                    title="Add Location"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </form>

                {/* Added Location Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1 min-h-[32px]">
                  {locations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]/70 shadow-2xs"
                    >
                      <span>{loc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(loc)}
                        className="hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= Phone Number Modal ================= */}
          {isPhoneModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setIsPhoneModalOpen(false)}
            >
              <div
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#4F46E5]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {phoneNumber ? "Edit Phone Number" : "Add Phone Number"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your phone number with country code. This number will be used for C2C recruiter communications and application auto-fill.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (phoneError) setPhoneError("");
                    }}
                    placeholder="+1 (555) 234-5678"
                    className="w-full h-10 px-3.5 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-[#EEF2FF]"
                  />
                  {phoneError && (
                    <span className="text-xs text-rose-600 font-medium">{phoneError}</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePhone}
                    className="px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-all shadow-2xs hover:shadow cursor-pointer"
                  >
                    Save Phone Number
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= Gmail Connect Modal ================= */}
          {isGmailModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setIsGmailModalOpen(false)}
            >
              <div
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GmailLogo />
                    <h3 className="text-base font-bold text-slate-900">
                      Connect Google Account
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGmailModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Connect your Gmail address to allow Auto Jobs Apply to send C2C applications directly from your email on your behalf.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Gmail Address</label>
                  <input
                    type="email"
                    value={gmailInput}
                    onChange={(e) => setGmailInput(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full h-10 px-3.5 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-[#EEF2FF]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGmailModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmGmailConnect}
                    className="px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-all shadow-2xs hover:shadow cursor-pointer flex items-center gap-2"
                  >
                    <GmailLogo />
                    <span>Authorize & Connect</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default C2CAutoApply;
