import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import EnhancedResumeViewer from "../components/EnhancedResumeViewer";
import {
  getJobs,
  getPrimaryResumeId,
  getOnboardingState,
  getStoredResumeId,
  getStoredJobMatches,
  getEnhancedResume,
  downloadEnhancedResume,
  getJobId,
  getJobById,
  getScoreForEnhancedResume,
  checkUserHasResume,
} from "../services/api";
import {
  getResumes,
  setPrimaryResume,
  refreshResumeMatches,
} from "../services/resumeService";

import aiLogo from "../assets/ai.svg";
import mapIcon from "../assets/map.svg";
import tickIcon from "../assets/tick.svg";

// Verified tick icon
const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-3.5 h-3.5 object-contain inline-block shrink-0"
  />
);

// Standard filter static options
const dateOptions = [
  "Last 6 hours",
  "Last 24 hours",
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
  "All time",
];

const workplaceOptions = ["Remote", "On-site", "Hybrid"];

const experienceOptions = [
  "Entry Level (0-1 yrs)",
  "Junior (1-3 yrs)",
  "Mid-Level (3-5 yrs)",
  "Senior (5-8 yrs)",
  "Lead / Principal (8+ yrs)",
];

const jobTypeOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

const cleanHtmlText = (text) => {
  if (!text) return "";
  let cleaned = String(text);
  cleaned = cleaned.replace(/<[^>]*>/g, " ");
  cleaned = cleaned.replace(/&nbsp;/gi, " ");
  cleaned = cleaned.replace(/&amp;/gi, "&");
  cleaned = cleaned.replace(/&lt;/gi, "<");
  cleaned = cleaned.replace(/&gt;/gi, ">");
  cleaned = cleaned.replace(/&quot;/gi, '"');
  cleaned = cleaned.replace(/&#39;/gi, "'");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
};

const formatPostedDate = (postedAt) => {
  if (!postedAt) return "Recent match";
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

const extractCleanJobTitle = (rawTitle, rawText, index = 0) => {
  let title = cleanHtmlText(rawTitle || "");
  const text = cleanHtmlText(rawText || "");

  if (
    title &&
    title.length <= 90 &&
    !title.toLowerCase().startsWith("the ") &&
    !title.toLowerCase().includes("is looking for") &&
    !title.toLowerCase().includes("we are looking") &&
    !title.toLowerCase().includes("team is seeking")
  ) {
    return title.split("\n")[0].trim();
  }

  if (title && title.length <= 160) {
    const firstTitleLine = title.split("\n")[0].trim();
    if (firstTitleLine) return firstTitleLine;
  }

  const candidateText = title || text;
  if (candidateText) {
    const lookingMatch = candidateText.match(
      /(?:is\s+looking\s+for\s+(?:a|an)?|we\s+are\s+looking\s+for\s+(?:a|an)?|seeking\s+(?:a|an)?|hiring\s+(?:a|an)?)\s+([A-Z][A-Za-z0-9\s\-/+(),&]+?)(?:\s+to|\s+who|\s+in|\s+at|\s+with|[.,;\n\r]|$)/i
    );
    if (
      lookingMatch &&
      lookingMatch[1] &&
      lookingMatch[1].trim().length >= 3 &&
      lookingMatch[1].trim().length <= 60
    ) {
      return lookingMatch[1].trim();
    }

    const explicitMatch = candidateText.match(
      /(?:job\s+title|title|role|position)\s*[:-]\s*([^\n\r,;.]+)/i
    );
    if (
      explicitMatch &&
      explicitMatch[1] &&
      explicitMatch[1].trim().length >= 3 &&
      explicitMatch[1].trim().length <= 60
    ) {
      return explicitMatch[1].trim();
    }

    const knownRolePatterns = [
      /\b(Front[ -]?End\s+Engineer(?:\s+[I|V|X\d]+)?(?:\s*\([A-Z0-9]+\))?)\b/i,
      /\b(Back[ -]?End\s+Engineer(?:\s+[I|V|X\d]+)?(?:\s*\([A-Z0-9]+\))?)\b/i,
      /\b(Full[ -]?Stack\s+Engineer(?:\s+[I|V|X\d]+)?(?:\s*\([A-Z0-9]+\))?)\b/i,
      /\b(Software\s+Development\s+Engineer(?:\s+[I|V|X\d]+)?(?:\s*\([A-Z0-9]+\))?)\b/i,
      /\b(Software\s+Engineer(?:\s+[I|V|X\d]+)?(?:\s*\([A-Z0-9]+\))?)\b/i,
      /\b(UI\/UX\s+Designer(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(Product\s+Designer(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(Product\s+Manager(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(Data\s+Scientist(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(Machine\s+Learning\s+Engineer(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(DevOps\s+Engineer(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(Cloud\s+Architect(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(Site\s+Reliability\s+Engineer(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(QA\s+Engineer(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(Mobile\s+Developer(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(iOS\s+Developer(?:\s+[I|V|X\d]+)?)\b/i,
      /\b(Android\s+Developer(?:\s+[I|V|X\d]+)?)\b/i,
    ];

    for (const pattern of knownRolePatterns) {
      const match = candidateText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const firstLine = candidateText.split("\n")[0].replace(/^#+\s*/, "").trim();
    if (
      firstLine &&
      firstLine.length <= 50 &&
      !firstLine.toLowerCase().includes("http")
    ) {
      return firstLine;
    }
  }

  return `Position #${index + 1}`;
};

const extractCleanCompany = (rawCompany, rawText) => {
  let company = cleanHtmlText(rawCompany || "");
  const text = cleanHtmlText(rawText || "");

  if (
    company &&
    company.length <= 40 &&
    !company.toLowerCase().includes("hiring") &&
    !company.includes("\n")
  ) {
    return company;
  }

  const candidateText = company || text;
  if (candidateText) {
    const textLower = candidateText.toLowerCase();
    if (textLower.includes("amazon") || textLower.includes("luna")) return "Amazon";
    if (textLower.includes("google")) return "Google";
    if (textLower.includes("microsoft")) return "Microsoft";
    if (textLower.includes("atlassian")) return "Atlassian";
    if (textLower.includes("shopify")) return "Shopify";
    if (textLower.includes("meta") || textLower.includes("facebook")) return "Meta";
    if (textLower.includes("apple")) return "Apple";
    if (textLower.includes("netflix")) return "Netflix";

    const compMatch = candidateText.match(
      /(?:company|organization|employer|at)\s*[:-]\s*([A-Za-z0-9\s&.,'-]+)/i
    );
    if (compMatch && compMatch[1] && compMatch[1].trim().length <= 35) {
      return compMatch[1].trim();
    }
  }

  return company || "Hiring Organization";
};

const transformMatchToJob = (match, index = 0) => {
  if (!match) return null;

  const rawText = match.full_jd_text || match.description || match.preview || "";
  const cleanedFullText = cleanHtmlText(rawText);

  // Field 'title' from GET /api/jobs or 'preview' from legacy matching API
  const rawTitle = match.title || match.preview || match.job_title || match.role || "";
  const title = extractCleanJobTitle(rawTitle, rawText, index);

  const rawCompany = match.companyName || match.company || match.company_name || "";
  const company = extractCleanCompany(rawCompany, rawText);
  const companyDomain = match.companyDomain || match.domain || "";

  const rawScore =
    match.matchScore !== undefined && match.matchScore !== null
      ? match.matchScore
      : typeof match.overall_score === "number"
        ? match.overall_score
        : typeof match.score_data?.overall_score === "number"
          ? match.score_data.overall_score
          : typeof match.score === "number"
            ? match.score
            : typeof match.overall_score === "string" &&
              !isNaN(Number(match.overall_score)) &&
              match.overall_score.trim() !== ""
              ? Number(match.overall_score)
              : null;

  const matchPercent =
    rawScore !== null && !isNaN(rawScore)
      ? Math.min(100, Math.max(1, Math.round(Number(rawScore))))
      : null;

  let logo = match.logo || match.companyLogo || match.logo_url || null;
  if (
    typeof logo === "string" &&
    (logo.includes("amazon") ||
      logo.includes("ai.svg") ||
      logo.includes("google.svg") ||
      logo.includes("microsoft.svg") ||
      logo.includes("shopify.svg"))
  ) {
    logo = null;
  }

  // Location & Country
  let location = cleanHtmlText(match.location || match.city || "");
  const country = cleanHtmlText(match.country || "");
  if (!location && cleanedFullText) {
    const locMatch = cleanedFullText.match(
      /(?:location|place|city)\s*[:-]\s*([^\n\r]+)/i
    );
    if (locMatch && locMatch[1] && locMatch[1].trim().length <= 40) {
      location = locMatch[1].trim();
    }
  }
  const fullLocation = [location, country].filter(Boolean).join(", ");

  // Workplace & Employment Type normalization for backend responses
  const rawWorkplace = match.workplace || match.workMode || match.work_mode || "";
  let workplace = "";
  if (rawWorkplace) {
    const rawWp = String(rawWorkplace).toUpperCase();
    if (rawWp.includes("REMOTE")) workplace = "Remote";
    else if (rawWp.includes("ONSITE") || rawWp.includes("ON_SITE") || rawWp.includes("OFFICE")) workplace = "On-site";
    else if (rawWp.includes("HYBRID")) workplace = "Hybrid";
    else workplace = cleanHtmlText(rawWorkplace);
  } else if (location.toLowerCase().includes("remote")) {
    workplace = "Remote";
  } else {
    workplace = "On-site";
  }

  const rawEmploymentType = match.employmentType || match.type || match.employment_type || "";
  let employmentType = "";
  if (rawEmploymentType) {
    const rawEmp = String(rawEmploymentType).toUpperCase().replace(/_/g, "-");
    if (rawEmp.includes("FULL")) employmentType = "Full-time";
    else if (rawEmp.includes("PART")) employmentType = "Part-time";
    else if (rawEmp.includes("CONTRACT")) employmentType = "Contract";
    else if (rawEmp.includes("INTERN")) employmentType = "Internship";
    else if (rawEmp.includes("FREELANCE")) employmentType = "Freelance";
    else employmentType = cleanHtmlText(rawEmploymentType);
  } else {
    employmentType = "Full-time";
  }

  // Posted At
  const posted = match.postedAt ? formatPostedDate(match.postedAt) : cleanHtmlText(match.posted || "");

  const requiredSkills =
    Array.isArray(match.requiredSkills) && match.requiredSkills.length > 0
      ? match.requiredSkills.map(cleanHtmlText)
      : Array.isArray(match.skills) && match.skills.length > 0
        ? match.skills.map(cleanHtmlText)
        : Array.isArray(match.extracted_skills) && match.extracted_skills.length > 0
          ? match.extracted_skills.map(cleanHtmlText)
          : [];

  const preferredSkills =
    Array.isArray(match.preferredSkills) && match.preferredSkills.length > 0
      ? match.preferredSkills.map(cleanHtmlText)
      : [];

  const displayScore = rawScore !== null && !Number.isInteger(rawScore) ? Number(rawScore).toFixed(1) : matchPercent;
  let matchText = matchPercent !== null ? `${displayScore}% match` : "ATS Match";
  let matchColor = "bg-[#EEF2FF] text-[#4F46E5]";
  if (matchPercent !== null) {
    if (matchPercent < 70) {
      matchColor = "bg-slate-100 text-slate-700";
    } else if (matchPercent < 85) {
      matchColor = "bg-[#FFFBEB] text-[#D97706]";
    } else {
      matchColor = "bg-[#ECFDF5] text-[#059669]";
    }
  }

  let description = cleanHtmlText(
    match.description ||
    match.preview ||
    (match.full_jd_text ? match.full_jd_text.slice(0, 400) + "..." : "")
  );

  let responsibilities = [];
  if (Array.isArray(match.responsibilities) && match.responsibilities.length > 0) {
    responsibilities = match.responsibilities.map(cleanHtmlText).filter(Boolean);
  } else if (cleanedFullText) {
    const lines = cleanedFullText
      .split("\n")
      .map((l) => l.trim())
      .filter(
        (l) =>
          l.startsWith("•") ||
          l.startsWith("-") ||
          l.startsWith("*") ||
          (l.length > 25 && l.length < 200)
      );
    if (lines.length > 0) {
      responsibilities = lines.slice(0, 6).map((l) => l.replace(/^[•\-*]\s*/, ""));
    }
  }

  const id = match.jobId || match.job_id || match.id || match.JDid || match.jd_id || `job-${index + 1}`;

  return {
    id,
    jobId: id,
    job_id: id,
    JDid: id,
    title,
    company,
    companyDomain,
    location,
    country,
    fullLocation: cleanHtmlText(match.fullLocation || fullLocation),
    type: employmentType,
    employmentType,
    workMode: workplace,
    workplace,
    department: cleanHtmlText(match.department || ""),
    posted,
    postedAt: match.postedAt || null,
    match: matchText,
    matchPercent,
    displayScore,
    rawScore,
    matchScore: rawScore,
    matchColor,
    logo: match.logo || logo,
    description,
    responsibilities,
    requiredSkills,
    preferredSkills,
    experience: cleanHtmlText(match.experience || ""),
    scoreData: match.score_data || null,
    fullJdText: cleanedFullText,
    rawMatch: match,
  };
};

const BrowseJobs = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [isJobSaved, setIsJobSaved] = useState(false);

  // Helper to open job modal and fetch full job details from GET /api/jobs/{originalJobId}
  const handleOpenJobModal = async (job) => {
    if (!job) return;
    setSelectedJobModal(job);

    const originalJobId = getJobId(job);
    console.log("[BrowseJobs] Opening job modal. Original Job ID:", originalJobId);

    if (originalJobId) {
      try {
        setIsLoadingJobDetails(true);
        console.log(`[BrowseJobs] Fetching job details from GET /api/jobs/${originalJobId}...`);
        const details = await getJobById(originalJobId);
        console.log(`[BrowseJobs] GET /api/jobs/${originalJobId} details response:`, details);

        if (details && typeof details === "object") {
          setSelectedJobModal((prevModal) => {
            if (!prevModal) return prevModal;
            const currentModalId = getJobId(prevModal);
            if (currentModalId === originalJobId) {
              return {
                ...prevModal,
                ...details,
                title: details.title || details.jobTitle || prevModal.title,
                company: details.companyName || details.company || prevModal.company,
                companyDomain: details.companyDomain || prevModal.companyDomain,
                location: details.location || prevModal.location,
                fullLocation: details.location || details.fullLocation || prevModal.fullLocation,
                description: details.description || details.jobDescription || prevModal.description,
                preview: details.preview || details.description || details.jobDescription || prevModal.preview,
                responsibilities: Array.isArray(details.responsibilities) && details.responsibilities.length > 0
                  ? details.responsibilities
                  : prevModal.responsibilities,
                requiredSkills: Array.isArray(details.requiredSkills) && details.requiredSkills.length > 0
                  ? details.requiredSkills
                  : (Array.isArray(details.skills) ? details.skills : prevModal.requiredSkills),
                preferredSkills: Array.isArray(details.preferredSkills) && details.preferredSkills.length > 0
                  ? details.preferredSkills
                  : prevModal.preferredSkills,
                experience: details.experience || details.requiredExperience || prevModal.experience,
                workMode: details.workplace || details.workMode || prevModal.workMode,
                type: details.employmentType || details.type || prevModal.type,
                salary: details.salary || details.salaryRange || prevModal.salary,
                applyUrl: details.applyUrl || details.jobUrl || details.url || prevModal.applyUrl,
              };
            }
            return prevModal;
          });
        }
      } catch (err) {
        console.warn(`[BrowseJobs] GET /api/jobs/${originalJobId} fetch warning:`, err?.message);
      } finally {
        setIsLoadingJobDetails(false);
      }
    }
  };

  // Dynamic Jobs State with Page-based Cache { [pageNumber]: [jobs] }
  const [jobsCache, setJobsCache] = useState({});
  const jobsCacheRef = useRef({});
  const [activePage, setActivePage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState("best_match"); // 'best_match' or 'newest'

  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [hasResume, setHasResume] = useState(false);
  const [activeResumeId, setActiveResumeId] = useState(() => {
    try {
      return (
        localStorage.getItem("selected_resume_id") ||
        localStorage.getItem("resume_id") ||
        localStorage.getItem("resumeId") ||
        sessionStorage.getItem("selected_resume_id") ||
        sessionStorage.getItem("resume_id") ||
        sessionStorage.getItem("resumeId") ||
        null
      );
    } catch {
      return null;
    }
  });
  const fetchingPagesRef = useRef(new Set());
  const resumeDropdownRef = useRef(null);

  // Resume Selector States & Logic
  const [userResumes, setUserResumes] = useState([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [selectedResume, setSelectedResume] = useState(() => {
    try {
      const storedData =
        localStorage.getItem("selected_resume_data") ||
        sessionStorage.getItem("selected_resume_data");
      return storedData ? JSON.parse(storedData) : null;
    } catch {
      return null;
    }
  });
  const [isResumeDropdownOpen, setIsResumeDropdownOpen] = useState(false);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);

  const selectedResumeRef = useRef(selectedResume);
  selectedResumeRef.current = selectedResume;
  const activeResumeIdRef = useRef(activeResumeId);
  activeResumeIdRef.current = activeResumeId;
  // Dynamic ATS Resume Matches Status & Refresh
  const [matchStatus, setMatchStatus] = useState({
    hasPrimaryResume: null,
    refreshing: false,
    matchCount: 0,
    lastComputedAt: null,
    progress: null,
    lastResult: null,
  });
  const [isLoadingMatchStatus, setIsLoadingMatchStatus] = useState(true);
  const [isRequestingRefresh, setIsRequestingRefresh] = useState(false);
  const [refreshSuccessMessage, setRefreshSuccessMessage] = useState(null);
  const prevRefreshingRef = useRef(false);
  const pollingTimeoutRef = useRef(null);
  const hasAutoRefreshedRef = useRef(false);

  // Enhance Resume States
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [enhanceError, setEnhanceError] = useState(null);
  const [enhanceSuccess, setEnhanceSuccess] = useState(null);
  const [enhancedResultsMap, setEnhancedResultsMap] = useState({});
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);
  const [isUpdatingAts, setIsUpdatingAts] = useState(false);
  const [updatedAtsScores, setUpdatedAtsScores] = useState({});

  // Filter States
  const [selectedDate, setSelectedDate] = useState("All time");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedWorkplace, setSelectedWorkplace] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [sponsorsVisa, setSponsorsVisa] = useState(false);

  const dropdownRef = useRef(null);

  /**
   * Main function to load jobs for a specific page with Page-based Cache.
   * If the page is already cached (and not forcing refresh), returns cached data without API call.
   */
  const loadPage = useCallback(
    async (pageNumber, { forceRefresh = false, customQuery = null, customSort = null, overrideFilters = null, customResumeId = null } = {}) => {
      // 1. Check cache first (unless forceRefresh is requested)
      if (!forceRefresh && jobsCacheRef.current[pageNumber] && jobsCacheRef.current[pageNumber].length > 0) {
        console.log(`[BrowseJobs] Page ${pageNumber} found in cache. Using cached data (NO API CALL).`);
        setActivePage(pageNumber);
        return jobsCacheRef.current[pageNumber];
      }

      // 2. Prevent duplicate concurrent requests for the same page
      if (fetchingPagesRef.current.has(pageNumber)) {
        console.log(`[BrowseJobs] Request for page ${pageNumber} is already in flight. Skipping duplicate call.`);
        return;
      }

      fetchingPagesRef.current.add(pageNumber);
      if (pageNumber === 1 && (forceRefresh || Object.keys(jobsCacheRef.current).length === 0)) {
        setIsLoadingJobs(true);
      } else {
        setIsLoadingPage(true);
      }
      setLoadMoreError(null);
      setFetchError(null);

      // Extract target resumeId for GET /api/jobs?resumeId=...
      let resumeIdVal = customResumeId;
      if (resumeIdVal === null || resumeIdVal === undefined) {
        const curResume = selectedResumeRef.current;
        resumeIdVal = curResume
          ? (curResume.id ?? curResume.resumeId ?? curResume._id ?? curResume.fileId ?? curResume.uuid ?? curResume.resume_id)
          : activeResumeIdRef.current;
      }
      if (!resumeIdVal) {
        resumeIdVal =
          localStorage.getItem("selected_resume_id") ||
          localStorage.getItem("resume_id") ||
          localStorage.getItem("resumeId") ||
          sessionStorage.getItem("selected_resume_id") ||
          sessionStorage.getItem("resume_id") ||
          sessionStorage.getItem("resumeId");
      }
      if (!resumeIdVal) {
        try {
          resumeIdVal = await getPrimaryResumeId();
        } catch {
          // fallback
        }
      }
      const onboardingState = getOnboardingState();
      if (!resumeIdVal && onboardingState?.resumeId) {
        resumeIdVal = String(onboardingState.resumeId);
      }
      if (!resumeIdVal) {
        resumeIdVal = getStoredResumeId();
      }
      const userHasResume =
        Boolean(resumeIdVal) || (await checkUserHasResume().catch(() => false));
      setHasResume(userHasResume);
      if (resumeIdVal) {
        setActiveResumeId(String(resumeIdVal));
      }

      try {
        const q = customQuery !== null ? customQuery : searchQuery;
        const sort = customSort !== null ? customSort : sortOption;

        const activeLocs = overrideFilters?.locations ?? selectedLocations;
        const activeRoles = overrideFilters?.roles ?? selectedRoles;
        const activeWorkplaces = overrideFilters?.workplace ?? selectedWorkplace;
        const activeJobTypes = overrideFilters?.jobTypes ?? selectedJobTypes;
        const activeDate = overrideFilters?.date ?? selectedDate;

        let postedWithinDays = undefined;
        if (activeDate === "Last 6 hours" || activeDate === "Last 24 hours") {
          postedWithinDays = 1;
        } else if (activeDate === "Last 7 days") {
          postedWithinDays = 7;
        } else if (activeDate === "Last 14 days") {
          postedWithinDays = 14;
        } else if (activeDate === "Last 30 days") {
          postedWithinDays = 30;
        }

        const apiPage = Math.max(0, pageNumber - 1); // 0-indexed for GET /api/jobs

        const params = {
          resumeId: resumeIdVal || undefined,
          q: q ? q.trim() : undefined,
          location: activeLocs.length > 0 ? activeLocs[0] : undefined,
          role: activeRoles.length > 0 ? activeRoles[0] : undefined,
          workplace: activeWorkplaces.length > 0 ? activeWorkplaces[0].toLowerCase() : undefined,
          employmentType: activeJobTypes.length > 0 ? activeJobTypes[0].toLowerCase() : undefined,
          postedWithinDays,
          sort: sort || "best_match",
          page: apiPage,
          size: pageSize || 20,
        };

        console.log(`[BrowseJobs] Fetching Page ${pageNumber} (apiPage ${apiPage}) via GET /api/jobs with params:`, params);
        const res = await getJobs(params);

        const items = res?.items || [];
        const transformed = items.map((m, idx) => transformMatchToJob(m, apiPage * pageSize + idx)).filter(Boolean);

        const resTotalItems =
          typeof res?.totalItems === "number" && res.totalItems >= 0
            ? res.totalItems
            : (items.length >= pageSize ? (apiPage + 2) * pageSize : (apiPage * pageSize + items.length));

        const resTotalPages =
          typeof res?.totalPages === "number" && res.totalPages > 0
            ? res.totalPages
            : Math.max(1, Math.ceil(resTotalItems / (pageSize || 20)));

        const hasMore = (apiPage + 1) < resTotalPages && items.length >= pageSize;
        setHasMoreJobs(hasMore);
        setTotalItems(resTotalItems);
        setTotalPages(resTotalPages);

        if (transformed.length === 0) {
          if (pageNumber === 1 && (forceRefresh || Object.keys(jobsCacheRef.current).length === 0)) {
            const stored = getStoredJobMatches();
            if (Array.isArray(stored) && stored.length > 0) {
              const fallback = stored.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
              if (fallback.length > pageSize) {
                const chunked = {};
                const chunkPages = Math.ceil(fallback.length / pageSize);
                for (let p = 1; p <= chunkPages; p++) {
                  chunked[p] = fallback.slice((p - 1) * pageSize, p * pageSize);
                }
                jobsCacheRef.current = chunked;
                setJobsCache(chunked);
                setTotalPages(chunkPages);
              } else {
                jobsCacheRef.current[1] = fallback;
                setJobsCache({ 1: fallback });
                setTotalPages(1);
              }
              setActivePage(1);
              setTotalItems(fallback.length);
              setHasMoreJobs(false);
              return fallback;
            }
          } else if (pageNumber > 1) {
            // Server has no more jobs for this page; stay on current page and mark no more jobs
            setHasMoreJobs(false);
            setTotalPages((prev) => Math.min(prev, pageNumber - 1));
            return [];
          }
        }

        // If page 1 returned all jobs in one response (> pageSize), chunk into pages
        if (pageNumber === 1 && transformed.length > pageSize) {
          const chunked = {};
          const chunkPages = Math.ceil(transformed.length / pageSize);
          for (let p = 1; p <= chunkPages; p++) {
            chunked[p] = transformed.slice((p - 1) * pageSize, p * pageSize);
          }
          jobsCacheRef.current = chunked;
          setJobsCache(chunked);
          setActivePage(1);
          setTotalItems(transformed.length);
          setTotalPages(chunkPages);
          setHasMoreJobs(false);
          return transformed;
        }

        // Cache page data
        jobsCacheRef.current[pageNumber] = transformed;
        setJobsCache((prev) => ({
          ...(forceRefresh ? {} : prev),
          [pageNumber]: transformed,
        }));
        setActivePage(pageNumber);

        return transformed;
      } catch (err) {
        console.error(`[BrowseJobs] Error fetching Page ${pageNumber} from GET /api/jobs:`, err);
        const msg = err?.response?.data?.message || err?.message || "Unable to load jobs. Please try again.";
        setFetchError(msg);
        setLoadMoreError(msg);

        if (pageNumber === 1 && Object.keys(jobsCacheRef.current).length === 0) {
          const stored = getStoredJobMatches();
          if (Array.isArray(stored) && stored.length > 0) {
            const fallback = stored.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
            if (fallback.length > pageSize) {
              const chunked = {};
              const chunkPages = Math.ceil(fallback.length / pageSize);
              for (let p = 1; p <= chunkPages; p++) {
                chunked[p] = fallback.slice((p - 1) * pageSize, p * pageSize);
              }
              jobsCacheRef.current = chunked;
              setJobsCache(chunked);
              setTotalPages(chunkPages);
            } else {
              jobsCacheRef.current[1] = fallback;
              setJobsCache({ 1: fallback });
              setTotalPages(1);
            }
            setActivePage(1);
            setTotalItems(fallback.length);
            setHasMoreJobs(false);
          }
        } else if (pageNumber > 1) {
          setHasMoreJobs(false);
        }
      } finally {
        fetchingPagesRef.current.delete(pageNumber);
        setIsLoadingJobs(false);
        setIsLoadingPage(false);
      }
    },
    [
      searchQuery,
      sortOption,
      selectedLocations,
      selectedRoles,
      selectedWorkplace,
      selectedJobTypes,
      selectedDate,
      pageSize,
    ]
  );

  const loadPageRef = useRef(loadPage);
  useEffect(() => {
    loadPageRef.current = loadPage;
  }, [loadPage]);

  // Helper to persist selected resume ID and resume object across refreshes
  const saveResumeSelection = (resume, resumeId) => {
    if (!resumeId) return;
    const strId = String(resumeId);
    try {
      localStorage.setItem("selected_resume_id", strId);
      localStorage.setItem("resume_id", strId);
      localStorage.setItem("resumeId", strId);
      sessionStorage.setItem("selected_resume_id", strId);
      sessionStorage.setItem("resume_id", strId);
      sessionStorage.setItem("resumeId", strId);
      if (resume) {
        localStorage.setItem("selected_resume_data", JSON.stringify(resume));
        sessionStorage.setItem("selected_resume_data", JSON.stringify(resume));
      }
    } catch (e) {
      console.error("[BrowseJobs] Error saving resume selection to storage:", e);
    }
  };

  // Fetch user resumes from GET /api/resumes
  const fetchUserResumes = useCallback(async () => {
    try {
      setIsLoadingResumes(true);
      const data = await getResumes();
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.resumes)) {
        list = data.resumes;
      } else if (data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data && (data.id !== undefined || data.fileName || data.name)) {
        list = [data];
      }

      setUserResumes(list);
      let targetResume = null;
      let targetResumeId = null;

      // Retrieve stored resume ID & data from localStorage / sessionStorage if user previously selected one
      const storedResumeId =
        localStorage.getItem("selected_resume_id") ||
        localStorage.getItem("resume_id") ||
        localStorage.getItem("resumeId") ||
        sessionStorage.getItem("selected_resume_id") ||
        sessionStorage.getItem("resume_id") ||
        sessionStorage.getItem("resumeId");

      let storedResumeData = null;
      try {
        const rawData =
          localStorage.getItem("selected_resume_data") ||
          sessionStorage.getItem("selected_resume_data");
        if (rawData) storedResumeData = JSON.parse(rawData);
      } catch {
        // ignore parse error
      }

      if (list.length > 0) {
        setHasResume(true);

        // 1. Try matching by ID
        if (storedResumeId) {
          targetResume = list.find((r) => {
            const id = r.id ?? r.resumeId ?? r._id ?? r.fileId ?? r.uuid ?? r.resume_id;
            return String(id) === String(storedResumeId);
          });
        }

        // 2. Try matching by stored resume file name if ID match fails
        if (!targetResume && storedResumeData) {
          const storedName = storedResumeData.fileName || storedResumeData.name || storedResumeData.originalName;
          if (storedName) {
            targetResume = list.find((r) => {
              const rName = r.fileName || r.name || r.originalName;
              return rName && rName === storedName;
            });
          }
        }

        // 3. Fallback to primary resume or first resume in list
        if (!targetResume) {
          targetResume = list.find((r) => r.isPrimary === true) || list[0];
        }

        setSelectedResume(targetResume);
        targetResumeId = targetResume?.id ?? targetResume?.resumeId ?? targetResume?._id ?? targetResume?.fileId ?? targetResume?.uuid ?? targetResume?.resume_id;

        if (targetResumeId !== undefined && targetResumeId !== null) {
          const strId = String(targetResumeId);
          setActiveResumeId(strId);
          saveResumeSelection(targetResume, strId);
        }
      }
      jobsCacheRef.current = {};
      setJobsCache({});
      if (loadPageRef.current) {
        loadPageRef.current(1, { forceRefresh: true, customResumeId: targetResumeId });
      }
    } catch (err) {
      console.error("[BrowseJobs] Error fetching resumes list:", err);
      jobsCacheRef.current = {};
      setJobsCache({});
      if (loadPageRef.current) {
        loadPageRef.current(1, { forceRefresh: true });
      }
    } finally {
      setIsLoadingResumes(false);
    }
  }, []);

  // Handle selecting a resume from the dropdown (fetches GET /api/jobs?resumeId=...)
  const handleSelectResume = (resume) => {
    if (!resume) return;
    setSelectedResume(resume);
    setIsResumeDropdownOpen(false);
    const resumeId = resume.id ?? resume.resumeId ?? resume._id ?? resume.fileId ?? resume.uuid ?? resume.resume_id;

    if (resumeId !== undefined && resumeId !== null) {
      const strId = String(resumeId);
      setActiveResumeId(strId);
      saveResumeSelection(resume, strId);
      jobsCacheRef.current = {};
      setJobsCache({});
      loadPage(1, { forceRefresh: true, customResumeId: resumeId });
    }
  };

  // Trigger initial Page 1 fetch immediately when component mounts
  useEffect(() => {
    let isMounted = true;
    fetchUserResumes();

    const handleJobMatchesUpdated = () => {
      if (isMounted && loadPageRef.current) {
        jobsCacheRef.current = {};
        setJobsCache({});
        loadPageRef.current(1, { forceRefresh: true });
      }
    };

    window.addEventListener("jobMatchesUpdated", handleJobMatchesUpdated);
    window.addEventListener("storage", handleJobMatchesUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener("jobMatchesUpdated", handleJobMatchesUpdated);
      window.removeEventListener("storage", handleJobMatchesUpdated);
    };
  }, [fetchUserResumes]);

  // Click outside listener to close resume dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resumeDropdownRef.current &&
        !resumeDropdownRef.current.contains(event.target)
      ) {
        setIsResumeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Enhance Resume Action Handler (POST /api/jobs/{jobId}/enhance -> GET /api/jobs/{jobId}/enhance)
  const handleEnhanceResume = async () => {
    if (isEnhancing || !selectedJobModal) return;
    setEnhanceError(null);
    setEnhanceSuccess(null);

    const selectedJobId = getJobId(selectedJobModal);

    console.log("[BrowseJobs] Triggering Enhance Resume for Job ID:", selectedJobId);

    if (!selectedJobId) {
      setEnhanceError("Job ID is missing. Please select a valid job to enhance.");
      return;
    }

    try {
      setIsEnhancing(true);

      const result = await getEnhancedResume(selectedJobId);
      console.log("[BrowseJobs] Enhance Resume API Result:", result);

      if (result?.status === "NO_BRIDGEABLE_GAPS") {
        setEnhanceSuccess(
          result?.message || "No bridgeable skill gaps identified for this role."
        );
      } else if (result?.status === "NOT_NEEDED") {
        setEnhanceSuccess(
          result?.message || "Resume enhancement is not needed for this role."
        );
      } else {
        setEnhancedResultsMap((prev) => ({
          ...prev,
          [selectedJobId]: result,
        }));
        setEnhanceSuccess(
          result?.message || "Resume successfully enhanced for this role!"
        );
      }
    } catch (err) {
      console.error("[BrowseJobs] Enhance Resume Error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to enhance resume. Please try again.";
      setEnhanceError(errMsg);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopyEnhancedResume = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2500);
  };

  const handleDownloadEnhancedResume = async (text, job) => {
    const targetJob = job || selectedJobModal;
    const jobId = getJobId(targetJob);
    const jobTitle = (targetJob?.title || "Enhanced_Resume").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fallbackFilename = `${jobTitle}_Resume.docx`;

    if (jobId) {
      try {
        setIsDownloadingResume(true);
        await downloadEnhancedResume(jobId, fallbackFilename);
        setIsDownloadingResume(false);
        return;
      } catch (err) {
        console.warn("[BrowseJobs] API download enhanced resume failed, fallback to text blob:", err);
        setIsDownloadingResume(false);
      }
    }

    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${jobTitle}_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get Updated ATS Action Handler (POST /api/v1/Get_Score_for_EnhancedResume)
  const handleGetUpdatedAts = async () => {
    if (!selectedJobModal || isUpdatingAts) return;
    const jobId = getJobId(selectedJobModal);
    const resumeId = getStoredResumeId();
    const enhResult = enhancedResultsMap[jobId];
    const enhResumeText =
      enhResult?.EnhResume ||
      enhResult?.enhResume ||
      enhResult?.enhanced_resume ||
      enhResult?.enhancedResume ||
      "";

    if (!jobId || !resumeId || !enhResumeText) {
      setEnhanceError(
        "Missing job details, resume ID, or enhanced resume text to calculate updated ATS score."
      );
      return;
    }

    try {
      setIsUpdatingAts(true);
      setEnhanceError(null);

      const payload = {
        JDid: jobId,
        ResumeID: resumeId,
        EnhResumeText: enhResumeText,
      };

      console.log("[BrowseJobs] Requesting updated ATS score with payload:", payload);
      const response = await getScoreForEnhancedResume(payload);
      console.log("[BrowseJobs] Updated ATS API response:", response);

      const rawScore =
        response?.EnhATS ??
        response?.score_data?.overall_score ??
        response?.score;
      if (rawScore !== undefined && rawScore !== null && !isNaN(Number(rawScore))) {
        const parsedScore = Math.min(100, Math.max(1, Math.round(Number(rawScore))));
        setUpdatedAtsScores((prev) => ({
          ...prev,
          [jobId]: parsedScore,
        }));
      }
    } catch (err) {
      console.error("[BrowseJobs] Error calculating updated ATS score:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to fetch updated ATS score. Please try again.";
      setEnhanceError(errMsg);
    } finally {
      setIsUpdatingAts(false);
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
    setSelectedDate("All time");
    setSelectedLocations([]);
    setLocationSearch("");
    setSelectedWorkplace([]);
    setSelectedCompanies([]);
    setCompanySearch("");
    setSelectedExperience("");
    setSelectedRoles([]);
    setSelectedJobTypes([]);
    setSponsorsVisa(false);
    setSortOption("best_match");
    setActiveDropdown(null);
    jobsCacheRef.current = {};
    setJobsCache({});
    setActivePage(1);
    loadPage(1, {
      forceRefresh: true,
      customQuery: "",
      customSort: "best_match",
      overrideFilters: {
        locations: [],
        roles: [],
        workplace: [],
        jobTypes: [],
        date: "All time",
      },
    });
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

  // Flatten all cached jobs across pages for options extraction
  const allCachedJobs = useMemo(() => {
    return Object.values(jobsCache).flat();
  }, [jobsCache]);

  // Dynamically extract filter options from cached jobs
  const dynamicCompanyOptions = useMemo(() => {
    const set = new Set();
    allCachedJobs.forEach((j) => {
      if (j.company && j.company !== "Hiring Organization") {
        set.add(j.company);
      }
    });
    return Array.from(set);
  }, [allCachedJobs]);

  const dynamicRoleOptions = useMemo(() => {
    const set = new Set();
    allCachedJobs.forEach((j) => {
      if (j.title && !j.title.startsWith("Position #")) {
        set.add(j.title);
      }
    });
    return Array.from(set);
  }, [allCachedJobs]);

  const dynamicLocationOptions = useMemo(() => {
    const set = new Set();
    allCachedJobs.forEach((j) => {
      if (j.location && j.location !== "Remote / Flexible") {
        set.add(j.location);
      }
    });
    return Array.from(set);
  }, [allCachedJobs]);

  // Filter all cached jobs across all loaded pages
  const allFilteredJobs = useMemo(() => {
    return allCachedJobs.filter((job) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (job.title || "").toLowerCase().includes(q);
        const matchComp = (job.company || "").toLowerCase().includes(q);
        const matchLoc = (job.location || "").toLowerCase().includes(q);
        const matchDesc = (job.description || "").toLowerCase().includes(q);
        const matchSkills =
          Array.isArray(job.requiredSkills) &&
          job.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchComp && !matchLoc && !matchDesc && !matchSkills) {
          return false;
        }
      }
      if (selectedLocations.length > 0) {
        const jobLoc = (job.location || job.fullLocation || "").toLowerCase();
        const matchesLoc = selectedLocations.some((loc) =>
          jobLoc.includes(loc.toLowerCase().split(",")[0])
        );
        if (!matchesLoc) return false;
      }
      if (selectedCompanies.length > 0) {
        const jobComp = (job.company || "").toLowerCase();
        const matchesComp = selectedCompanies.some((comp) =>
          jobComp.includes(comp.toLowerCase())
        );
        if (!matchesComp) return false;
      }
      if (selectedRoles.length > 0) {
        const jobRole = (job.title || "").toLowerCase();
        const matchesRole = selectedRoles.some((role) =>
          jobRole.includes(role.toLowerCase())
        );
        if (!matchesRole) return false;
      }
      if (selectedWorkplace.length > 0) {
        const jobMode = (job.workMode || "").toLowerCase();
        const matchesWorkMode = selectedWorkplace.some((m) =>
          jobMode.includes(m.toLowerCase())
        );
        if (!matchesWorkMode) return false;
      }
      if (selectedJobTypes.length > 0) {
        const jobType = (job.type || "").toLowerCase();
        const matchesType = selectedJobTypes.some((t) =>
          jobType.includes(t.toLowerCase())
        );
        if (!matchesType) return false;
      }
      return true;
    });
  }, [
    allCachedJobs,
    searchQuery,
    selectedLocations,
    selectedCompanies,
    selectedRoles,
    selectedWorkplace,
    selectedJobTypes,
  ]);

  // Derived total pages for pagination controls
  const totalFilteredPages = Math.max(1, Math.ceil(allFilteredJobs.length / pageSize));
  const displayTotalPages =
    totalPages > totalFilteredPages && hasMoreJobs
      ? totalPages
      : totalFilteredPages;

  // Active slice of jobs for the current page
  const displayedJobs = useMemo(() => {
    const startIdx = (activePage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const sliced = allFilteredJobs.slice(startIdx, endIdx);
    if (sliced.length > 0) return sliced;

    const directPage = jobsCache[activePage];
    if (Array.isArray(directPage) && directPage.length > 0) {
      return directPage;
    }
    return [];
  }, [allFilteredJobs, activePage, pageSize, jobsCache]);

  // Aliased for full compatibility with existing JSX
  const filteredJobs = displayedJobs;

  // Auto-reset activePage to 1 if activePage exceeds displayTotalPages
  useEffect(() => {
    if (activePage > displayTotalPages && displayTotalPages > 0) {
      setActivePage(1);
    }
  }, [activePage, displayTotalPages]);

  // Reset to page 1 whenever search query or filters change
  useEffect(() => {
    setActivePage(1);
  }, [
    searchQuery,
    selectedLocations,
    selectedCompanies,
    selectedRoles,
    selectedWorkplace,
    selectedJobTypes,
    selectedDate,
  ]);

  // Determine dynamic visible pages for pagination controls
  const visiblePages = useMemo(() => {
    const highestPage = Math.max(1, displayTotalPages);
    if (highestPage <= 5) {
      return Array.from({ length: highestPage }, (_, i) => i + 1);
    }
    let start = Math.max(1, activePage - 2);
    let end = Math.min(highestPage, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [displayTotalPages, activePage]);

  // Handle Page Change with Cache & In-Memory Checking
  const handlePageChange = (targetPage) => {
    if (targetPage < 1 || targetPage === activePage || targetPage > displayTotalPages) {
      return;
    }
    const startIdx = (targetPage - 1) * pageSize;
    // 1. If target page jobs are already loaded in allFilteredJobs:
    if (startIdx < allFilteredJobs.length) {
      setActivePage(targetPage);
      return;
    }
    // 2. If target page jobs are cached in jobsCache directly:
    if (jobsCacheRef.current[targetPage] && jobsCacheRef.current[targetPage].length > 0) {
      setActivePage(targetPage);
      return;
    }
    // 3. Otherwise fetch from server if more jobs might be available
    if (hasMoreJobs) {
      loadPage(targetPage);
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
          {/* Page Heading & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            {/* Page Heading */}
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
                Browse & Apply
              </h1>
              <p className="text-[13px] text-[#64748B]">
                Discover and browse all job opportunities matched to your resume from our live matching engine.
              </p>
            </div>

            {/* Select Resume Dropdown (Aligned Right - Prominent & Enlarged) */}
            <div className="relative shrink-0 self-start sm:self-center" ref={resumeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsResumeDropdownOpen((prev) => !prev)}
                className="h-[50px] sm:h-[52px] px-4 sm:px-5 rounded-[14px] bg-white border border-[#CBD5E1] hover:border-[#4F46E5] hover:shadow-md transition-all flex items-center gap-3 text-[#0F172A] cursor-pointer"
              >
                {/* Document / Resume Icon */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>

                {/* Selected Resume Info */}
                <div className="flex flex-col text-left max-w-[200px] sm:max-w-[300px] leading-snug">
                  <span className="text-[10.5px] sm:text-[11px] uppercase font-bold text-[#475569] tracking-wider">
                    {isSettingPrimary ? "Updating..." : "Active Resume"}
                  </span>
                  <span className="text-[13.5px] sm:text-[14.5px] font-bold text-[#0F172A] truncate">
                    {isLoadingResumes ? (
                      "Loading resumes..."
                    ) : selectedResume ? (
                      selectedResume.fileName || selectedResume.name || selectedResume.originalName || "Selected Resume"
                    ) : (
                      "Select Resume"
                    )}
                  </span>
                </div>

                {/* Primary Tag if selected resume is primary */}
                {selectedResume?.isPrimary && !isSettingPrimary && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-indigo-200 shrink-0">
                    <svg className="w-3 h-3 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Primary
                  </span>
                )}

                {/* Chevron Icon */}
                <svg
                  className={`w-5 h-5 text-[#64748B] transition-transform duration-200 shrink-0 ${
                    isResumeDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu Popup (Enlarged & Prominent) */}
              {isResumeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-[380px] bg-white rounded-[18px] border border-[#CBD5E1] shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
                    <span className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
                      Select Resume
                    </span>
                    <span className="text-[12px] font-semibold text-[#475569] bg-white px-2.5 py-0.5 rounded-full border border-[#E2E8F0]">
                      {userResumes.length} {userResumes.length === 1 ? "resume" : "resumes"}
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto p-2 space-y-1.5">
                    {isLoadingResumes ? (
                      <div className="p-5 text-center text-sm font-medium text-[#64748B]">
                        Loading resumes...
                      </div>
                    ) : userResumes.length === 0 ? (
                      <div className="p-5 text-center">
                        <p className="text-sm text-[#64748B] mb-2.5">No uploaded resumes found</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsResumeDropdownOpen(false);
                            navigate("/profile");
                          }}
                          className="px-4 py-2 bg-[#4F46E5] text-white text-xs font-bold rounded-xl hover:bg-[#4338CA] transition-colors cursor-pointer"
                        >
                          Upload in Profile
                        </button>
                      </div>
                    ) : (
                      userResumes.map((resume, idx) => {
                        const resumeId = resume.id ?? resume.resumeId ?? resume._id ?? resume.fileId ?? resume.uuid ?? resume.resume_id;
                        const selectedId = selectedResume?.id ?? selectedResume?.resumeId ?? selectedResume?._id ?? selectedResume?.fileId ?? selectedResume?.uuid ?? selectedResume?.resume_id;
                        const isSelected = String(resumeId) === String(selectedId);
                        const resumeName = resume.fileName || resume.name || resume.originalName || `Resume ${idx + 1}`;
                        const isPrimary = Boolean(resume.isPrimary === true);

                        return (
                          <button
                            key={resumeId || idx}
                            type="button"
                            onClick={() => handleSelectResume(resume)}
                            className={`w-full p-3 rounded-[12px] text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? "bg-[#EEF2FF] border border-indigo-200 shadow-2xs"
                                : "hover:bg-[#F8FAFC] border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-[#4F46E5] text-white shadow-2xs" : "bg-slate-100 text-slate-500"
                              }`}>
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-[13.5px] sm:text-[14px] font-bold truncate ${
                                  isSelected ? "text-[#4F46E5]" : "text-[#0F172A]"
                                }`}>
                                  {resumeName}
                                </span>
                                {resume.createdAt && (
                                  <span className="text-[11px] text-[#64748B]">
                                    Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isPrimary && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-indigo-200">
                                  Primary
                                </span>
                              )}
                              {isSelected && (
                                <svg className="w-5 h-5 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResumeDropdownOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full py-2 px-3 text-center text-[12.5px] font-bold text-[#4F46E5] hover:text-[#4338CA] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#E2E8F0] cursor-pointer"
                    >
                      + Manage / Upload Resumes in Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search & Filter Container */}
          <div
            ref={dropdownRef}
            className="bg-white rounded-[20px] border border-[#E2E8F0] p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3.5 relative z-10"
          >
            {/* First Row: Search Input + Clear */}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      jobsCacheRef.current = {};
                      setJobsCache({});
                      loadPage(1, { forceRefresh: true });
                    }
                  }}
                  placeholder="Search by title, keyword, company or skills..."
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
            </div>

            {/* Second Row: Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5 relative">
              {/* Date Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("date")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "date" || selectedDate !== "All time"
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Date</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "date" ? "rotate-180" : ""
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
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${isSelected
                            ? "font-semibold text-[#0F172A] bg-slate-50"
                            : "text-slate-700"
                            }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected
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

              {/* Location Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("location")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "location" || selectedLocations.length > 0
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Location</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "location" ? "rotate-180" : ""
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
                      {dynamicLocationOptions.length === 0 ? (
                        <div className="text-xs text-slate-400 px-2 py-1">
                          No locations available yet
                        </div>
                      ) : (
                        dynamicLocationOptions
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
                                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked
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
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("role")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "role" || selectedRoles.length > 0
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Role</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "role" ? "rotate-180" : ""
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
                  <div className="absolute top-full left-0 mt-2 w-[220px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1 max-h-[220px] overflow-y-auto">
                    {dynamicRoleOptions.length === 0 ? (
                      <div className="text-xs text-slate-400 px-2 py-1">
                        No roles available yet
                      </div>
                    ) : (
                      dynamicRoleOptions.map((role) => {
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
                              className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked
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
                            <span className="truncate">{role}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Job Type Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("jobType")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "jobType" || selectedJobTypes.length > 0
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Job Type</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "jobType" ? "rotate-180" : ""
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
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked
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

              {/* Workplace Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("workplace")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "workplace" || selectedWorkplace.length > 0
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Workplace</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "workplace" ? "rotate-180" : ""
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
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked
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

              {/* Companies Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("companies")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "companies" || selectedCompanies.length > 0
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Companies</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "companies" ? "rotate-180" : ""
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
                      {dynamicCompanyOptions.length === 0 ? (
                        <div className="text-xs text-slate-400 px-2 py-1">
                          No companies available yet
                        </div>
                      ) : (
                        dynamicCompanyOptions
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
                                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${isChecked
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
                                <span className="truncate">{comp}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort & Auto Apply Actions */}
              <div className="relative sm:ml-auto flex items-center gap-2.5 flex-wrap">
                {/* Sort Dropdown (Best Match vs Newest) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown("sort")}
                    className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "sort" || sortOption !== "best_match"
                      ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                      }`}
                  >
                    <span className="text-[#64748B]">Sort:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {sortOption === "newest" ? "Newest First" : "Best ATS Match"}
                    </span>
                    <svg
                      className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "sort" ? "rotate-180" : ""
                        }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {activeDropdown === "sort" && (
                    <div className="absolute top-full right-0 mt-2 w-[190px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2 z-50 flex flex-col gap-0.5">
                      <div
                        onClick={() => {
                          setSortOption("best_match");
                          setActiveDropdown(null);
                          jobsCacheRef.current = {};
                          setJobsCache({});
                          loadPage(1, { forceRefresh: true, customSort: "best_match" });
                        }}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${sortOption === "best_match"
                          ? "font-semibold text-[#0F172A] bg-slate-50"
                          : "text-slate-700"
                          }`}
                      >
                        <span>Best ATS Match</span>
                        {sortOption === "best_match" && (
                          <span className="text-[#4F46E5] text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setSortOption("newest");
                          setActiveDropdown(null);
                          jobsCacheRef.current = {};
                          setJobsCache({});
                          loadPage(1, { forceRefresh: true, customSort: "newest" });
                        }}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${sortOption === "newest"
                          ? "font-semibold text-[#0F172A] bg-slate-50"
                          : "text-slate-700"
                          }`}
                      >
                        <span>Newest First</span>
                        {sortOption === "newest" && (
                          <span className="text-[#4F46E5] text-xs font-bold">✓</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto Apply All Button */}
                <button
                  type="button"
                  onClick={() => navigate("/auto-apply")}
                  className="h-[36px] px-6 rounded-[10px] bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] hover:from-[#4338CA] hover:via-[#4F46E5] hover:to-[#6D28D9] text-white text-[14.5px] font-semibold flex items-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5 text-amber-300 fill-current drop-shadow-[0_0_6px_rgba(252,211,77,0.6)]" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h8l-1 8 11-12h-8l1-8z" />
                  </svg>
                  <span>Auto Apply All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {fetchError && (
            <div className="p-4 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-[13px] font-medium flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">!</span>
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadPage(activePage, { forceRefresh: true })}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Dynamic Job Cards Grid */}
          {(() => {
            return (
              <>
                {isLoadingJobs ? (
                  <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-16 text-center flex flex-col items-center justify-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-[#4F46E5]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <p className="text-[14px] font-medium text-slate-700">Loading stored job matches from server...</p>
                  </div>
                ) : allCachedJobs.length === 0 ? (
                  <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-[#4F46E5] mb-1">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                    </div>
                    <p className="text-[16px] font-bold text-slate-800">
                      No stored job matches found
                    </p>
                    <p className="text-[13px] text-slate-500 max-w-md leading-relaxed">
                      Upload or set a primary resume in your profile to enable automated ATS matching and job recommendations.
                    </p>
                    <div className="flex items-center gap-2.5 mt-2">
                      <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Go to Profile & Resumes
                      </button>
                    </div>
                  </div>
                ) : allFilteredJobs.length === 0 ? (
                  <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-10 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-[15px] font-bold text-slate-800">No matching jobs found</p>
                    <p className="text-[13px] text-slate-500 max-w-sm">
                      No jobs match your current search or filter options. Try clearing or broadening your filters.
                    </p>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="mt-1 px-4 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
                      {filteredJobs.map((job, idx) => (
                          <div
                            key={job.id || job.job_id || job.jobId || `job-${idx}`}
                            onClick={() => handleOpenJobModal(job)}
                            className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(15,23,42,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-200 min-h-[260px] cursor-pointer group"
                          >
                            <div>
                              {/* Top Header: Logo + Match Badge */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="w-[40px] h-[40px] rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2">
                                  <img
                                    src={job.logo || aiLogo}
                                    alt={job.company}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <span
                                  className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${job.matchColor || "bg-[#EEF2FF] text-[#4F46E5]"}`}
                                >
                                  {job.match || (job.matchPercent ? `${job.matchPercent}% match` : "ATS Match")}
                                </span>
                              </div>

                              {/* Job Title & Company */}
                              <div className="mt-3.5">
                                <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight leading-snug group-hover:text-[#4F46E5] transition-colors line-clamp-2">
                                  {job.title}
                                </h3>
                                <div className="flex items-center gap-1.5 text-[13px] text-[#64748B] font-normal mt-1 flex-wrap">
                                  <span className="font-medium text-slate-700 truncate max-w-[140px]">{job.company}</span>
                                  {job.companyDomain && (
                                    <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                      {job.companyDomain}
                                    </span>
                                  )}
                                  <VerifiedTick />
                                </div>
                              </div>

                              {/* Location, Workplace & Type Pills */}
                              <div className="mt-3 flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5 text-[12.5px] text-[#64748B]">
                                  <img
                                    src={mapIcon}
                                    alt=""
                                    className="w-[10px] h-[12px] object-contain shrink-0"
                                  />
                                  <span className="truncate">{job.fullLocation || job.location}</span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  {job.workMode && (
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                                      {job.workMode}
                                    </span>
                                  )}
                                  {job.type && (
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                                      {job.type}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11.5px] text-[#94A3B8] mt-0.5">
                                  {job.posted}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2.5 pt-4 mt-auto">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenJobModal(job);
                                }}
                                className="flex-1 h-[36px] rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#334155] hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center"
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenJobModal(job);
                                }}
                                className="flex-1 h-[36px] rounded-[10px] bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] border border-[#C7D2FE]/80 text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center active:scale-[0.99]"
                              >
                                Apply Now
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Bottom Pagination Card (Image 2 Design) */}
                    <div className="bg-white rounded-[16px] border border-[#E2E8F0] px-5 py-3.5 flex items-center justify-between flex-wrap gap-4 shadow-[0_1px_3px_rgba(15,23,42,0.02)] mt-2 mb-8">
                      {/* Left Side: Dynamic Loaded Jobs Count Text */}
                      <span className="text-[13px] sm:text-[13.5px] font-medium text-[#475569]">
                        {(() => {
                          const currentCount = displayedJobs.length;
                          const startIdx = allFilteredJobs.length > 0 ? (activePage - 1) * pageSize + 1 : 0;
                          const endIdx = allFilteredJobs.length > 0 ? (activePage - 1) * pageSize + currentCount : 0;
                          const displayTotal = totalItems > allFilteredJobs.length ? totalItems : allFilteredJobs.length;

                          return `Showing ${startIdx}–${endIdx} of ${displayTotal} jobs (Page ${activePage} of ${displayTotalPages})`;
                        })()}
                      </span>

                      {/* Right Side: Pagination Controls (< 1 2 3 >) */}
                      <div className="flex items-center gap-1.5">
                        {/* Previous Button */}
                        <button
                          type="button"
                          onClick={() => handlePageChange(activePage - 1)}
                          disabled={activePage <= 1 || isLoadingPage}
                          className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 text-sm flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Previous Page"
                        >
                          <svg
                            className="w-4 h-4 text-slate-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Page Numbers */}
                        {visiblePages.map((pg) => {
                          const isActive = activePage === pg;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => handlePageChange(pg)}
                              disabled={isLoadingPage && isActive}
                              className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                                isActive
                                  ? "bg-[#4F46E5] text-white shadow-xs"
                                  : "border border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {pg}
                            </button>
                          );
                        })}

                        {/* Next Button */}
                        <button
                          type="button"
                          onClick={() => handlePageChange(activePage + 1)}
                          disabled={activePage >= displayTotalPages || isLoadingPage}
                          className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 text-sm flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Next Page"
                        >
                          <svg
                            className="w-4 h-4 text-slate-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </main>
      </div>

      {/* Job Details Modal Drawer (Right side slide-over) */}
      {selectedJobModal && (() => {
        const selectedJobId = getJobId(selectedJobModal);
        const activeAtsScore =
          updatedAtsScores[selectedJobId] !== undefined
            ? updatedAtsScores[selectedJobId]
            : (selectedJobModal.displayScore ??
              (selectedJobModal.rawScore !== null && selectedJobModal.rawScore !== undefined && !isNaN(Number(selectedJobModal.rawScore))
                ? (!Number.isInteger(Number(selectedJobModal.rawScore))
                  ? Number(selectedJobModal.rawScore).toFixed(1)
                  : Math.min(100, Math.max(1, Math.round(Number(selectedJobModal.rawScore)))))
                : selectedJobModal.matchPercent) ??
              96);
        const scoreData =
          selectedJobModal.scoreData || selectedJobModal.rawMatch?.score_data;
        const missingRequiredSkills =
          scoreData?.missing_required_skills ||
          selectedJobModal.rawMatch?.missing_required_skills ||
          [];
        const missingPreferredSkills =
          scoreData?.missing_preferred_skills ||
          selectedJobModal.rawMatch?.missing_preferred_skills ||
          [];
        const missingKeywords =
          scoreData?.missing_keywords ||
          selectedJobModal.rawMatch?.missing_keywords ||
          [];

        return (
          <div
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
            onClick={() => {
              setSelectedJobModal(null);
              setEnhanceError(null);
              setEnhanceSuccess(null);
            }}
          >
            <div
              className="absolute top-0 right-0 h-full w-full sm:w-[520px] lg:w-[440px] bg-white shadow-2xl overflow-hidden flex flex-col min-h-0 animate-in slide-in-from-right duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
                <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-2">
                  {selectedJobModal.logo ? (
                    <div className="w-[44px] h-[44px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2 mt-0.5">
                      <img
                        src={selectedJobModal.logo}
                        alt={selectedJobModal.company || "Company Logo"}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-col flex-1 min-w-0">
                    <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight leading-snug break-words">
                      {typeof selectedJobModal.title === "string"
                        ? selectedJobModal.title
                          .replace(/<[^>]*>/g, " ")
                          .replace(/\s+/g, " ")
                          .trim()
                        : selectedJobModal.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-[13.5px] text-[#475569] font-medium mt-1">
                      <span className="truncate">{selectedJobModal.company}</span>
                      <VerifiedTick />
                    </div>

                    <div className="flex items-center gap-2.5 text-[12px] text-[#64748B] mt-2 flex-wrap">
                      <span>
                        {selectedJobModal.fullLocation ||
                          selectedJobModal.location}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{selectedJobModal.type || "Full-time"}</span>
                      <span className="text-slate-300">•</span>
                      <span>{selectedJobModal.workMode || "On-site"}</span>
                    </div>
                    <div className="text-[12px] text-[#64748B] mt-1">
                      {selectedJobModal.department || "Engineering"}
                    </div>
                  </div>
                </div>

                {/* Right Actions (Close & Enhance Resume) */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobModal(null);
                      setEnhanceError(null);
                      setEnhanceSuccess(null);
                    }}
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  {!enhancedResultsMap[selectedJobId] && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={handleEnhanceResume}
                        disabled={isEnhancing}
                        className="bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-[#818CF8] text-white text-[12.5px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5 active:scale-[0.98] disabled:cursor-not-allowed"
                      >
                        {isEnhancing ? (
                          <>
                            <svg
                              className="animate-spin w-3.5 h-3.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span>Enhancing...</span>
                          </>
                        ) : (
                          "Enhance Resume"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
                {/* Feedback Alerts */}
                {enhanceSuccess && (
                  <div className="bg-[#EEF2FF] border border-[#C7D2FE] text-[#312E81] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                      <span className="font-semibold">{enhanceSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEnhancedModal(true)}
                      className="underline font-bold text-[#4F46E5] hover:text-[#3730A3] cursor-pointer ml-2"
                    >
                      View
                    </button>
                  </div>
                )}

                {enhanceError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                        !
                      </span>
                      <span className="font-medium">{enhanceError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnhanceError(null)}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* ATS Match Box */}
                <div className="rounded-[16px] border border-slate-200/80 bg-[#F8FAFC]/70 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-[64px] h-[64px] shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200"
                          strokeWidth="3.2"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#4F46E5]"
                          strokeDasharray={`${Number(activeAtsScore) || 0}, 100`}
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[13px] font-bold text-[#0F172A] leading-none">
                          {activeAtsScore}%
                        </span>
                        <span className="text-[8.5px] text-[#64748B] font-medium leading-none mt-0.5">
                          Match
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <h3 className="text-[14px] font-bold text-[#0F172A]">
                        ATS Match
                      </h3>
                      <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                        {Number(activeAtsScore) >= 80
                          ? "Strong match based on your profile, skills, experience and preferences."
                          : Number(activeAtsScore) >= 60
                            ? "Moderate match. Enhancing your resume can bridge key skill and keyword gaps."
                            : "Lower match. Review identified gaps below or click Enhance Resume."}
                      </p>
                    </div>
                  </div>

                  {/* Get Updated ATS Button */}
                  {enhancedResultsMap[selectedJobId] && (
                    <button
                      type="button"
                      onClick={handleGetUpdatedAts}
                      disabled={isUpdatingAts}
                      className="px-3.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[12px] font-semibold rounded-xl shadow-xs shrink-0 whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                    >
                      {isUpdatingAts ? (
                        <>
                          <svg
                            className="animate-spin w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Updating...</span>
                        </>
                      ) : (
                        "Get Updated ATS"
                      )}
                    </button>
                  )}
                </div>

                {/* ATS Identified Gaps & Missing Skills */}
                {(missingRequiredSkills.length > 0 ||
                  missingPreferredSkills.length > 0 ||
                  missingKeywords.length > 0) && (
                    <div className="rounded-[16px] border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center">
                            !
                          </span>
                          <h4 className="text-[13px] font-bold text-amber-950">
                            ATS Identified Gaps
                          </h4>
                        </div>
                        <span className="text-[10.5px] font-semibold text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full">
                          {missingRequiredSkills.length +
                            missingPreferredSkills.length +
                            missingKeywords.length}{" "}
                          Gaps
                        </span>
                      </div>

                      {missingRequiredSkills.length > 0 && (
                        <div>
                          <span className="text-[11.5px] font-semibold text-amber-900 block mb-1.5">
                            Missing Required Skills:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {missingRequiredSkills.map((skill, i) => (
                              <span
                                key={i}
                                className="bg-white border border-amber-200 text-amber-900 text-[11.5px] font-medium px-2.5 py-0.5 rounded-md shadow-2xs"
                              >
                                • {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {missingPreferredSkills.length > 0 && (
                        <div>
                          <span className="text-[11.5px] font-semibold text-amber-900 block mb-1.5">
                            Missing Preferred Skills:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {missingPreferredSkills.map((skill, i) => (
                              <span
                                key={i}
                                className="bg-white border border-amber-200 text-amber-900 text-[11.5px] font-medium px-2.5 py-0.5 rounded-md shadow-2xs"
                              >
                                • {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {missingKeywords.length > 0 && (
                        <div>
                          <span className="text-[11.5px] font-semibold text-amber-900 block mb-1.5">
                            Missing Keywords:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {missingKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="bg-white border border-amber-200 text-slate-700 text-[11px] font-normal px-2 py-0.5 rounded-md"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Job Description */}
                <div>
                  <h3 className="text-[14px] font-bold text-[#0F172A]">
                    Job description
                  </h3>
                  <p className="text-[12.5px] text-[#475569] leading-relaxed mt-1.5">
                    {cleanHtmlText(
                      selectedJobModal.description ||
                      selectedJobModal.fullJdText ||
                      selectedJobModal.preview
                    )}
                  </p>
                </div>

                {/* Key Responsibilities */}
                {Array.isArray(selectedJobModal.responsibilities) &&
                  selectedJobModal.responsibilities.length > 0 && (
                    <div>
                      <h3 className="text-[14px] font-bold text-[#0F172A]">
                        Key responsibilities:
                      </h3>
                      <ul className="space-y-2 mt-2">
                        {selectedJobModal.responsibilities.map((resp, idx) => (
                          <li
                            key={idx}
                            className="text-[12.5px] text-[#475569] flex items-start gap-2 leading-snug"
                          >
                            <span className="text-[#94A3B8] shrink-0">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Required Skills */}
                {Array.isArray(selectedJobModal.requiredSkills) &&
                  selectedJobModal.requiredSkills.length > 0 && (
                    <div>
                      <h3 className="text-[14px] font-bold text-[#0F172A]">
                        Required skills
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedJobModal.requiredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Preferred Skills */}
                {Array.isArray(selectedJobModal.preferredSkills) &&
                  selectedJobModal.preferredSkills.length > 0 && (
                    <div>
                      <h3 className="text-[14px] font-bold text-[#0F172A]">
                        Preferred skills
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedJobModal.preferredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Job Details */}
                <div>
                  <h3 className="text-[14px] font-bold text-[#0F172A] mb-2.5">
                    Job details
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-[#64748B]">Experience</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedJobModal.experience || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-[#64748B]">Work mode</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedJobModal.workMode || "On-site"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-[#64748B]">Employment type</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedJobModal.type || "Full-time"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-[#64748B]">Location</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedJobModal.fullLocation ||
                          selectedJobModal.location || "Remote / Flexible"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0 flex flex-col gap-2.5">
                <button
                  type="button"
                  className="w-full h-[44px] rounded-[12px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13.5px] font-medium flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Apply now</span>
                  <span>→</span>
                </button>

                <p className="text-[11.5px] text-[#94A3B8] text-center">
                  Your application quota will be reserved before submission.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Full Enhanced Resume Modal View */}
      {showEnhancedModal &&
        selectedJobModal &&
        enhancedResultsMap[getJobId(selectedJobModal)] && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] font-bold text-sm">
                    AI
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      AI Enhanced Resume
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Tailored specifically for {selectedJobModal.title} at{" "}
                      {selectedJobModal.company}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadEnhancedResume(
                        enhancedResultsMap[getJobId(selectedJobModal)]
                          ?.EnhResume ||
                        enhancedResultsMap[getJobId(selectedJobModal)]
                          ?.enhResume ||
                        enhancedResultsMap[getJobId(selectedJobModal)]
                          ?.enhanced_resume ||
                        enhancedResultsMap[getJobId(selectedJobModal)]
                          ?.enhancedResume,
                        selectedJobModal
                      )
                    }
                    disabled={isDownloadingResume}
                    className="px-3.5 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] disabled:bg-slate-100 text-[#4F46E5] disabled:text-slate-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isDownloadingResume ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5 text-[#4F46E5]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>Download</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEnhancedModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Bridged Gaps Summary */}
                {enhancedResultsMap[getJobId(selectedJobModal)]
                  ?.bridgeable_gaps && (
                    <div className="bg-[#EEF2FF]/70 border border-[#C7D2FE] rounded-xl p-4.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#312E81] uppercase tracking-wide">
                          Bridged Skills & Qualifications
                        </h4>
                        {Array.isArray(
                          enhancedResultsMap[getJobId(selectedJobModal)]
                            .bridgeable_gaps
                        ) && (
                            <span className="text-[11px] font-semibold text-[#4F46E5] bg-white border border-[#C7D2FE] px-2 py-0.5 rounded-full">
                              {
                                enhancedResultsMap[getJobId(selectedJobModal)]
                                  .bridgeable_gaps.length
                              }{" "}
                              Tailored Improvements
                            </span>
                          )}
                      </div>
                      <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                        {Array.isArray(
                          enhancedResultsMap[getJobId(selectedJobModal)]
                            .bridgeable_gaps
                        ) ? (
                          enhancedResultsMap[
                            getJobId(selectedJobModal)
                          ].bridgeable_gaps.map((gap, i) => {
                            if (typeof gap === "string") {
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 bg-white text-slate-800 border border-[#E0E7FF] rounded-lg p-2.5 shadow-2xs"
                                >
                                  <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">
                                    ✓
                                  </span>
                                  <span className="text-xs font-semibold text-slate-900">
                                    {gap}
                                  </span>
                                </div>
                              );
                            }

                            const skill =
                              gap?.skill || gap?.name || gap?.title || "";
                            const severity =
                              gap?.severity ||
                              (gap?.source ? String(gap.source).toUpperCase() : "");
                            const rationale =
                              gap?.rationale ||
                              gap?.description ||
                              gap?.reason ||
                              "";

                            return (
                              <div
                                key={i}
                                className="bg-white text-slate-800 border border-[#E0E7FF] rounded-xl p-3 shadow-2xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">
                                      ✓
                                    </span>
                                    <span className="text-xs font-bold text-slate-900">
                                      {skill || "Optimized Skill"}
                                    </span>
                                  </div>
                                  {severity && (
                                    <span
                                      className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severity === "CRITICAL"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : severity === "PREFERRED"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-indigo-50 text-[#4F46E5] border-indigo-200"
                                        }`}
                                    >
                                      {severity}
                                    </span>
                                  )}
                                </div>
                                {rationale && (
                                  <p className="text-xs text-slate-600 leading-relaxed pl-6 font-normal">
                                    {rationale}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        ) : typeof enhancedResultsMap[getJobId(selectedJobModal)]
                          .bridgeable_gaps === "object" ? (
                          Object.entries(
                            enhancedResultsMap[getJobId(selectedJobModal)]
                              .bridgeable_gaps
                          ).map(([k, v], i) => (
                            <div
                              key={i}
                              className="bg-white text-slate-800 border border-[#E0E7FF] rounded-xl p-3 shadow-2xs space-y-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">
                                  ✓
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {k}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed pl-6 font-normal">
                                {String(v)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#4F46E5]">
                            {String(
                              enhancedResultsMap[getJobId(selectedJobModal)]
                                .bridgeable_gaps
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {/* Professional Enhanced Resume Content */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Professional Formatted Resume
                    </h4>
                    <span className="text-[11px] text-[#4F46E5] font-semibold bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-0.5 rounded-full">
                      Dynamically Formatted
                    </span>
                  </div>
                  <EnhancedResumeViewer
                    resumeText={
                      enhancedResultsMap[getJobId(selectedJobModal)]?.EnhResume ||
                      enhancedResultsMap[getJobId(selectedJobModal)]?.enhResume ||
                      enhancedResultsMap[getJobId(selectedJobModal)]?.enhanced_resume ||
                      enhancedResultsMap[getJobId(selectedJobModal)]?.enhancedResume
                    }
                    compact={false}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEnhancedModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default BrowseJobs;
