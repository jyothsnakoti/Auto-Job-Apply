import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getMoreJobsForResume, getPrimaryResumeId, getOnboardingState } from "../services/api";

import googleLogo from "../assets/google.svg";
import microsoftLogo from "../assets/microsoft.svg";
import amazonLogo from "../assets/amazon.svg";
import aiLogo from "../assets/ai.svg";
import mapIcon from "../assets/map.svg";
import tickIcon from "../assets/tick.svg";

const dateOptions = [
  "Last 6 hours",
  "Last 24 hours",
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
  "All time",
];

const locationOptions = [
  "Bengaluru, IN",
  "Hyderabad, IN",
  "Pune, IN",
  "Mumbai, IN",
  "Delhi NCR, IN",
  "Chennai, IN",
  "Remote",
  "San Francisco, US",
  "New York, US",
  "London, UK",
];

const workplaceOptions = ["On-site", "Hybrid", "Remote"];

const companyOptions = [
  "Google",
  "Microsoft",
  "Amazon",
  "Atlassian",
  "Shopify",
  "Meta",
  "Apple",
  "Netflix",
  "Uber",
  "Adobe",
  "Salesforce",
  "Oracle",
  "Spotify",
  "Stripe",
];

const roleOptions = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Product Manager",
  "Data Scientist",
  "Machine Learning Engineer",
];

const jobTypeOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

const degreeOptions = [
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Associate Degree",
  "No Degree Required",
];

const experienceOptions = [
  "Entry Level (0-1 yrs)",
  "Junior (1-3 yrs)",
  "Mid-Level (3-5 yrs)",
  "Senior (5-8 yrs)",
  "Lead / Principal (8+ yrs)",
];

const getMatchPercent = (job) => {
  if (job?.overall_score !== undefined && job?.overall_score !== null) {
    const num = Number(job.overall_score);
    return isNaN(num) ? 0 : num;
  }
  if (job?.matchPercent !== undefined && job?.matchPercent !== null) {
    return Number(job.matchPercent);
  }
  return 0;
};

const getMatchLabel = (job) => {
  if (job?.overall_score !== undefined && job?.overall_score !== null) {
    const num = Number(job.overall_score);
    return `${Number.isInteger(num) ? num : num.toFixed(1)}% match`;
  }
  return job?.match || `${getMatchPercent(job)}% match`;
};

const getMatchBadgeColor = (percent) => {
  if (percent >= 90) return "bg-[#ECFDF5] text-[#059669]";
  if (percent >= 70) return "bg-[#EFF6FF] text-[#2563EB]";
  if (percent >= 50) return "bg-[#FFFBEB] text-[#D97706]";
  return "bg-[#FEF2F2] text-[#DC2626]";
};

const getMatchedSkills = (job) => {
  if (job?.score_data?.match_details && Array.isArray(job.score_data.match_details)) {
    return job.score_data.match_details
      .map((m) => {
        if (typeof m === "string") return m;
        return m?.skill || m?.name || m?.keyword || m?.matched_skill || "";
      })
      .filter(Boolean);
  }
  if (job?.score_data?.matched_skills && Array.isArray(job.score_data.matched_skills)) {
    return job.score_data.matched_skills;
  }
  return job?.requiredSkills || [];
};

const getMissingRequiredSkills = (job) => {
  if (job?.score_data?.missing_required_skills && Array.isArray(job.score_data.missing_required_skills)) {
    return job.score_data.missing_required_skills;
  }
  return [];
};

const getMissingPreferredSkills = (job) => {
  if (job?.score_data?.missing_preferred_skills && Array.isArray(job.score_data.missing_preferred_skills)) {
    return job.score_data.missing_preferred_skills;
  }
  return job?.preferredSkills || [];
};

const getMissingKeywords = (job) => {
  if (job?.score_data?.missing_keywords && Array.isArray(job.score_data.missing_keywords)) {
    return job.score_data.missing_keywords;
  }
  return [];
};

const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-[14px] h-[14px] object-contain shrink-0"
  />
);

const BrowseJobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isJobSaved, setIsJobSaved] = useState(false);

  // Dynamic Jobs & Browse Jobs Pagination State
  const [jobs, setJobs] = useState([]);
  const [lastJobId, setLastJobId] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [jobError, setJobError] = useState(null);
  const [jobFeedbackMessage, setJobFeedbackMessage] = useState(null);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);

  // Filter States
  const [selectedDate, setSelectedDate] = useState("Last 7 days");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedWorkplace, setSelectedWorkplace] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedDegrees, setSelectedDegrees] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [sponsorsVisa, setSponsorsVisa] = useState(false);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState([]);

  const dropdownRef = useRef(null);

  // Auto-fetch initial jobs on mount
  useEffect(() => {
    const loadInitialJobs = async () => {
      try {
        setIsLoadingJobs(true);
        setJobError(null);
        setJobFeedbackMessage(null);

        let activeResumeId = await getPrimaryResumeId();
        if (activeResumeId) {
          setResumeId(activeResumeId);
        }

        const onboarding = getOnboardingState();
        if (!activeResumeId && onboarding?.resumeId) {
          activeResumeId = String(onboarding.resumeId);
          setResumeId(activeResumeId);
        }

        if (!activeResumeId) {
          setJobError("No resume found. Please upload a resume in Profile to view matching jobs.");
          setIsLoadingJobs(false);
          return;
        }

        // Check if onboarding state already contains recent matches
        if (Array.isArray(onboarding?.matches) && onboarding.matches.length > 0) {
          setJobs(onboarding.matches);
          const last = onboarding.matches[onboarding.matches.length - 1];
          const cursor = last?.job_id || last?.id;
          if (cursor) {
            setLastJobId(cursor);
          }
          setIsLoadingJobs(false);
          return;
        }

        // Fetch initial 10 jobs
        const result = await getMoreJobsForResume({
          N: 10,
          LastJDid: "",
          top_k: 1000,
          ResumeID: activeResumeId,
        });

        const matches = Array.isArray(result?.matches) ? result.matches : [];
        if (matches.length === 0) {
          setJobFeedbackMessage("No matching jobs found for your resume.");
          setHasMoreJobs(false);
        } else {
          setJobs(matches);
          const last = matches[matches.length - 1];
          const cursor = last?.job_id || last?.id;
          if (cursor) {
            setLastJobId(cursor);
          }
        }
      } catch (err) {
        console.error("Failed to load initial jobs in BrowseJobs:", err);
        setJobError("Unable to load jobs. Please try again.");
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadInitialJobs();
  }, []);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreJobs) return;
    setIsLoadingMore(true);
    setJobError(null);

    try {
      let activeResumeId = resumeId || (await getPrimaryResumeId());
      if (activeResumeId && !resumeId) {
        setResumeId(activeResumeId);
      }

      if (!activeResumeId) {
        setJobError("No resume found. Please upload a resume to browse jobs.");
        setIsLoadingMore(false);
        return;
      }

      const cursor =
        lastJobId ||
        (jobs.length > 0
          ? jobs[jobs.length - 1]?.job_id || jobs[jobs.length - 1]?.id
          : "");

      const result = await getMoreJobsForResume({
        N: 10,
        LastJDid: cursor || "",
        top_k: 1000,
        ResumeID: activeResumeId,
      });

      const newMatches = Array.isArray(result?.matches) ? result.matches : [];

      if (newMatches.length === 0) {
        setHasMoreJobs(false);
        setJobFeedbackMessage("No more matching jobs found.");
      } else {
        setJobs((prevJobs) => {
          const existingIds = new Set(prevJobs.map((j) => j.job_id || j.id));
          const toAdd = newMatches.filter((m) => {
            const id = m.job_id || m.id;
            return id && !existingIds.has(id);
          });
          return [...prevJobs, ...toAdd];
        });

        const lastItem = newMatches[newMatches.length - 1];
        const newCursor = lastItem?.job_id || lastItem?.id;
        if (newCursor) {
          setLastJobId(newCursor);
        }
      }
    } catch (err) {
      console.error("Load more jobs error:", err);
      setJobError("Unable to load more jobs. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedJobModal(null);
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClear = () => {
    setSearchQuery("");
    setSelectedDate("Last 7 days");
    setSelectedLocations([]);
    setLocationSearch("");
    setSelectedWorkplace([]);
    setSelectedCompanies([]);
    setCompanySearch("");
    setSelectedDegrees([]);
    setSelectedExperience("");
    setSelectedRoles([]);
    setSelectedJobTypes([]);
    setSponsorsVisa(false);
    setSelectedEmploymentTypes([]);
  };

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const toggleCheckbox = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Browse Jobs Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              Browse Jobs
            </h1>
            <p className="text-[13px] text-[#64748B]">
              Your job search is running. We're finding, matching and applying to the best opportunities for you.
            </p>
          </div>

          {/* Search & Filter Container */}
          <div
            ref={dropdownRef}
            className="bg-white rounded-[20px] border border-[#E2E8F0] p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3.5 relative z-10"
          >
            {/* First Row: Search Input + Clear + Apply */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 flex items-center gap-2.5 px-3.5 h-[42px] rounded-[10px] border border-[#E2E8F0] bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
                <svg
                  className="w-4 h-4 text-[#94A3B8] shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or keyword..."
                  className="w-full bg-transparent border-none text-[13.5px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="h-[42px] px-3 flex items-center gap-1 text-[13.5px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <span className="text-base leading-none">✕</span>
                <span>Clear</span>
              </button>

              <button
                type="button"
                className="h-[40px] px-5 text-[13.5px] font-semibold text-[#1E293B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[10px] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
              >
                Apply
              </button>
            </div>

            {/* Second Row: Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5 relative">
              {/* 1. Date Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("date")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "date" || selectedDate !== "All time"
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Date</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "date" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "date" && (
                  <div className="absolute top-full left-0 mt-2 w-[180px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2 z-50 flex flex-col gap-0.5">
                    {dateOptions.map((opt) => {
                      const isSelected = selectedDate === opt;
                      return (
                        <div
                          key={opt}
                          onClick={() => {
                            setSelectedDate(opt);
                            setActiveDropdown(null);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${
                            isSelected
                              ? "font-semibold text-[#0F172A] bg-slate-50"
                              : "text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-[#0F4C3A] bg-[#0F4C3A] text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-2 h-2"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Location Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("location")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "location" || selectedLocations.length > 0
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Location</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "location" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "location" && (
                  <div className="absolute top-full left-0 mt-2 w-[240px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-3 z-50 flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border border-slate-200 bg-white">
                      <svg
                        className="w-3.5 h-3.5 text-slate-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search locations..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="w-full text-[12px] bg-transparent outline-none placeholder:text-slate-400 text-slate-700"
                      />
                    </div>

                    <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
                      {locationOptions
                        .filter((loc) =>
                          loc.toLowerCase().includes(locationSearch.toLowerCase())
                        )
                        .map((loc) => {
                          const isChecked = selectedLocations.includes(loc);
                          return (
                            <div
                              key={loc}
                              onClick={() =>
                                toggleCheckbox(
                                  selectedLocations,
                                  setSelectedLocations,
                                  loc
                                )
                              }
                              className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
                            >
                              <div
                                className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isChecked && (
                                  <svg
                                    className="w-2.5 h-2.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>{loc}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Role Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("role")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "role" || selectedRoles.length > 0
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Role</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "role" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "role" && (
                  <div className="absolute top-full left-0 mt-2 w-[210px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {roleOptions.map((role) => {
                      const isChecked = selectedRoles.includes(role);
                      return (
                        <div
                          key={role}
                          onClick={() =>
                            toggleCheckbox(selectedRoles, setSelectedRoles, role)
                          }
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
                        >
                          <div
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="w-2.5 h-2.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>{role}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Job Type Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("jobType")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "jobType" || selectedJobTypes.length > 0
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Job Type</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "jobType" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "jobType" && (
                  <div className="absolute top-full left-0 mt-2 w-[190px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {jobTypeOptions.map((type) => {
                      const isChecked = selectedJobTypes.includes(type);
                      return (
                        <div
                          key={type}
                          onClick={() =>
                            toggleCheckbox(selectedJobTypes, setSelectedJobTypes, type)
                          }
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
                        >
                          <div
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="w-2.5 h-2.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>{type}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Workplace Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("workplace")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "workplace" || selectedWorkplace.length > 0
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Workplace</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "workplace" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "workplace" && (
                  <div className="absolute top-full left-0 mt-2 w-[180px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {workplaceOptions.map((wp) => {
                      const isChecked = selectedWorkplace.includes(wp);
                      return (
                        <div
                          key={wp}
                          onClick={() =>
                            toggleCheckbox(selectedWorkplace, setSelectedWorkplace, wp)
                          }
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
                        >
                          <div
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="w-2.5 h-2.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>{wp}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 6. Sponsors Visa Button Toggle */}
              <button
                type="button"
                onClick={() => setSponsorsVisa(!sponsorsVisa)}
                className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  sponsorsVisa
                    ? "border-[#0F4C3A] bg-[#0F4C3A] text-white"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                }`}
              >
                <span>Sponsors Visa</span>
              </button>

              {/* 7. Employment Type Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("employmentType")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "employmentType" || selectedEmploymentTypes.length > 0
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Employment Type</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "employmentType" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "employmentType" && (
                  <div className="absolute top-full left-0 mt-2 w-[190px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {["Full-time", "Part-time", "Contract", "Temporary"].map((et) => {
                      const isChecked = selectedEmploymentTypes.includes(et);
                      return (
                        <div
                          key={et}
                          onClick={() =>
                            toggleCheckbox(
                              selectedEmploymentTypes,
                              setSelectedEmploymentTypes,
                              et
                            )
                          }
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
                        >
                          <div
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="w-2.5 h-2.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>{et}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 8. Companies Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("companies")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "companies" || selectedCompanies.length > 0
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Companies</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "companies" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "companies" && (
                  <div className="absolute top-full left-0 mt-2 w-[240px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-3 z-50 flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border border-slate-200 bg-white">
                      <svg
                        className="w-3.5 h-3.5 text-slate-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search companies..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        className="w-full text-[12px] bg-transparent outline-none placeholder:text-slate-400 text-slate-700"
                      />
                    </div>

                    <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
                      {companyOptions
                        .filter((c) =>
                          c.toLowerCase().includes(companySearch.toLowerCase())
                        )
                        .map((comp) => {
                          const isChecked = selectedCompanies.includes(comp);
                          return (
                            <div
                              key={comp}
                              onClick={() =>
                                toggleCheckbox(
                                  selectedCompanies,
                                  setSelectedCompanies,
                                  comp
                                )
                              }
                              className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
                            >
                              <div
                                className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isChecked && (
                                  <svg
                                    className="w-2.5 h-2.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>{comp}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* 9. Degree Level Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("degree")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "degree" || selectedDegrees.length > 0
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Degree Level</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "degree" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "degree" && (
                  <div className="absolute top-full left-0 mt-2 w-[210px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {degreeOptions.map((deg) => {
                      const isChecked = selectedDegrees.includes(deg);
                      return (
                        <div
                          key={deg}
                          onClick={() =>
                            toggleCheckbox(selectedDegrees, setSelectedDegrees, deg)
                          }
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
                        >
                          <div
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="w-2.5 h-2.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>{deg}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 10. Max Experience Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("experience")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "experience" || selectedExperience !== ""
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>Max Experience</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                      activeDropdown === "experience" ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeDropdown === "experience" && (
                  <div className="absolute top-full left-0 mt-2 w-[220px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {experienceOptions.map((exp) => {
                      const isSelected = selectedExperience === exp;
                      return (
                        <div
                          key={exp}
                          onClick={() => {
                            setSelectedExperience(isSelected ? "" : exp);
                            setActiveDropdown(null);
                          }}
                          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${
                            isSelected
                              ? "font-semibold text-[#0F172A] bg-slate-50"
                              : "text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "bg-[#0F4C3A] text-white"
                                : "border border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-2.5 h-2.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>{exp}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {jobError && (
            <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium flex items-center justify-between gap-2 animate-in fade-in">
              <span>{jobError}</span>
              <button
                type="button"
                onClick={() => setJobError(null)}
                className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Feedback Message */}
          {jobFeedbackMessage && (
            <div className="p-3.5 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-700 text-[13px] font-medium flex items-center justify-between gap-2 animate-in fade-in">
              <span>{jobFeedbackMessage}</span>
              <button
                type="button"
                onClick={() => setJobFeedbackMessage(null)}
                className="text-blue-500 hover:text-blue-700 font-bold ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Dynamic Job Cards Grid */}
          {isLoadingJobs ? (
            <div className="p-12 rounded-[20px] bg-white border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 text-center shadow-sm">
              <svg className="w-8 h-8 text-[#4F46E5] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-[14px] font-semibold text-[#0F172A]">Loading matched jobs for your resume...</span>
              <span className="text-[12.5px] text-[#64748B]">Fetching top AI matching opportunities</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 rounded-[20px] bg-white border border-dashed border-[#CBD5E1] flex flex-col items-center justify-center gap-2 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold text-[#0F172A]">No matching jobs found</span>
              <span className="text-[13px] text-[#64748B]">Please upload a resume in Profile or refresh the page.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
                {jobs.map((job, idx) => {
                  const scoreVal = getMatchPercent(job);
                  const matchLabel = getMatchLabel(job);
                  const matchColorClass = getMatchBadgeColor(scoreVal);
                  const matchedSkills = getMatchedSkills(job);
                  const missingRequired = getMissingRequiredSkills(job);
                  const displayTitle = job.title || `Job Match #${idx + 1}`;
                  const displayCompany =
                    job.company ||
                    (job.job_id
                      ? `ID: ${job.job_id.length > 14 ? `${job.job_id.slice(0, 8)}...${job.job_id.slice(-4)}` : job.job_id}`
                      : "Verified Match");

                  return (
                    <div
                      key={job.job_id || job.id || `browse-job-${idx}`}
                      onClick={() => setSelectedJobModal(job)}
                      className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(15,23,42,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-200 min-h-[230px] cursor-pointer group"
                    >
                      <div>
                        {/* Top Header: Logo/Icon + Match Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-[40px] h-[40px] rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2">
                            {job.logo ? (
                              <img
                                src={job.logo}
                                alt={job.company || "Job Logo"}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#4F46E5]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${matchColorClass}`}
                          >
                            {matchLabel}
                          </span>
                        </div>

                        {/* Job Title & Company */}
                        <div className="mt-3.5">
                          <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight leading-snug group-hover:text-[#4F46E5] transition-colors line-clamp-1">
                            {displayTitle}
                          </h3>
                          <div
                            className="flex items-center gap-1 text-[13px] text-[#64748B] font-normal mt-1 truncate"
                            title={job.job_id || job.company}
                          >
                            <span className="truncate">{displayCompany}</span>
                            {job.company && <VerifiedTick />}
                          </div>
                        </div>

                        {/* Skills / Match Highlights or Location */}
                        {matchedSkills.length > 0 ? (
                          <div className="mt-3 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              {matchedSkills.slice(0, 3).map((skill, sIdx) => (
                                <span
                                  key={`${skill}-${sIdx}`}
                                  className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[110px]"
                                >
                                  {skill}
                                </span>
                              ))}
                              {matchedSkills.length > 3 && (
                                <span className="text-[11px] font-medium text-[#64748B] bg-slate-50 px-1.5 py-0.5 rounded-md">
                                  +{matchedSkills.length - 3}
                                </span>
                              )}
                            </div>
                            {missingRequired.length > 0 && (
                              <div className="text-[11.5px] text-[#DC2626] font-medium truncate">
                                Missing: {missingRequired.slice(0, 2).join(", ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Location & Posted Date */
                          <div className="mt-3 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[12.5px] text-[#64748B]">
                              <img
                                src={mapIcon}
                                alt=""
                                className="w-[10px] h-[12px] object-contain shrink-0"
                              />
                              <span>{job.location || "Remote / Various"}</span>
                            </div>
                            <div className="text-[12px] text-[#94A3B8]">
                              {job.posted || "AI Matched"}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2.5 pt-4 mt-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobModal(job);
                          }}
                          className="flex-1 h-[36px] rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#334155] hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobModal(job);
                          }}
                          className="flex-1 h-[36px] rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-[13px] font-medium text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center active:scale-[0.99]"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasMoreJobs ? (
                <div className="flex items-center justify-center pt-2 pb-6">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={handleLoadMore}
                    className="h-[42px] px-6 rounded-[12px] bg-white border border-[#CBD5E1] hover:bg-slate-50 hover:border-slate-400 text-[#0F172A] text-[13.5px] font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-[#4F46E5]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Loading more jobs...</span>
                      </>
                    ) : (
                      <>
                        <span>Load More Jobs</span>
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-[13px] text-[#94A3B8]">
                  You have reached the end of job matches.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Job Details Modal Popup */}
      {selectedJobModal && (() => {
        const modalScore = getMatchPercent(selectedJobModal);
        const modalMatchedSkills = getMatchedSkills(selectedJobModal);
        const modalMissingRequired = getMissingRequiredSkills(selectedJobModal);
        const modalMissingPreferred = getMissingPreferredSkills(selectedJobModal);
        const modalMissingKeywords = getMissingKeywords(selectedJobModal);
        const subScores = selectedJobModal.score_data?.sub_scores;
        const displayTitle = selectedJobModal.title || `Job Match (${selectedJobModal.job_id || selectedJobModal.id})`;
        const displayCompany =
          selectedJobModal.company ||
          (selectedJobModal.job_id ? `Job ID: ${selectedJobModal.job_id}` : "Matched Opportunity");

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 sm:p-6"
            onClick={() => setSelectedJobModal(null)}
          >
            <div
              className="bg-white rounded-[20px] max-w-[540px] w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-[46px] h-[46px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2.5 mt-0.5">
                    {selectedJobModal.logo ? (
                      <img
                        src={selectedJobModal.logo}
                        alt={selectedJobModal.company || "Job Logo"}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#4F46E5]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight leading-tight">
                      {displayTitle}
                    </h2>

                    <div className="flex items-center gap-1.5 text-[14px] text-[#475569] font-medium mt-1">
                      <span className="break-all">{displayCompany}</span>
                      {selectedJobModal.company && <VerifiedTick />}
                    </div>

                    {(selectedJobModal.fullLocation || selectedJobModal.location || selectedJobModal.type || selectedJobModal.workMode) && (
                      <div className="flex items-center gap-2.5 text-[12.5px] text-[#64748B] mt-2 flex-wrap">
                        {selectedJobModal.fullLocation || selectedJobModal.location ? (
                          <span>{selectedJobModal.fullLocation || selectedJobModal.location}</span>
                        ) : null}
                        {selectedJobModal.type && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{selectedJobModal.type}</span>
                          </>
                        )}
                        {selectedJobModal.workMode && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{selectedJobModal.workMode}</span>
                          </>
                        )}
                        {selectedJobModal.department && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{selectedJobModal.department}</span>
                          </>
                        )}
                      </div>
                    )}
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ATS Match Box */}
                <div className="rounded-[16px] border border-slate-200/80 bg-[#F8FAFC]/70 p-4.5 flex items-center gap-4">
                  <div className="relative w-[70px] h-[70px] shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#0D9488]"
                        strokeDasharray={`${modalScore}, 100`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[14px] font-bold text-[#0F172A] leading-none">
                        {Number.isInteger(modalScore) ? modalScore : modalScore.toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-[#64748B] font-medium leading-none mt-0.5">
                        Match
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-[15px] font-bold text-[#0F172A]">ATS Match Score</h3>
                    <p className="text-[12.5px] text-[#64748B] mt-0.5 leading-snug">
                      Calculated by AI based on your profile, skills, experience and preferences.
                    </p>
                  </div>
                </div>

                {/* Sub Scores Breakdown (if provided in score_data) */}
                {subScores && typeof subScores === "object" && Object.keys(subScores).length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A] mb-2.5">Sub Scores Breakdown</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {Object.entries(subScores).map(([key, val]) => (
                        <div key={key} className="p-3 rounded-[12px] bg-slate-50 border border-slate-100 flex flex-col">
                          <span className="text-[11px] font-medium text-[#64748B] capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-[14px] font-bold text-[#0F172A] mt-0.5">
                            {typeof val === "number" ? `${val}%` : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Description (if available) */}
                {selectedJobModal.description && (
                  <div>
                    <h3 className="text-[14.5px] font-bold text-[#0F172A]">Job description</h3>
                    <p className="text-[13px] text-[#475569] leading-relaxed mt-1.5">
                      {selectedJobModal.description}
                    </p>
                  </div>
                )}

                {/* Key Responsibilities (if available) */}
                {Array.isArray(selectedJobModal.responsibilities) && selectedJobModal.responsibilities.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A]">Key responsibilities:</h3>
                    <ul className="space-y-2 mt-2">
                      {selectedJobModal.responsibilities.map((resp, idx) => (
                        <li key={idx} className="text-[13px] text-[#475569] flex items-start gap-2 leading-snug">
                          <span className="text-[#94A3B8] shrink-0">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Matched Skills */}
                {modalMatchedSkills.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[14px] font-bold text-[#0F172A]">Matched Skills</h3>
                      <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full">
                        {modalMatchedSkills.length} matched
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {modalMatchedSkills.map((skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-[8px] px-3 py-1.5 text-[12px] font-medium flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Required Skills */}
                {modalMissingRequired.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[14px] font-bold text-[#0F172A]">Missing Required Skills</h3>
                      <span className="text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full">
                        {modalMissingRequired.length} missing
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {modalMissingRequired.map((skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] rounded-[8px] px-3 py-1.5 text-[12px] font-medium flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Preferred Skills */}
                {modalMissingPreferred.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[14px] font-bold text-[#0F172A]">Missing Preferred Skills</h3>
                      <span className="text-[11px] font-semibold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full">
                        {modalMissingPreferred.length} missing
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {modalMissingPreferred.map((skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Keywords */}
                {modalMissingKeywords.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A] mb-2">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {modalMissingKeywords.map((kw, idx) => (
                        <span
                          key={`${kw}-${idx}`}
                          className="bg-[#F1F5F9] text-[#475569] border border-slate-200 rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Details (if available) */}
                {(selectedJobModal.experience || selectedJobModal.workMode || selectedJobModal.type || selectedJobModal.fullLocation) && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A] mb-2.5">Job details</h3>
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                      {selectedJobModal.experience && (
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-[#64748B]">Experience</span>
                          <span className="font-semibold text-[#0F172A]">{selectedJobModal.experience}</span>
                        </div>
                      )}
                      {selectedJobModal.workMode && (
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-[#64748B]">Work mode</span>
                          <span className="font-semibold text-[#0F172A]">{selectedJobModal.workMode}</span>
                        </div>
                      )}
                      {selectedJobModal.type && (
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-[#64748B]">Employment type</span>
                          <span className="font-semibold text-[#0F172A]">{selectedJobModal.type}</span>
                        </div>
                      )}
                      {(selectedJobModal.fullLocation || selectedJobModal.location) && (
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-[#64748B]">Location</span>
                          <span className="font-semibold text-[#0F172A]">{selectedJobModal.fullLocation || selectedJobModal.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsJobSaved(!isJobSaved)}
                    className={`flex-1 h-[44px] rounded-[12px] border text-[13.5px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isJobSaved
                        ? "border-blue-300 bg-blue-50 text-[#2563EB]"
                        : "border-[#BFDBFE] bg-white text-[#2563EB] hover:bg-blue-50/50"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={isJobSaved ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{isJobSaved ? "Saved" : "Save job"}</span>
                  </button>

                  <button
                    type="button"
                    className="flex-1 h-[44px] rounded-[12px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13.5px] font-medium flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Apply now</span>
                    <span>→</span>
                  </button>
                </div>

                <p className="text-[11.5px] text-[#94A3B8] text-center">
                  Your application quota will be reserved before submission.
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default BrowseJobs;
