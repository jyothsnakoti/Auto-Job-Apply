import React, { useState, useEffect, useMemo, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getApplications, getStoredApplicationsData } from "../services/applicationService";
import tickIcon from "../assets/tick.svg";

const DocumentIcon = ({ color = "#6366F1" }) => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-[14px] h-[14px] object-contain shrink-0"
  />
);

// 9 Filters in exact order requested by user, matching the provided screenshot
export const TRACKER_FILTERS = [
  {
    name: "All",
    activeClass: "bg-[#181F2C] text-white border-[#181F2C] shadow-xs",
    inactiveClass: "bg-white text-[#64748B] border border-slate-200 hover:bg-slate-50",
  },
  {
    name: "Verification",
    activeClass: "bg-[#2563EB] text-white border-[#2563EB] shadow-xs font-semibold",
    inactiveClass: "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#DBEAFE]",
    badgeClass: "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
    dotClass: "bg-[#2563EB]",
  },
  {
    name: "Rejection",
    activeClass: "bg-[#DC2626] text-white border-[#DC2626] shadow-xs font-semibold",
    inactiveClass: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]",
    badgeClass: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
    dotClass: "bg-[#DC2626]",
  },
  {
    name: "Interview",
    activeClass: "bg-[#059669] text-white border-[#059669] shadow-xs font-semibold",
    inactiveClass: "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] hover:bg-[#D1FAE5]",
    badgeClass: "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]",
    dotClass: "bg-[#059669]",
  },
  {
    name: "Recruiter",
    activeClass: "bg-[#0284C7] text-white border-[#0284C7] shadow-xs font-semibold",
    inactiveClass: "bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD] hover:bg-[#E0F2FE]",
    badgeClass: "bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]",
    dotClass: "bg-[#0284C7]",
  },
  {
    name: "Assessment",
    activeClass: "bg-[#EA580C] text-white border-[#EA580C] shadow-xs font-semibold",
    inactiveClass: "bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA] hover:bg-[#FFEDD5]",
    badgeClass: "bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]",
    dotClass: "bg-[#EA580C]",
  },
  {
    name: "Reminder",
    activeClass: "bg-[#D97706] text-white border-[#D97706] shadow-xs font-semibold",
    inactiveClass: "bg-[#FEFCE8] text-[#D97706] border border-[#FEF08A] hover:bg-[#FEF08A]",
    badgeClass: "bg-[#FEFCE8] text-[#D97706] border border-[#FEF08A]",
    dotClass: "bg-[#D97706]",
  },
  {
    name: "Offer",
    activeClass: "bg-[#9333EA] text-white border-[#9333EA] shadow-xs font-semibold",
    inactiveClass: "bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF] hover:bg-[#F3E8FF]",
    badgeClass: "bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]",
    dotClass: "bg-[#9333EA]",
  },
  {
    name: "Applied",
    activeClass: "bg-[#0D9488] text-white border-[#0D9488] shadow-xs font-semibold",
    inactiveClass: "bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4] hover:bg-[#CCFBF1]",
    badgeClass: "bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]",
    dotClass: "bg-[#0D9488]",
  },
];

const STATUS_METADATA = {
  Verification: {
    badgeClass: "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]",
    dotClass: "bg-[#2563EB]",
  },
  Rejection: {
    badgeClass: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
    dotClass: "bg-[#DC2626]",
  },
  Interview: {
    badgeClass: "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]",
    dotClass: "bg-[#059669]",
  },
  Recruiter: {
    badgeClass: "bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]",
    dotClass: "bg-[#0284C7]",
  },
  Assessment: {
    badgeClass: "bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]",
    dotClass: "bg-[#EA580C]",
  },
  Reminder: {
    badgeClass: "bg-[#FEFCE8] text-[#D97706] border border-[#FEF08A]",
    dotClass: "bg-[#D97706]",
  },
  Offer: {
    badgeClass: "bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]",
    dotClass: "bg-[#9333EA]",
  },
  Applied: {
    badgeClass: "bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]",
    dotClass: "bg-[#0D9488]",
  },
};

const CUSTOM_APPS_STORAGE_KEY = "jobTrackerCustomApplications";
const STATUS_OVERRIDES_STORAGE_KEY = "jobTrackerStatusOverrides";

const formatPostedDate = (postedAt) => {
  if (!postedAt) return "Recently";
  try {
    const date = new Date(postedAt);
    if (isNaN(date.getTime())) return String(postedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Just now";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 0) {
      if (diffHours <= 1) return "Just now";
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(postedAt);
  }
};

const getCompanyAvatarBg = (name) => {
  if (!name) return "bg-indigo-600";
  const colors = [
    "bg-indigo-600",
    "bg-blue-600",
    "bg-emerald-600",
    "bg-purple-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-cyan-600",
    "bg-violet-600",
    "bg-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const isLegacyMockId = (id) => {
  if (!id) return false;
  const str = String(id);
  const mockIds = ["app-1", "app-2", "app-3", "app-4", "app-5", "app-6", "app-7", "app-8", "app-9", "app-10", "app-11", "app-12"];
  return mockIds.includes(str);
};

const Tracker = () => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [statusDropdownOpenId, setStatusDropdownOpenId] = useState(null);

  // New Application Form State
  const [newCompany, setNewCompany] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newStatus, setNewStatus] = useState("Applied");
  const [newLocation, setNewLocation] = useState("Remote");
  const [newSalary, setNewSalary] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Clean legacy mock items from storage on mount
  useEffect(() => {
    try {
      const oldTrackerApps = localStorage.getItem("jobTrackerApplications");
      if (oldTrackerApps) {
        const parsed = JSON.parse(oldTrackerApps);
        if (Array.isArray(parsed)) {
          const nonMock = parsed.filter((item) => !isLegacyMockId(item?.id));
          if (nonMock.length !== parsed.length) {
            localStorage.setItem("jobTrackerApplications", JSON.stringify(nonMock));
          }
        }
      }
    } catch (e) {
      console.warn("Storage cleanup note:", e);
    }
  }, []);

  // Fetch real applications from applicationService and merge custom applications
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Read status overrides from storage
      let statusOverrides = {};
      try {
        const rawOverrides = localStorage.getItem(STATUS_OVERRIDES_STORAGE_KEY);
        if (rawOverrides) statusOverrides = JSON.parse(rawOverrides) || {};
      } catch (e) {
        console.warn("Error reading status overrides:", e);
      }

      // 2. Read custom user-added applications from storage
      let customApps = [];
      try {
        const rawCustom = localStorage.getItem(CUSTOM_APPS_STORAGE_KEY);
        if (rawCustom) {
          const parsed = JSON.parse(rawCustom);
          if (Array.isArray(parsed)) {
            customApps = parsed.filter((a) => !isLegacyMockId(a?.id));
          }
        }
      } catch (e) {
        console.warn("Error reading custom applications:", e);
      }

      // 3. Fetch real applications from API
      let apiItems = [];
      try {
        const result = await getApplications({ tab: "all", size: 100 });
        if (result && Array.isArray(result.items)) {
          apiItems = result.items;
        }
      } catch (err) {
        console.debug("[Tracker] API fetch note:", err?.message);
      }

      // 4. Fallback to cached applications data if API was empty/unavailable
      if (apiItems.length === 0) {
        try {
          const cached = getStoredApplicationsData();
          if (Array.isArray(cached)) {
            apiItems = cached;
          } else if (cached && Array.isArray(cached.items)) {
            apiItems = cached.items;
          } else if (cached && Array.isArray(cached.applications)) {
            apiItems = cached.applications;
          }
        } catch (e) {
          console.debug("[Tracker] Cache fallback note:", e);
        }
      }

      // 5. Map real applications into standard tracker format
      const mappedApiApps = apiItems
        .filter((item) => item && !isLegacyMockId(item.id || item._id))
        .map((item, index) => {
          const nestedJob =
            item && typeof item === "object" && typeof item.job === "object" && item.job !== null
              ? item.job
              : item && typeof item === "object" && typeof item.jobDetails === "object" && item.jobDetails !== null
              ? item.jobDetails
              : {};

          const id = String(
            item.id ||
            item._id ||
            item.applicationId ||
            item.application_id ||
            `real-${index}-${item.jobId || item.job_id || Date.now()}`
          );

          const company =
            item.companyName ||
            nestedJob.companyName ||
            item.company ||
            nestedJob.company ||
            "Hiring Organization";

          const jobTitle =
            item.title ||
            nestedJob.title ||
            item.jobTitle ||
            nestedJob.jobTitle ||
            "Job Position";

          const location =
            item.location ||
            nestedJob.location ||
            item.fullLocation ||
            nestedJob.fullLocation ||
            "Remote";

          const fullLocation =
            nestedJob.fullLocation ||
            item.fullLocation ||
            location;

          const workMode =
            item.workMode ||
            nestedJob.workMode ||
            item.workplace ||
            nestedJob.workplace ||
            "Remote";

          const type =
            item.employmentType ||
            nestedJob.employmentType ||
            item.type ||
            nestedJob.type ||
            "Full-time";

          const salary = item.salary || nestedJob.salary || "Competitive";

          const rawScore =
            item.matchScore ??
            nestedJob.matchScore ??
            item.atsScore ??
            nestedJob.atsScore ??
            null;

          const matchPercent =
            rawScore !== null && !isNaN(Number(rawScore))
              ? Math.round(Number(rawScore))
              : null;

          const atsMatch = matchPercent !== null ? `${matchPercent}%` : "—";
          const atsColor =
            matchPercent !== null && matchPercent >= 90
              ? "text-[#059669]"
              : matchPercent !== null && matchPercent >= 80
              ? "text-[#D97706]"
              : "text-[#64748B]";

          const rawResume = item.resumeType || item.resume || "TAILORED";
          const resume =
            String(rawResume).toUpperCase().includes("ORIGIN")
              ? "Original"
              : "Tailored";

          const appliedDate =
            item.appliedDate ||
            item.createdAt ||
            item.appliedAt ||
            item.updatedAt ||
            null;
          const applied = formatPostedDate(appliedDate);

          // Normalize stage
          const rawStatus = String(
            item.status || item.tab || item.state || item.statusCategory || "Applied"
          ).toUpperCase();

          let status = "Applied";
          if (rawStatus.includes("INTERVIEW") || rawStatus.includes("SCHEDULED")) {
            status = "Interview";
          } else if (
            rawStatus.includes("REJECT") ||
            rawStatus.includes("FAILED") ||
            rawStatus.includes("ERROR") ||
            rawStatus.includes("UNSUCCESSFUL")
          ) {
            status = "Rejection";
          } else if (
            rawStatus.includes("OFFER") ||
            rawStatus.includes("ACCEPTED") ||
            rawStatus.includes("HIRED")
          ) {
            status = "Offer";
          } else if (
            rawStatus.includes("ASSESS") ||
            rawStatus.includes("TEST") ||
            rawStatus.includes("OA") ||
            rawStatus.includes("CHALLENGE")
          ) {
            status = "Assessment";
          } else if (
            rawStatus.includes("VERIF") ||
            rawStatus.includes("NEEDS_ACTION") ||
            rawStatus.includes("ACTION_REQUIRED") ||
            rawStatus.includes("ACTION_NEEDED")
          ) {
            status = "Verification";
          } else if (
            rawStatus.includes("RECRUIT") ||
            rawStatus.includes("OUTREACH") ||
            rawStatus.includes("CONTACTED")
          ) {
            status = "Recruiter";
          } else if (
            rawStatus.includes("REMIND") ||
            rawStatus.includes("FOLLOW_UP") ||
            rawStatus.includes("QUESTIONNAIRE")
          ) {
            status = "Reminder";
          } else {
            status = "Applied";
          }

          // Apply manual override if user changed stage
          if (statusOverrides[id]) {
            status = statusOverrides[id];
          }

          const logo =
            item.logo ||
            nestedJob.logo ||
            item.companyLogo ||
            nestedJob.companyLogo ||
            null;

          return {
            id,
            company,
            companyInitial: company.charAt(0).toUpperCase(),
            companyBg: getCompanyAvatarBg(company),
            logo,
            jobTitle,
            location,
            fullLocation,
            workMode,
            type,
            salary,
            atsMatch,
            matchPercent,
            atsColor,
            resume,
            resumeColor: resume === "Tailored" ? "text-[#6366F1]" : "text-[#475569]",
            resumeIconColor: resume === "Tailored" ? "#6366F1" : "#475569",
            status,
            applied,
            appliedDate,
            nextStep:
              item.nextStep ||
              (status === "Verification"
                ? "Identity / Action verification required"
                : status === "Interview"
                ? "Interview stage in progress"
                : `Stage: ${status}`),
            notes: item.notes || `Application logged under ${status}.`,
            description:
              item.description ||
              nestedJob.description ||
              item.jobDescription ||
              "Full details available via employer portal.",
            responsibilities: Array.isArray(nestedJob.responsibilities)
              ? nestedJob.responsibilities
              : ["Manage application requirements and candidate profile"],
            requiredSkills: Array.isArray(nestedJob.requiredSkills)
              ? nestedJob.requiredSkills
              : [],
            preferredSkills: Array.isArray(nestedJob.preferredSkills)
              ? nestedJob.preferredSkills
              : [],
            experience: item.experience || nestedJob.experience || "Not specified",
            rawItem: item,
          };
        });

      // Combine custom applications and API applications, avoiding duplicates
      const seenIds = new Set();
      const combined = [];

      for (const app of [...customApps, ...mappedApiApps]) {
        if (!app || !app.id || seenIds.has(app.id)) continue;
        seenIds.add(app.id);
        combined.push(app);
      }

      setApplications(combined);
    } catch (e) {
      console.error("[Tracker] Failed to load applications:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and listeners for real-time application updates
  useEffect(() => {
    loadApplications();

    const handleApplicationsUpdated = () => {
      loadApplications();
    };

    window.addEventListener("applicationsUpdated", handleApplicationsUpdated);
    window.addEventListener("applicationsDataUpdated", handleApplicationsUpdated);

    return () => {
      window.removeEventListener("applicationsUpdated", handleApplicationsUpdated);
      window.removeEventListener("applicationsDataUpdated", handleApplicationsUpdated);
    };
  }, [loadApplications]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedJobModal(null);
        setIsNewJobModalOpen(false);
        setStatusDropdownOpenId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update an application's status
  const handleUpdateStatus = useCallback((appId, nextStatus) => {
    // 1. Update in-memory state
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            status: nextStatus,
            nextStep: `Moved to ${nextStatus} stage on ${new Date().toLocaleDateString()}`,
          };
        }
        return app;
      })
    );
    setStatusDropdownOpenId(null);

    // 2. Persist status override
    try {
      const rawOverrides = localStorage.getItem(STATUS_OVERRIDES_STORAGE_KEY);
      const overrides = rawOverrides ? JSON.parse(rawOverrides) || {} : {};
      overrides[appId] = nextStatus;
      localStorage.setItem(STATUS_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    } catch (e) {
      console.warn("Error saving status override:", e);
    }

    // 3. Update custom applications list if it's a custom app
    try {
      const rawCustom = localStorage.getItem(CUSTOM_APPS_STORAGE_KEY);
      if (rawCustom) {
        const customList = JSON.parse(rawCustom);
        if (Array.isArray(customList)) {
          const updatedCustom = customList.map((c) =>
            c.id === appId ? { ...c, status: nextStatus } : c
          );
          localStorage.setItem(CUSTOM_APPS_STORAGE_KEY, JSON.stringify(updatedCustom));
        }
      }
    } catch (e) {
      console.warn("Error updating custom apps storage:", e);
    }

    // 4. Update modal if currently opened
    setSelectedJobModal((current) => {
      if (current && current.id === appId) {
        return {
          ...current,
          status: nextStatus,
          nextStep: `Moved to ${nextStatus} stage on ${new Date().toLocaleDateString()}`,
        };
      }
      return current;
    });
  }, []);

  // Add new custom tracked application
  const handleAddNewApplication = (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newJobTitle.trim()) return;

    const companyName = newCompany.trim();
    const newApp = {
      id: `custom-${Date.now()}`,
      company: companyName,
      companyInitial: companyName.charAt(0).toUpperCase(),
      companyBg: getCompanyAvatarBg(companyName),
      jobTitle: newJobTitle.trim(),
      atsMatch: "—",
      matchPercent: null,
      atsColor: "text-[#64748B]",
      resume: "Tailored",
      resumeColor: "text-[#6366F1]",
      resumeIconColor: "#6366F1",
      status: newStatus,
      applied: "Just now",
      location: newLocation.trim() || "Remote",
      fullLocation: newLocation.trim() || "Remote",
      type: "Full-time",
      workMode: "Remote",
      department: "Engineering",
      salary: newSalary.trim() || "Competitive",
      nextStep: `Tracked in ${newStatus} stage`,
      notes: newNotes.trim() || "Manually logged application.",
      description: "Custom tracked application entered by user.",
      responsibilities: ["Review application requirements and candidate portal"],
      requiredSkills: [],
      preferredSkills: [],
      experience: "Not specified",
    };

    // Update in-memory state
    setApplications((prev) => [newApp, ...prev]);

    // Save to custom storage
    try {
      const rawCustom = localStorage.getItem(CUSTOM_APPS_STORAGE_KEY);
      const customList = rawCustom ? JSON.parse(rawCustom) || [] : [];
      localStorage.setItem(
        CUSTOM_APPS_STORAGE_KEY,
        JSON.stringify([newApp, ...customList])
      );
    } catch (err) {
      console.warn("Error persisting custom application:", err);
    }

    setIsNewJobModalOpen(false);
    setNewCompany("");
    setNewJobTitle("");
    setNewStatus("Applied");
    setNewLocation("Remote");
    setNewSalary("");
    setNewNotes("");
  };

  // Delete an application
  const handleDeleteApplication = (appId) => {
    setApplications((prev) => prev.filter((a) => a.id !== appId));

    // Remove from custom apps storage
    try {
      const rawCustom = localStorage.getItem(CUSTOM_APPS_STORAGE_KEY);
      if (rawCustom) {
        const customList = JSON.parse(rawCustom);
        if (Array.isArray(customList)) {
          const filtered = customList.filter((c) => c.id !== appId);
          localStorage.setItem(CUSTOM_APPS_STORAGE_KEY, JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn("Error deleting custom application:", e);
    }

    // Remove from status overrides
    try {
      const rawOverrides = localStorage.getItem(STATUS_OVERRIDES_STORAGE_KEY);
      if (rawOverrides) {
        const overrides = JSON.parse(rawOverrides);
        delete overrides[appId];
        localStorage.setItem(STATUS_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
      }
    } catch (e) {
      console.warn("Error deleting status override:", e);
    }

    if (selectedJobModal?.id === appId) {
      setSelectedJobModal(null);
    }
  };

  // Filtered applications based on active pill and search query
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesFilter =
        selectedFilter === "All" ||
        String(app.status || "").toLowerCase() === selectedFilter.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        String(app.company || "").toLowerCase().includes(query) ||
        String(app.jobTitle || "").toLowerCase().includes(query) ||
        String(app.location || "").toLowerCase().includes(query) ||
        String(app.notes || "").toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [applications, selectedFilter, searchQuery]);

  // Statistics counters for top cards
  const stats = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter((a) => a.status === "Interview").length;
    const offers = applications.filter((a) => a.status === "Offer").length;
    const assessments = applications.filter((a) => a.status === "Assessment").length;
    const verifications = applications.filter((a) => a.status === "Verification").length;
    return { total, interviews, offers, assessments, verifications };
  }, [applications]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Application Tracker Main Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 flex flex-col gap-6 w-full max-w-7xl mx-auto">
          {/* Page Heading & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-[20px] sm:text-[24px] font-bold text-[#0F172A] tracking-tight">
                Tracker
              </h1>
              <p className="text-[13px] text-[#64748B]">
                Track, filter, and manage your job applications across every hiring stage.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadApplications}
                className="h-[38px] px-3.5 rounded-[10px] border border-slate-200 bg-white text-[#475569] hover:bg-slate-50 text-[13px] font-medium flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Refresh applications"
              >
                <svg className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#2563EB]" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNewJobModalOpen(true)}
                className="h-[38px] px-4 rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Application</span>
              </button>
            </div>
          </div>

          {/* Quick Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Total Tracked
              </span>
              <p className="text-[22px] font-bold text-[#0F172A] mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#059669] uppercase tracking-wider">
                Interviews
              </span>
              <p className="text-[22px] font-bold text-[#059669] mt-1">{stats.interviews}</p>
            </div>
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#9333EA] uppercase tracking-wider">
                Offers
              </span>
              <p className="text-[22px] font-bold text-[#9333EA] mt-1">{stats.offers}</p>
            </div>
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-[#EA580C] uppercase tracking-wider">
                Assessments
              </span>
              <p className="text-[22px] font-bold text-[#EA580C] mt-1">{stats.assessments}</p>
            </div>
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider">
                Verification
              </span>
              <p className="text-[22px] font-bold text-[#2563EB] mt-1">{stats.verifications}</p>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-5 w-full">
            
            {/* Top Toolbar: Search + Reset */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by company, role, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[38px] pl-9 pr-3 text-[13px] rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                />
                <svg
                  className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                </svg>
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[12.5px] text-[#64748B] hover:text-[#0F172A] transition-colors self-start sm:self-auto"
                >
                  Clear search
                </button>
              )}
            </div>

            {/* Filter Pills Row - Exactly matching the user's uploaded screenshot */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {TRACKER_FILTERS.map((tab) => {
                const isActive = selectedFilter === tab.name;
                return (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => setSelectedFilter(tab.name)}
                    className={`h-[32px] sm:h-[34px] px-3.5 sm:px-4 rounded-full text-[13px] font-medium flex items-center justify-center whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isActive ? tab.activeClass : tab.inactiveClass
                    }`}
                  >
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Applications Table / Empty State / Loading State */}
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <svg className="w-6 h-6 animate-spin text-[#2563EB]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-[13px] font-medium text-[#64748B]">Loading tracker applications...</p>
              </div>
            ) : applications.length === 0 ? (
              /* Global Empty State: No applications at all */
              <div className="p-10 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center gap-3 my-2">
                <div className="w-14 h-14 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="max-w-md">
                  <h3 className="text-[15px] font-bold text-[#0F172A]">No applications tracked yet</h3>
                  <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">
                    Applications you apply to via Auto Apply or Browse Jobs will appear here automatically. You can also manually track any role by clicking "Add Application".
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(true)}
                  className="mt-1 h-[38px] px-4 rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add First Application</span>
                </button>
              </div>
            ) : filteredApplications.length === 0 ? (
              /* Filter / Search Empty State */
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-[14px] font-semibold text-[#0F172A]">No applications found</h3>
                <p className="text-[12.5px] text-[#64748B] max-w-sm">
                  {searchQuery
                    ? `No results matching "${searchQuery}" in ${selectedFilter} filter.`
                    : `There are currently no applications categorized under ${selectedFilter}.`}
                </p>
                {selectedFilter !== "All" && (
                  <button
                    type="button"
                    onClick={() => setSelectedFilter("All")}
                    className="mt-2 text-[12.5px] font-medium text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All Applications ({applications.length})
                  </button>
                )}
              </div>
            ) : (
              /* Active Applications Table */
              <div className="overflow-x-auto w-full -mx-5 sm:mx-0 px-5 sm:px-0">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Company
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        ATS Match
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Resume
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider text-right pr-2">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplications.map((app) => {
                      const meta = STATUS_METADATA[app.status] || STATUS_METADATA.Applied;
                      const isDropdownOpen = statusDropdownOpenId === app.id;

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          onClick={() => setSelectedJobModal(app)}
                        >
                          {/* Company */}
                          <td className="py-4 pr-3">
                            <div className="flex items-center gap-2.5">
                              {app.logo ? (
                                <div className="w-[30px] h-[30px] rounded-[7px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-1">
                                  <img
                                    src={app.logo}
                                    alt={app.company}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`w-[30px] h-[30px] rounded-[7px] ${
                                    app.companyBg || "bg-[#4F46E5]"
                                  } text-white font-bold text-[13px] flex items-center justify-center shrink-0 shadow-xs`}
                                >
                                  {app.companyInitial || app.company.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-[13.5px] font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                                {app.company}
                              </span>
                            </div>
                          </td>

                          {/* Job Title */}
                          <td className="py-4 px-3 text-[13.5px] font-medium text-[#334155]">
                            <div className="flex flex-col">
                              <span>{app.jobTitle}</span>
                              <span className="text-[11.5px] text-[#94A3B8] font-normal">
                                {app.location} • {app.workMode}
                              </span>
                            </div>
                          </td>

                          {/* ATS Match */}
                          <td className="py-4 px-3">
                            <span className={`text-[13px] font-bold ${app.atsColor || "text-[#059669]"}`}>
                              {app.atsMatch}
                            </span>
                          </td>

                          {/* Resume */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-1.5">
                              <DocumentIcon color={app.resumeIconColor || "#6366F1"} />
                              <span className={`text-[12.5px] font-medium ${app.resumeColor || "text-[#6366F1]"}`}>
                                {app.resume || "Tailored"}
                              </span>
                            </div>
                          </td>

                          {/* Status Pill matching Filter Badge colors */}
                          <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() =>
                                  setStatusDropdownOpenId(isDropdownOpen ? null : app.id)
                                }
                                className={`h-[28px] px-2.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${meta.badgeClass}`}
                                title="Click to change status"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                                <span>{app.status}</span>
                                <svg
                                  className="w-3 h-3 opacity-60 ml-0.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {/* Dropdown status menu */}
                              {isDropdownOpen && (
                                <div className="absolute left-0 mt-1.5 w-40 rounded-[12px] bg-white border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                  <div className="px-3 py-1 text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                                    Change Stage
                                  </div>
                                  {TRACKER_FILTERS.filter((f) => f.name !== "All").map((f) => (
                                    <button
                                      key={f.name}
                                      type="button"
                                      onClick={() => handleUpdateStatus(app.id, f.name)}
                                      className={`w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                                        app.status === f.name ? "font-bold text-[#0F172A]" : "text-[#475569]"
                                      }`}
                                    >
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          STATUS_METADATA[f.name]?.dotClass || "bg-slate-400"
                                        }`}
                                      />
                                      <span>{f.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Applied Date */}
                          <td className="py-4 px-3 text-[12.5px] text-[#64748B]">
                            {app.applied}
                          </td>

                          {/* Actions */}
                          <td className="py-4 pl-3 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedJobModal(app)}
                                className="h-[28px] px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[12px] font-medium text-[#334155] hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteApplication(app.id)}
                                className="h-[28px] w-[28px] rounded-[8px] text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                                title="Remove from tracker"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Summary */}
            {!isLoading && applications.length > 0 && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[12.5px] text-[#64748B] flex-wrap gap-2">
                <span>
                  Showing {filteredApplications.length} of {applications.length} applications
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[12px] text-[#64748B]">Tracker sync active</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ======================= Job Details Modal Popup ======================= */}
      {selectedJobModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 sm:p-6"
          onClick={() => setSelectedJobModal(null)}
        >
          <div
            className="bg-white rounded-[20px] max-w-[560px] w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {selectedJobModal.logo ? (
                  <div className="w-[48px] h-[48px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2.5 mt-0.5">
                    <img
                      src={selectedJobModal.logo}
                      alt={selectedJobModal.company}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className={`w-[48px] h-[48px] rounded-[12px] ${
                      selectedJobModal.companyBg || "bg-[#4F46E5]"
                    } text-white font-bold text-[18px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}
                  >
                    {selectedJobModal.companyInitial || selectedJobModal.company.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col">
                  <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight leading-tight">
                    {selectedJobModal.jobTitle}
                  </h2>

                  <div className="flex items-center gap-1.5 text-[14px] text-[#475569] font-medium mt-1">
                    <span>{selectedJobModal.company}</span>
                    <VerifiedTick />
                  </div>

                  <div className="flex items-center gap-2 text-[12px] text-[#64748B] mt-2 flex-wrap">
                    <span>{selectedJobModal.fullLocation || selectedJobModal.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedJobModal.type || "Full-time"}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedJobModal.workMode || "Remote"}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedJobModal(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Status Update Banner */}
              <div className="p-4 rounded-[14px] border border-slate-200 bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[12.5px] font-medium text-[#475569]">Current Stage:</span>
                  <span
                    className={`h-[26px] px-2.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 ${
                      STATUS_METADATA[selectedJobModal.status]?.badgeClass || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        STATUS_METADATA[selectedJobModal.status]?.dotClass || "bg-slate-500"
                      }`}
                    />
                    {selectedJobModal.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="stage-selector" className="text-[12px] text-[#64748B]">
                    Move to:
                  </label>
                  <select
                    id="stage-selector"
                    value={selectedJobModal.status}
                    onChange={(e) => handleUpdateStatus(selectedJobModal.id, e.target.value)}
                    className="h-[32px] px-2.5 rounded-[8px] border border-slate-200 bg-white text-[12.5px] font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  >
                    {TRACKER_FILTERS.filter((f) => f.name !== "All").map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Next Steps / Stage Note */}
              {selectedJobModal.nextStep && (
                <div className="p-3.5 rounded-[12px] bg-blue-50/80 border border-blue-100 flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-[12.5px] text-[#1E40AF]">
                    <span className="font-semibold">Next Step: </span>
                    {selectedJobModal.nextStep}
                  </div>
                </div>
              )}

              {/* ATS & Salary Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    ATS Match Score
                  </span>
                  <span className="text-[18px] font-bold text-[#059669]">
                    {selectedJobModal.atsMatch}
                  </span>
                </div>
                <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Compensation
                  </span>
                  <span className="text-[14.5px] font-bold text-[#0F172A]">
                    {selectedJobModal.salary || "Competitive"}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedJobModal.notes && (
                <div>
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Tracker Notes</h3>
                  <p className="text-[13px] text-[#475569] mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-[10px] border border-slate-100">
                    {selectedJobModal.notes}
                  </p>
                </div>
              )}

              {/* Description */}
              {selectedJobModal.description && (
                <div>
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">About the Role</h3>
                  <p className="text-[13px] text-[#475569] mt-1.5 leading-relaxed">
                    {selectedJobModal.description}
                  </p>
                </div>
              )}

              {/* Key Responsibilities */}
              {selectedJobModal.responsibilities && selectedJobModal.responsibilities.length > 0 && (
                <div>
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Key Responsibilities</h3>
                  <ul className="space-y-1.5 mt-2">
                    {selectedJobModal.responsibilities.map((resp, idx) => (
                      <li key={idx} className="text-[12.5px] text-[#475569] flex items-start gap-2">
                        <span className="text-[#94A3B8] shrink-0">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Skills */}
              {selectedJobModal.requiredSkills && selectedJobModal.requiredSkills.length > 0 && (
                <div>
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Required Skills</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedJobModal.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-[#F1F5F9] text-[#334155] rounded-[7px] px-2.5 py-1 text-[12px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteApplication(selectedJobModal.id)}
                className="text-[12.5px] text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Delete from Tracker
              </button>

              <button
                type="button"
                onClick={() => setSelectedJobModal(null)}
                className="h-[38px] px-5 rounded-[10px] bg-[#0F172A] hover:bg-slate-800 text-white text-[13px] font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= Add New Application Modal ======================= */}
      {isNewJobModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 sm:p-6"
          onClick={() => setIsNewJobModalOpen(false)}
        >
          <div
            className="bg-white rounded-[20px] max-w-[500px] w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-[#0F172A]">Track New Application</h2>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">
                  Manually add an application to your tracker pipeline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewJobModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddNewApplication} className="p-6 space-y-4">
              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Stripe, Microsoft"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-[8px] border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-[8px] border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-[8px] border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563EB] bg-white cursor-pointer"
                  >
                    {TRACKER_FILTERS.filter((f) => f.name !== "All").map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, Bengaluru"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-[8px] border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Salary / Compensation
                </label>
                <input
                  type="text"
                  placeholder="e.g. $140k - $160k or ₹32 LPA"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-[8px] border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Notes / Next Steps
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Technical interview scheduled, or referral submitted"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-[8px] border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="h-[38px] px-4 rounded-[10px] border border-slate-200 text-[13px] font-medium text-[#64748B] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[38px] px-5 rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium shadow-xs transition-colors cursor-pointer"
                >
                  Add to Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
