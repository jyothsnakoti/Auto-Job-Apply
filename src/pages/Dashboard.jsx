import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import EnhancedResumeViewer from "../components/EnhancedResumeViewer";
import {
  getStoredUser,
  getOnboardingProfile,
  getStoredJobMatches,
  getOnboardingState,
  getEnhancedResume,
  getScoreForEnhancedResume,
  getCandidateId,
  getStoredResumeId,
  getJobId,
  getMoreJobsForResume,
  getPrimaryResumeId,
  getBillingStatus,
  checkUserHasResume,
  getDashboard,
  getDashboardData,
  getStoredDashboardData,
  getJobs,
  getJobById,
  getResumeMatchesStatus,
  refreshResumeMatches,
} from "../services/api";

import dashboard1Icon from "../assets/dashboard1.svg";
import dashboard2Icon from "../assets/dashboard2.svg";
import dashboard3Icon from "../assets/dashboard3.svg";
import dashboard4Icon from "../assets/dashboard4.svg";

import googleLogo from "../assets/google.svg";
import microsoftLogo from "../assets/microsoft.svg";
import amazonLogo from "../assets/amazon.svg";
import aiLogo from "../assets/ai.svg";
import mapIcon from "../assets/map.svg";
import shopifyLogo from "../assets/shopify.svg";
import tickIcon from "../assets/tick.svg";

// Verified tick icon
const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-3.5 h-3.5 object-contain inline-block shrink-0"
  />
);

// Document / Resume Icon
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

const degreeOptions = [
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate (PhD)",
];

const experienceOptions = [
  "No experience required",
  "Up to 1 year",
  "Up to 2 years",
  "Up to 3 years",
  "Up to 5 years",
  "Up to 7 years",
];

const jobTypeOptions = ["Full-time", "Part-time", "Contract", "Internship"];
const employmentTypeOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

// Helper to clean raw HTML tags (&nbsp;, <br/>, <p>, etc.) and normalize whitespace
const cleanHtmlText = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
};

const extractCleanJobTitle = (rawTitle, rawText, index = 0) => {
  let title = cleanHtmlText(rawTitle || "");
  const text = cleanHtmlText(rawText || "");

  // 1. If a title was explicitly provided and is a valid job title string
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

  // 2. If title exists even if slightly long, use the first line cleanly
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
      lookingMatch[1].trim().length <= 100
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
      explicitMatch[1].trim().length <= 100
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
      /\b(Director[A-Za-z0-9\s\-/+(),&]+)\b/i,
      /\b(Technician[A-Za-z0-9\s\-/+(),&]+)\b/i,
      /\b(Manager[A-Za-z0-9\s\-/+(),&]+)\b/i,
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
      firstLine.length <= 100 &&
      !firstLine.toLowerCase().includes("http")
    ) {
      return firstLine;
    }
  }

  if (rawTitle) {
    return cleanHtmlText(rawTitle).slice(0, 100);
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

  // Field 'preview' or 'title' or 'job_title' or 'role' from API payload contains the job title
  const title = extractCleanJobTitle(
    match.title || match.preview || match.job_title || match.role,
    rawText,
    index
  );
  const company = extractCleanCompany(
    match.companyName || match.company || match.company_name,
    rawText
  );

  const rawScore =
    typeof match.matchScore === "number"
      ? match.matchScore
      : typeof match.overall_score === "number"
        ? match.overall_score
        : typeof match.score_data?.overall_score === "number"
          ? match.score_data.overall_score
          : typeof match.score === "number"
            ? match.score
            : (typeof match.overall_score === "string" && !isNaN(Number(match.overall_score)) && match.overall_score.trim() !== "")
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

  let location = cleanHtmlText(match.location || match.city || match.country || "");
  if (!location && cleanedFullText) {
    const locMatch = cleanedFullText.match(
      /(?:location|place|city)\s*[:-]\s*([^\n\r]+)/i
    );
    if (locMatch && locMatch[1] && locMatch[1].trim().length <= 40) {
      location = locMatch[1].trim();
    }
  }
  if (!location) {
    location = "Remote / Flexible";
  }

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

  let matchText = matchPercent !== null ? `${matchPercent}% match` : "ATS Match";
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
  if (!description) {
    description = "Job description available upon viewing details.";
  }

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

  const jobId = match.jobId || match.job_id || match.JDid || match.jd_id || match.id || `match-${index + 1}`;

  // Handle backend employmentType like FULL_TIME, PART_TIME, CONTRACT
  let rawEmployment = match.employmentType || match.employment_type || match.type || "";
  let employmentType = "";
  if (rawEmployment) {
    const rawEmp = String(rawEmployment).toUpperCase().replace(/_/g, "-");
    if (rawEmp.includes("FULL")) employmentType = "Full-time";
    else if (rawEmp.includes("PART")) employmentType = "Part-time";
    else if (rawEmp.includes("CONTRACT")) employmentType = "Contract";
    else if (rawEmp.includes("INTERN")) employmentType = "Internship";
    else if (rawEmp.includes("FREELANCE")) employmentType = "Freelance";
    else employmentType = cleanHtmlText(rawEmployment);
  } else {
    employmentType = "Full-time";
  }

  // Handle backend workplace like REMOTE, ONSITE, HYBRID
  let rawWorkplace = match.workplace || match.workMode || match.work_mode || "";
  let workMode = "";
  if (rawWorkplace) {
    const rawWp = String(rawWorkplace).toUpperCase();
    if (rawWp.includes("REMOTE")) workMode = "Remote";
    else if (rawWp.includes("ONSITE") || rawWp.includes("ON_SITE") || rawWp.includes("OFFICE")) workMode = "On-site";
    else if (rawWp.includes("HYBRID")) workMode = "Hybrid";
    else workMode = cleanHtmlText(rawWorkplace);
  } else if (location.toLowerCase().includes("remote")) {
    workMode = "Remote";
  } else {
    workMode = "On-site";
  }

  return {
    id: jobId,
    job_id: jobId,
    JDid: jobId,
    title,
    company,
    companyDomain: match.companyDomain || "",
    location,
    country: match.country || "",
    fullLocation: cleanHtmlText(match.fullLocation || location),
    type: employmentType,
    employmentType,
    workMode,
    workplace: workMode,
    department: cleanHtmlText(match.department || "Engineering"),
    posted: match.postedAt ? new Date(match.postedAt).toLocaleDateString() : cleanHtmlText(match.posted || "Recent match"),
    postedAt: match.postedAt || null,
    match: matchText,
    matchPercent,
    rawScore,
    matchColor,
    logo: match.logo || logo,
    description,
    responsibilities,
    requiredSkills,
    preferredSkills,
    experience: cleanHtmlText(match.experience || "2 – 5 years"),
    scoreData: match.score_data || null,
    fullJdText: cleanedFullText,
    rawMatch: match,
  };
};

const getMatchPercent = (job) => {
  if (job?.matchPercent !== undefined && job?.matchPercent !== null) {
    const num = Number(job.matchPercent);
    if (!isNaN(num)) return num;
  }
  if (job?.rawScore !== undefined && job?.rawScore !== null) {
    const num = Number(job.rawScore);
    if (!isNaN(num)) return num;
  }
  if (job?.matchScore !== undefined && job?.matchScore !== null) {
    const num = Number(job.matchScore);
    if (!isNaN(num)) return num;
  }
  if (job?.overall_score !== undefined && job?.overall_score !== null) {
    const num = Number(job.overall_score);
    if (!isNaN(num)) return num;
  }
  return 0;
};

const getMatchLabel = (job) => {
  const percent = getMatchPercent(job);
  if (percent > 0) {
    return `${Number.isInteger(percent) ? percent : Math.round(percent)}% match`;
  }
  return job?.match || "ATS Match";
};

const getMatchBadgeColor = (percent) => {
  if (percent >= 85) return "bg-[#ECFDF5] text-[#059669]";
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
  if (
    job?.score_data?.missing_required_skills &&
    Array.isArray(job.score_data.missing_required_skills)
  ) {
    return job.score_data.missing_required_skills;
  }
  return [];
};

const formatMatchTime = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return String(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(isoString);
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedAppTab, setSelectedAppTab] = useState("All");
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [isJobSaved, setIsJobSaved] = useState(false);

  // Helper to open job modal and fetch full job details from GET /api/jobs/{originalJobId}
  const handleOpenJobModal = async (job) => {
    if (!job) return;
    setSelectedJobModal(job);

    const originalJobId = getJobId(job);
    console.log("[Dashboard] Opening job modal. Original Job ID:", originalJobId);

    if (originalJobId) {
      try {
        setIsLoadingJobDetails(true);
        console.log(`[Dashboard] Fetching job details from GET /api/jobs/${originalJobId}...`);
        const details = await getJobById(originalJobId);
        console.log(`[Dashboard] GET /api/jobs/${originalJobId} details response:`, details);

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
        console.warn(`[Dashboard] GET /api/jobs/${originalJobId} fetch warning:`, err?.message);
      } finally {
        setIsLoadingJobDetails(false);
      }
    }
  };


  // Dynamic Jobs & API Pagination State
  const [jobs, setJobs] = useState(() => {
    try {
      const cachedDashboard = getStoredDashboardData();
      if (Array.isArray(cachedDashboard?.topMatches) && cachedDashboard.topMatches.length > 0) {
        return cachedDashboard.topMatches
          .map((m, idx) => transformMatchToJob(m, idx))
          .filter(Boolean);
      }
      const stored = getStoredJobMatches();
      if (Array.isArray(stored) && stored.length > 0) {
        return stored
          .map((m, idx) => transformMatchToJob(m, idx))
          .filter(Boolean);
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [lastJobId, setLastJobId] = useState(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobError, setJobError] = useState(null);
  const [jobFeedbackMessage, setJobFeedbackMessage] = useState(null);
  const [hasResume, setHasResume] = useState(() => {
    const cachedDashboard = getStoredDashboardData();
    return Boolean(cachedDashboard?.topMatches?.length > 0);
  });

  // Dynamic Billing Information from API
  const [billingInfo, setBillingInfo] = useState(null);

  // Dynamic User Applications State (Loaded from API / Storage)
  const [applications, setApplications] = useState(() => {
    try {
      const stored =
        localStorage.getItem("trackerApplications") ||
        sessionStorage.getItem("trackerApplications") ||
        localStorage.getItem("appliedJobs") ||
        sessionStorage.getItem("appliedJobs");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Enhance Resume States
  const [isEnhancing, setIsEnhancing] = useState(false);
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
  const [selectedDegrees, setSelectedDegrees] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [sponsorsVisa, setSponsorsVisa] = useState(false);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState([]);

  const dropdownRef = useRef(null);

  // Dynamic ATS Resume Matches Status from GET /api/resumes/matches/status
  const [matchStatus, setMatchStatus] = useState({
    hasPrimaryResume: null,
    refreshing: false,
    matchCount: 0,
    lastComputedAt: null,
    progress: null,
    lastResult: null,
  });
  const [isLoadingMatchStatus, setIsLoadingMatchStatus] = useState(true);
  const [isManualCheckingStatus, setIsManualCheckingStatus] = useState(false);
  const prevRefreshingRef = useRef(false);
  const pollingTimeoutRef = useRef(null);
  const hasAutoRefreshedRef = useRef(false);

  // Dynamic Dashboard Metrics from GET /api/dashboard
  const [dashboardMetrics, setDashboardMetrics] = useState(() => {
    return getStoredDashboardData() || null;
  });
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(!dashboardMetrics);

  // Reload jobs and dashboard data when matching finishes (refreshing transitions from true -> false)
  const reloadJobsAndDashboard = useCallback(async () => {
    try {
      setIsLoadingJobs(true);
      // 1. Reload dashboard stats
      const dashData = await getDashboard().catch(() => null);
      if (dashData) {
        setDashboardMetrics(dashData);
      }
      // 2. Reload jobs list from GET /api/jobs
      const jobsRes = await getJobs({ sort: "best_match", page: 0, size: 20 }).catch(() => null);
      if (jobsRes && Array.isArray(jobsRes.items) && jobsRes.items.length > 0) {
        const transformed = jobsRes.items
          .map((m, idx) => transformMatchToJob(m, idx))
          .filter(Boolean);
        setJobs(transformed);
        const last = transformed[transformed.length - 1];
        if (last?.job_id || last?.id) {
          setLastJobId(last.job_id || last.id);
        }
      } else if (Array.isArray(dashData?.topMatches) && dashData.topMatches.length > 0) {
        const transformed = dashData.topMatches
          .map((m, idx) => transformMatchToJob(m, idx))
          .filter(Boolean);
        setJobs(transformed);
      }
    } catch (err) {
      console.warn("[Dashboard] Error reloading jobs/dashboard after match refresh:", err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  // Poll GET /api/resumes/matches/status (with automatic background refresh)
  const fetchMatchStatus = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setIsLoadingMatchStatus(true);
        const status = await getResumeMatchesStatus();
        if (!status) return;

        setMatchStatus(status);

        if (status.hasPrimaryResume === false) {
          setHasResume(false);
        } else if (status.hasPrimaryResume === true) {
          setHasResume(true);
        }

        // Detect transition from refreshing=true to refreshing=false -> reload GET /api/jobs and GET /api/dashboard
        if (prevRefreshingRef.current === true && status.refreshing === false) {
          console.log("[Dashboard] ATS matching complete. Reloading GET /api/jobs and GET /api/dashboard...");
          reloadJobsAndDashboard();
        }

        prevRefreshingRef.current = Boolean(status.refreshing);

        // Automatic Refresh without manual user click:
        // If user has a primary resume, matching is not already running, and we haven't auto-refreshed yet
        if (
          isInitial &&
          status.hasPrimaryResume === true &&
          !status.refreshing &&
          !hasAutoRefreshedRef.current
        ) {
          hasAutoRefreshedRef.current = true;
          console.log("[Dashboard] Automatically requesting fresh ATS matching on initial load...");
          try {
            await refreshResumeMatches();
            setMatchStatus((prev) => ({
              ...prev,
              refreshing: true,
              progress: "Initiating automatic ATS match refresh...",
            }));
            prevRefreshingRef.current = true;
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = setTimeout(() => {
              fetchMatchStatus(false);
            }, 1000);
            return;
          } catch (autoErr) {
            console.warn("[Dashboard] Auto-refresh match notice:", autoErr?.message);
          }
        }

        // Polling: While matching runs (refreshing=true), poll every 3 seconds
        if (status.refreshing) {
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = setTimeout(() => {
            fetchMatchStatus(false);
          }, 3000);
        }
      } catch (err) {
        console.warn("[Dashboard] Could not fetch resume matches status:", err);
      } finally {
        if (isInitial) setIsLoadingMatchStatus(false);
        setIsManualCheckingStatus(false);
      }
    },
    [reloadJobsAndDashboard]
  );

  // Initialize and clean up polling timer
  useEffect(() => {
    fetchMatchStatus(true);
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [fetchMatchStatus]);

  const handleManualRefreshStatus = async () => {
    setIsManualCheckingStatus(true);
    await fetchMatchStatus(false);
  };

  const handleRequestMatchRefresh = async () => {
    if (isManualCheckingStatus || matchStatus.refreshing) return;
    if (matchStatus.hasPrimaryResume === false) {
      navigate("/profile");
      return;
    }
    try {
      setIsManualCheckingStatus(true);
      await refreshResumeMatches();
      setMatchStatus((prev) => ({
        ...prev,
        refreshing: true,
        progress: "Matching requested...",
      }));
      prevRefreshingRef.current = true;
      setTimeout(() => {
        fetchMatchStatus(false);
      }, 500);
    } catch (err) {
      console.error("[Dashboard] Error requesting match refresh:", err);
      setIsManualCheckingStatus(false);
    }
  };

  // 1. Fetch Dynamic Dashboard Metrics & Top Matches from GET /api/dashboard
  useEffect(() => {
    let isMounted = true;
    const loadDashboardMetrics = async () => {
      try {
        const data = await getDashboardData();
        if (isMounted && data) {
          setDashboardMetrics(data);

          // Populate Top Matches dynamically from /api/dashboard
          if (Array.isArray(data.topMatches) && data.topMatches.length > 0) {
            const transformed = data.topMatches
              .map((m, idx) => transformMatchToJob(m, idx))
              .filter(Boolean);

            if (transformed.length > 0) {
              setJobs(transformed);
              setHasResume(true);
              const last = transformed[transformed.length - 1];
              if (last?.job_id || last?.id) {
                setLastJobId(last.job_id || last.id);
              }
            }
          }
        }
      } catch (err) {
        console.warn("[Dashboard] Could not fetch dashboard metrics:", err);
      } finally {
        if (isMounted) {
          setIsLoadingDashboard(false);
          setIsLoadingJobs(false);
        }
      }
    };

    loadDashboardMetrics();

    const handleDashboardUpdated = (e) => {
      if (isMounted && e?.detail) {
        setDashboardMetrics(e.detail);
        if (Array.isArray(e.detail.topMatches) && e.detail.topMatches.length > 0) {
          const transformed = e.detail.topMatches
            .map((m, idx) => transformMatchToJob(m, idx))
            .filter(Boolean);
          if (transformed.length > 0) {
            setJobs(transformed);
            setHasResume(true);
          }
        }
      }
    };

    window.addEventListener("dashboardDataUpdated", handleDashboardUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener("dashboardDataUpdated", handleDashboardUpdated);
    };
  }, []);

  // 2. Fetch Dynamic Billing Status from API
  useEffect(() => {
    let isMounted = true;
    const loadBilling = async () => {
      try {
        const status = await getBillingStatus();
        if (isMounted && status) {
          setBillingInfo(status);
        }
      } catch (err) {
        console.warn("[Dashboard] Could not fetch billing status:", err);
        try {
          const stored =
            localStorage.getItem("billingStatus") ||
            sessionStorage.getItem("billingStatus");
          if (stored && isMounted) {
            setBillingInfo(JSON.parse(stored));
          }
        } catch {
          // ignore
        }
      }
    };

    loadBilling();

    const handleBillingUpdated = (e) => {
      if (isMounted && e?.detail) {
        setBillingInfo(e.detail);
      }
    };

    window.addEventListener("billingStatusUpdated", handleBillingUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener("billingStatusUpdated", handleBillingUpdated);
    };
  }, []);

  // 3. Fetch Dynamic User Info & Matched Jobs from API
  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setIsLoadingJobs(true);
        setJobError(null);

        // Resolve User Name
        const user = getStoredUser();
        const storedFullName =
          localStorage.getItem("userFullName") ||
          sessionStorage.getItem("userFullName") ||
          localStorage.getItem("userName") ||
          sessionStorage.getItem("userName") ||
          sessionStorage.getItem("pendingFullName") ||
          "";

        const currentEmail =
          user?.email ||
          localStorage.getItem("userEmail") ||
          sessionStorage.getItem("userEmail") ||
          sessionStorage.getItem("pendingVerificationEmail") ||
          "";

        const currentName = user?.fullName || user?.name || storedFullName || "";

        if (currentName && currentName !== currentEmail) {
          if (isMounted) setUserName(currentName);
        } else if (currentEmail) {
          const emailPrefix = currentEmail.split("@")[0];
          if (isMounted) setUserName(emailPrefix);
        }

        getOnboardingProfile()
          .then((profileData) => {
            if (!isMounted || !profileData) return;
            const resolvedName =
              profileData.fullName ||
              profileData.name ||
              profileData.profile?.fullName ||
              profileData.profile?.name;
            if (resolvedName) {
              setUserName(resolvedName);
              localStorage.setItem("userFullName", resolvedName);
              sessionStorage.setItem("userFullName", resolvedName);
            }
          })
          .catch(() => { });

        // Check Resume Status
        let activeResumeId = null;
        try {
          activeResumeId = await getPrimaryResumeId();
        } catch {
          // fallback
        }

        const onboardingState = getOnboardingState();
        if (!activeResumeId && onboardingState?.resumeId) {
          activeResumeId = String(onboardingState.resumeId);
        }

        const userHasResume =
          Boolean(activeResumeId) || (await checkUserHasResume().catch(() => false));
        if (isMounted) setHasResume(userHasResume);

        if (!userHasResume) {
          if (isMounted) {
            setJobs([]);
            setIsLoadingJobs(false);
          }
          return;
        }

        // 1. Fetch backend dashboard counters and top matches from GET /api/dashboard
        let fetchedJobsCount = 0;

        try {
          const dashData = await getDashboard();
          if (dashData && isMounted) {
            if (Array.isArray(dashData.topMatches) && dashData.topMatches.length > 0) {
              const topJobs = dashData.topMatches.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
              setJobs(topJobs);
              fetchedJobsCount = topJobs.length;
            }
          }
        } catch (dashErr) {
          console.debug("[Dashboard] GET /api/dashboard fallback notice:", dashErr?.message);
        }

        // 2. Fetch stored user jobs from GET /api/jobs
        try {
          const jobsRes = await getJobs({ sort: 'best_match', page: 0, size: 20 });
          if (jobsRes && Array.isArray(jobsRes.items) && jobsRes.items.length > 0 && isMounted) {
            const transformed = jobsRes.items.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
            setJobs(transformed);
            fetchedJobsCount = transformed.length;
          }
        } catch (jobsErr) {
          console.debug("[Dashboard] GET /api/jobs fallback notice:", jobsErr?.message);
        }

        // 3. Fallback to Local Storage or Ngrok API only if GET /api/jobs returned 0 items
        if (fetchedJobsCount === 0) {
          const storedMatches = getStoredJobMatches();
          let loadedMatches = [];

          if (Array.isArray(storedMatches) && storedMatches.length > 0) {
            loadedMatches = storedMatches;
          } else if (
            Array.isArray(onboardingState?.matches) &&
            onboardingState.matches.length > 0
          ) {
            loadedMatches = onboardingState.matches;
          }

          if (loadedMatches.length > 0) {
            const transformed = loadedMatches
              .map((m, idx) => transformMatchToJob(m, idx))
              .filter(Boolean);

            // Deduplicate jobs by unique ID
            const uniqueJobs = [];
            const seenIds = new Set();
            for (const j of transformed) {
              const jid = j.job_id || j.id;
              if (jid && !seenIds.has(jid)) {
                seenIds.add(jid);
                uniqueJobs.push(j);
              } else if (!jid) {
                uniqueJobs.push(j);
              }
            }

            if (isMounted) {
              setJobs(uniqueJobs);
              const last = uniqueJobs[uniqueJobs.length - 1];
              if (last?.job_id || last?.id) {
                setLastJobId(last.job_id || last.id);
              }
            }
          } else {
            // If user has a resume but no stored matches, fetch jobs dynamically from Ngrok API
            const resumeIdVal = activeResumeId || getStoredResumeId();
            if (resumeIdVal) {
              try {
                const result = await getMoreJobsForResume({
                  N: 10,
                  LastJDid: "",
                  top_k: 1000,
                  ResumeID: resumeIdVal,
                });
                if (
                  result &&
                  Array.isArray(result.matches) &&
                  result.matches.length > 0
                ) {
                  const transformed = result.matches
                    .map((m, idx) => transformMatchToJob(m, idx))
                    .filter(Boolean);
                  if (isMounted) {
                    setJobs(transformed);
                    const last = transformed[transformed.length - 1];
                    if (last?.job_id || last?.id) {
                      setLastJobId(last.job_id || last.id);
                    }
                  }
                }
              } catch (apiErr) {
                console.warn("[Dashboard] Could not auto-fetch jobs:", apiErr);
              }
            }
          }
        }
      } catch (err) {
        console.warn("[Dashboard] Error loading dashboard data:", err);
        if (isMounted) setJobError(err?.message || "Failed to load job matches.");
      } finally {
        if (isMounted) setIsLoadingJobs(false);
      }
    };

    loadDashboardData();

    const handleMatchesUpdated = (e) => {
      if (!isMounted) return;
      if (Array.isArray(e?.detail) && e.detail.length > 0) {
        const transformed = e.detail
          .map((m, idx) => transformMatchToJob(m, idx))
          .filter(Boolean);
        const uniqueJobs = [];
        const seenIds = new Set();
        for (const j of transformed) {
          const jid = j.job_id || j.id;
          if (jid && !seenIds.has(jid)) {
            seenIds.add(jid);
            uniqueJobs.push(j);
          } else if (!jid) {
            uniqueJobs.push(j);
          }
        }
        setJobs(uniqueJobs);
        setHasResume(true);
      } else {
        loadDashboardData();
      }
    };

    window.addEventListener("jobMatchesUpdated", handleMatchesUpdated);
    window.addEventListener("storage", handleMatchesUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("jobMatchesUpdated", handleMatchesUpdated);
      window.removeEventListener("storage", handleMatchesUpdated);
    };
  }, []);

  // Listen for user applications updates
  useEffect(() => {
    const handleApplicationsUpdated = () => {
      try {
        const stored =
          localStorage.getItem("trackerApplications") ||
          sessionStorage.getItem("trackerApplications") ||
          localStorage.getItem("appliedJobs") ||
          sessionStorage.getItem("appliedJobs");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setApplications(parsed);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("applicationsUpdated", handleApplicationsUpdated);
    window.addEventListener("storage", handleApplicationsUpdated);
    return () => {
      window.removeEventListener("applicationsUpdated", handleApplicationsUpdated);
      window.removeEventListener("storage", handleApplicationsUpdated);
    };
  }, []);

  // Handle Close Modal on Escape and Click Outside
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

  // Filter Clear Handler
  const handleClear = () => {
    setSearchQuery("");
    setSelectedDate("All time");
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

  // Dynamic Filter Options Derived Directly From Loaded API Jobs
  const dynamicCompanyOptions = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      if (j.company && j.company !== "Hiring Organization") {
        set.add(j.company);
      }
    });
    return Array.from(set);
  }, [jobs]);

  const dynamicRoleOptions = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      if (j.title && !j.title.startsWith("Position #")) {
        set.add(j.title);
      }
    });
    return Array.from(set);
  }, [jobs]);

  const dynamicLocationOptions = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      if (j.location && j.location !== "Remote / Flexible") {
        set.add(j.location);
      }
    });
    return Array.from(set);
  }, [jobs]);

  // Filter jobs based on active search and filter options
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = job.title?.toLowerCase().includes(q);
        const matchComp = job.company?.toLowerCase().includes(q);
        const matchLoc = job.location?.toLowerCase().includes(q);
        const matchDesc = job.description?.toLowerCase().includes(q);
        const matchSkills =
          Array.isArray(job.requiredSkills) &&
          job.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchComp && !matchLoc && !matchDesc && !matchSkills) {
          return false;
        }
      }

      if (selectedWorkplace.length > 0) {
        if (
          !selectedWorkplace.some((w) =>
            job.workMode?.toLowerCase().includes(w.toLowerCase())
          )
        ) {
          return false;
        }
      }

      if (selectedCompanies.length > 0) {
        if (
          !selectedCompanies.some((c) =>
            job.company?.toLowerCase().includes(c.toLowerCase())
          )
        ) {
          return false;
        }
      }

      if (selectedLocations.length > 0) {
        if (
          !selectedLocations.some((l) =>
            job.location?.toLowerCase().includes(l.toLowerCase())
          )
        ) {
          return false;
        }
      }

      if (selectedRoles.length > 0) {
        if (
          !selectedRoles.some((r) =>
            job.title?.toLowerCase().includes(r.toLowerCase())
          )
        ) {
          return false;
        }
      }

      if (selectedJobTypes.length > 0) {
        if (
          !selectedJobTypes.some((t) =>
            (job.type || "").toLowerCase().includes(t.toLowerCase())
          )
        ) {
          return false;
        }
      }

      if (selectedEmploymentTypes.length > 0) {
        if (
          !selectedEmploymentTypes.some((t) =>
            (job.type || job.employmentType || job.employment_type || "")
              .toLowerCase()
              .includes(t.toLowerCase())
          )
        ) {
          return false;
        }
      }

      if (sponsorsVisa) {
        const visa = job.sponsorsVisa || job.visa_sponsorship || job.rawMatch?.sponsorsVisa;
        if (!visa) {
          // If visa requirement is toggled, check if description mentions visa/sponsorship
          const desc = (job.description || job.fullJdText || "").toLowerCase();
          if (!desc.includes("visa") && !desc.includes("sponsor")) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    jobs,
    searchQuery,
    selectedWorkplace,
    selectedCompanies,
    selectedLocations,
    selectedRoles,
    selectedJobTypes,
    selectedEmploymentTypes,
    sponsorsVisa,
  ]);

  // Dynamic Dashboard Statistics Cards (From GET /api/dashboard & GET /api/resumes/matches/status)
  const statsCards = useMemo(() => {
    // 1. Jobs Found
    const jobsFoundVal =
      typeof
      typeof matchStatus?.matchCount === "number" && matchStatus.matchCount > 0
        ? matchStatus.matchCount
        : (dashboardMetrics?.jobsFound === "number"
        ? dashboardMetrics.jobsFound
        : jobs.length > 0
        ? jobs.length
        : 0);

    // 2. Qualified Matches
    const qualifiedMatchesVal =
      typeof dashboardMetrics?.qualifiedMatches === "number"
        ? dashboardMetrics.qualifiedMatches
        : jobs.filter((j) => (j.matchPercent || 0) >= 80).length;

    // 3. Allowance (for supporting text & limits)
    const allowanceVal =
      typeof dashboardMetrics?.applicationAllowance === "number"
        ? dashboardMetrics.applicationAllowance
        : typeof billingInfo?.applicationAllowance === "number"
        ? billingInfo.applicationAllowance
        : typeof billingInfo?.applicationLimit === "number"
        ? billingInfo.applicationLimit
        : 100;

    const submittedVal =
      typeof dashboardMetrics?.applicationsSubmitted === "number"
        ? dashboardMetrics.applicationsSubmitted
        : typeof billingInfo?.usedApplications === "number"
        ? billingInfo.usedApplications
        : typeof billingInfo?.applicationsUsed === "number"
        ? billingInfo.applicationsUsed
        : applications.length;

    const remainingVal =
      typeof dashboardMetrics?.applicationsRemaining === "number"
        ? dashboardMetrics.applicationsRemaining
        : typeof billingInfo?.remainingApplications === "number"
        ? billingInfo.remainingApplications
        : Math.max(0, allowanceVal - submittedVal);

    return [
      {
        id: "jobs-found",
        title: "Jobs Found",
        value: Number(jobsFoundVal).toLocaleString(),
        supportingText: matchStatus?.lastComputedAt
          ? `Computed ${formatMatchTime(matchStatus.lastComputedAt)}`
          : jobsFoundVal > 0
            ? "New jobs in the last 7 days"
            : matchStatus?.hasPrimaryResume === false
              ? "Primary resume required"
              : hasResume
                ? "No matches found"
                : "Upload resume to find matches",
        iconBg: "#EFF6FF",
        icon: dashboard1Icon,
      },
      {
        id: "qualified-matches",
        title: "Qualified Matches",
        value: Number(qualifiedMatchesVal).toLocaleString(),
        supportingText: "Jobs with good ATS match",
        iconBg: "#ECFEFF",
        icon: dashboard2Icon,
      },
      {
        id: "applications-submitted",
        title: "Applications Submitted",
        value: Number(submittedVal).toLocaleString(),
        supportingText: `Out of ${allowanceVal} monthly limit`,
        iconBg: "#FAF5FF",
        icon: dashboard3Icon,
      },
      {
        id: "applications-remaining",
        title: "Applications Remaining",
        value: Number(remainingVal).toLocaleString(),
        supportingText: "This month",
        iconBg: "#F0FDFA",
        icon: dashboard4Icon,
      },
    ];
  }, [matchStatus, dashboardMetrics, jobs, billingInfo, applications, hasResume]);

  // Dynamic Application Tabs with Counts
  const applicationTabs = useMemo(() => {
    const counts = {
      All: applications.length,
      Submitted: 0,
      "In Progress": 0,
      "Needs Action": 0,
      Failed: 0,
      Skipped: 0,
    };

    applications.forEach((app) => {
      const status = app.statusCategory || app.status || "Submitted";
      if (counts[status] !== undefined) {
        counts[status] += 1;
      } else {
        counts.Submitted += 1;
      }
    });

    return [
      { name: "All", count: counts.All },
      { name: "Submitted", count: counts.Submitted },
      { name: "In Progress", count: counts["In Progress"] },
      { name: "Needs Action", count: counts["Needs Action"] },
      { name: "Failed", count: counts.Failed },
      { name: "Skipped", count: counts.Skipped },
    ];
  }, [applications]);

  // Filtered Applications Table List
  const filteredApplications = useMemo(() => {
    if (selectedAppTab === "All") return applications;
    return applications.filter(
      (app) =>
        (app.statusCategory || app.status || "Submitted") === selectedAppTab
    );
  }, [applications, selectedAppTab]);

  // Enhance Resume Action Handler (POST /api/jobs/{jobId}/enhance -> GET /api/jobs/{jobId}/enhance)
  const handleEnhanceResume = async () => {
    if (isEnhancing || !selectedJobModal) return;
    setEnhanceError(null);
    setEnhanceSuccess(null);

    const selectedJobId = getJobId(selectedJobModal);

    if (!selectedJobId) {
      setEnhanceError("Job ID is missing. Please select a valid job to enhance.");
      return;
    }

    try {
      setIsEnhancing(true);

      const result = await getEnhancedResume(selectedJobId);
      console.log("[Dashboard] Enhance Resume Result:", result);

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
      console.error("[Dashboard] Enhance Resume Error:", err);
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

  const handleDownloadEnhancedResume = (text, job) => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const jobTitle = (job?.title || "Enhanced_Resume").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.download = `${jobTitle}_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      const response = await getScoreForEnhancedResume(payload);
      const rawScore =
        response?.EnhATS ??
        response?.score_data?.overall_score ??
        response?.score;
      if (rawScore !== undefined && rawScore !== null && !isNaN(Number(rawScore))) {
        const parsedScore = Math.min(
          100,
          Math.max(1, Math.round(Number(rawScore)))
        );
        setUpdatedAtsScores((prev) => ({
          ...prev,
          [jobId]: parsedScore,
        }));
      }
    } catch (err) {
      console.error("[Dashboard] Error calculating updated ATS score:", err);
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Dashboard Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">

          {/* Welcome Header & Match Status Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
                Welcome back, {userName || "User"}!
              </h1>
              <p className="text-[13px] text-[#64748B]">
                Your job search is running. We're finding, matching and applying to the best opportunities for you.
              </p>
            </div>

          </div>

          {/* Conditional Match Status Banner: No Primary Resume */}
          {matchStatus.hasPrimaryResume === false && (
            <div className="w-full p-4 rounded-[16px] bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5 sm:mt-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Primary Resume Required</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    No primary resume detected. Please set or upload a primary resume in your profile to enable automated ATS matching and job recommendations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                Go to Profile & Resumes
              </button>
            </div>
          )}

          {/* Conditional Match Status Banner: Live Refreshing Progress */}
          {matchStatus.refreshing && (
            <div className="w-full p-4.5 rounded-[18px] bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/90 border border-indigo-200/80 shadow-xs flex flex-col gap-2.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] shrink-0">
                    <svg className="w-4.5 h-4.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#0F172A]">ATS Job Matching In Progress</h3>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                        Scanning Live
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5 truncate">
                      {matchStatus.progress || "Fetching and scoring matching jobs from ATS..."}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center text-xs font-medium text-indigo-600 bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-xs shrink-0">
                  Polling updates...
                </div>
              </div>
              <div className="w-full bg-indigo-100/70 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#6366F1] h-1.5 rounded-full animate-pulse w-3/4 transition-all duration-500" />
              </div>
            </div>
          )}

          {/* 1. Dashboard Statistics Cards (Dynamic From API) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
            {statsCards.map((card) => (
              <div
                key={card.id}
                className="p-5 rounded-[20px] bg-white border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex items-center gap-4 transition-all duration-200 hover:shadow-md"
              >
                {/* Icon Box */}
                <div
                  className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: card.iconBg }}
                >
                  <img
                    src={card.icon}
                    alt={card.title}
                    className="w-[24px] h-[24px] object-contain"
                  />
                </div>

                {/* Text Content */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-medium text-[#64748B] truncate">
                    {card.title}
                  </span>
                  <span className="text-[26px] font-bold text-[#0F172A] tracking-tight leading-tight my-0.5">
                    {card.value}
                  </span>
                  <span className="text-[12px] text-[#94A3B8] truncate">
                    {card.supportingText}
                  </span>
                </div>
              </div>
            ))}
          </div>



          {/* 4. Recent Applications Section (Dynamic From API / Applications State) */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-5 w-full mt-2">

            {/* Header: Title */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-[18px] md:text-[20px] font-bold text-[#0F172A] tracking-tight">
                Applications
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {applicationTabs.map((tab) => {
                const isActive = selectedAppTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => setSelectedAppTab(tab.name)}
                    className={`h-[34px] px-3.5 rounded-full text-[12.5px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${isActive
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-slate-200"
                      }`}
                  >
                    <span>{tab.name}</span>
                    <span
                      className={isActive ? "text-slate-300" : "text-[#94A3B8]"}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Applications Table or Dynamic Empty State */}
            {filteredApplications.length === 0 ? (
              <div className="p-8 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center gap-2.5 my-2">
                <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  No Applications Yet
                </h3>
                <p className="text-xs text-[#64748B] max-w-sm">
                  You haven't submitted any job applications yet. Auto-apply to matched jobs or apply manually to start tracking them here.
                </p>
                {filteredJobs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate("/auto-apply")}
                    className="mt-1 px-4 py-2 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-[10px] shadow-xs transition-colors cursor-pointer"
                  >
                    Start Auto-Apply
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[750px]">
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
                    {filteredApplications.map((app) => (
                      <tr
                        key={app.id || app.job_id || Math.random()}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                        onClick={() => handleOpenJobModal(app)}
                      >
                        {/* Company */}
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[28px] h-[28px] rounded-[6px] bg-white flex items-center justify-center shrink-0 border border-slate-100 p-1">
                              <img
                                src={app.logo || aiLogo}
                                alt={app.company}
                                className="w-[20px] h-[20px] object-contain"
                              />
                            </div>
                            <span className="text-[14px] font-bold text-[#0F172A]">
                              {app.company}
                            </span>
                          </div>
                        </td>

                        {/* Job Title */}
                        <td className="py-4 px-3 text-[13.5px] font-medium text-[#334155]">
                          {app.jobTitle || app.title}
                        </td>

                        {/* ATS Match */}
                        <td className="py-4 px-3">
                          <span
                            className={`text-[13px] font-bold ${(app.matchPercent || 0) >= 80
                                ? "text-[#059669]"
                                : (app.matchPercent || 0) >= 60
                                  ? "text-[#D97706]"
                                  : "text-[#4F46E5]"
                              }`}
                          >
                            {app.atsMatch || `${app.matchPercent || 0}%`}
                          </span>
                        </td>

                        {/* Resume */}
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-1.5">
                            <DocumentIcon color="#6366F1" />
                            <span className="text-[13px] font-medium text-[#6366F1]">
                              {app.resume || "Tailored"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${app.status === "Submitted"
                                  ? "bg-[#059669]"
                                  : app.status === "In Progress"
                                    ? "bg-[#2563EB]"
                                    : app.status === "Failed"
                                      ? "bg-[#DC2626]"
                                      : "bg-[#D97706]"
                                }`}
                            />
                            <span
                              className={`text-[13px] font-medium ${app.status === "Submitted"
                                  ? "text-[#059669]"
                                  : app.status === "In Progress"
                                    ? "text-[#2563EB]"
                                    : app.status === "Failed"
                                      ? "text-[#DC2626]"
                                      : "text-[#D97706]"
                                }`}
                            >
                              {app.status || "Submitted"}
                            </span>
                          </div>
                        </td>

                        {/* Applied */}
                        <td className="py-4 px-3 text-[13px] text-[#64748B]">
                          {app.applied || "Recently"}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-3 text-right pr-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenJobModal(app);
                            }}
                            className="h-[30px] px-3.5 rounded-[8px] border border-[#E2E8F0] bg-white text-[12.5px] font-medium text-[#334155] hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Job Details Right Side Drawer Popup */}
      {selectedJobModal && (() => {
        const selectedJobId = getJobId(selectedJobModal);
        const currentMatch =
          selectedJobModal.rawMatch ||
          jobs.find((j) => getJobId(j) === selectedJobId)?.rawMatch ||
          null;

        const rawInitialScore =
          typeof currentMatch?.overall_score === "number"
            ? currentMatch.overall_score
            : typeof currentMatch?.score_data?.overall_score === "number"
              ? currentMatch.score_data.overall_score
              : typeof currentMatch?.score === "number"
                ? currentMatch.score
                : (typeof currentMatch?.overall_score === "string" && !isNaN(Number(currentMatch.overall_score)) && currentMatch.overall_score.trim() !== "")
                  ? Number(currentMatch.overall_score)
                  : typeof selectedJobModal.rawScore === "number"
                    ? selectedJobModal.rawScore
                    : typeof selectedJobModal.matchPercent === "number"
                      ? selectedJobModal.matchPercent
                      : null;

        const activeAtsScore =
          selectedJobId && updatedAtsScores[selectedJobId] !== undefined
            ? updatedAtsScores[selectedJobId]
            : rawInitialScore !== null && !isNaN(rawInitialScore)
              ? Math.min(100, Math.max(1, Math.round(Number(rawInitialScore))))
              : null;

        const scoreData =
          currentMatch?.score_data || selectedJobModal.scoreData || null;
        const missingKeywords = Array.isArray(scoreData?.missing_keywords)
          ? scoreData.missing_keywords.filter(Boolean)
          : [];
        const missingRequiredSkills = Array.isArray(
          scoreData?.missing_required_skills
        )
          ? scoreData.missing_required_skills.filter(Boolean)
          : [];
        const missingPreferredSkills = Array.isArray(
          scoreData?.missing_preferred_skills
        )
          ? scoreData.missing_preferred_skills.filter(Boolean)
          : [];

        return (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
              onClick={() => setSelectedJobModal(null)}
            />

            {/* Side Drawer Container */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-[490px] bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">

                {/* Drawer Header */}
                <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-white">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-2">
                    <div className="w-[46px] h-[46px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2 mt-0.5">
                      <img
                        src={selectedJobModal.logo || aiLogo}
                        alt={extractCleanCompany(
                          selectedJobModal.company,
                          selectedJobModal.description || selectedJobModal.fullJdText
                        )}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight leading-snug break-words">
                        {extractCleanJobTitle(
                          selectedJobModal.title || selectedJobModal.jobTitle,
                          selectedJobModal.description || selectedJobModal.fullJdText
                        )}
                      </h2>

                      <div className="flex items-center gap-1.5 text-[13.5px] text-[#475569] font-medium mt-1">
                        <span className="truncate">
                          {extractCleanCompany(
                            selectedJobModal.company,
                            selectedJobModal.description ||
                            selectedJobModal.fullJdText
                          )}
                        </span>
                        <VerifiedTick />
                      </div>

                      <div className="flex items-center gap-2.5 text-[12px] text-[#64748B] mt-2 flex-wrap">
                        <span>
                          {cleanHtmlText(
                            selectedJobModal.fullLocation ||
                            selectedJobModal.location
                          )}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          {cleanHtmlText(
                            selectedJobModal.type || "Full-time"
                          )}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          {cleanHtmlText(
                            selectedJobModal.workMode || "On-site"
                          )}
                        </span>
                      </div>
                      <div className="text-[12px] text-[#64748B] mt-1">
                        {cleanHtmlText(
                          selectedJobModal.department || "Engineering"
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions (Close & Enhance Resume) */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
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
                        className="w-5 h-5 stroke-[2]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={handleEnhanceResume}
                      disabled={isEnhancing}
                      className={`mt-2 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap flex items-center gap-1.5 ${isEnhancing
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-[#4F46E5] hover:bg-[#4338CA]"
                        }`}
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
                      ) : enhancedResultsMap[selectedJobId] ? (
                        <>
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Resume Enhanced</span>
                        </>
                      ) : (
                        "Enhance Resume"
                      )}
                    </button>
                  </div>
                </div>

                {/* Drawer Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Error Banner */}
                  {enhanceError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-[12.5px] flex items-start justify-between gap-2 animate-in fade-in">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{enhanceError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnhanceError(null)}
                        className="text-red-400 hover:text-red-600 font-bold ml-2 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Success Banner */}
                  {enhanceSuccess && (
                    <div className="bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] rounded-xl p-3 text-[12.5px] flex items-start justify-between gap-2 animate-in fade-in">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <div>
                          <p className="font-semibold text-[#3730A3]">
                            {enhanceSuccess}
                          </p>
                          <p className="text-[11.5px] text-[#4F46E5] mt-0.5">
                            Resume tailored to bridge skill and keyword gaps for this role.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnhanceSuccess(null)}
                        className="text-[#4F46E5] hover:text-[#3730A3] font-bold ml-2 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* AI Enhanced Resume Card */}
                  {enhancedResultsMap[selectedJobId] && (
                    <div className="rounded-[16px] border border-[#C7D2FE] bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-slate-50 p-4.5 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#4F46E5] text-white flex items-center justify-center text-xs font-bold">
                            AI
                          </div>
                          <h4 className="text-[14px] font-bold text-[#0F172A]">
                            AI Enhanced Resume
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] px-2.5 py-0.5 rounded-full">
                          Job-Tailored
                        </span>
                      </div>

                      {/* Bridgeable Gaps */}
                      {enhancedResultsMap[selectedJobId]?.bridgeable_gaps && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-slate-800">
                              Bridged Keywords & Gaps:
                            </span>
                            {Array.isArray(
                              enhancedResultsMap[selectedJobId].bridgeable_gaps
                            ) && (
                                <span className="text-[11px] font-semibold text-[#4F46E5] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-full">
                                  {
                                    enhancedResultsMap[selectedJobId]
                                      .bridgeable_gaps.length
                                  }{" "}
                                  Skills Optimized
                                </span>
                              )}
                          </div>
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {Array.isArray(
                              enhancedResultsMap[selectedJobId].bridgeable_gaps
                            ) ? (
                              enhancedResultsMap[
                                selectedJobId
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
                                      <span className="text-[12px] font-semibold text-slate-900">
                                        {gap}
                                      </span>
                                    </div>
                                  );
                                }

                                const skill =
                                  gap?.skill || gap?.name || gap?.title || "";
                                const severity =
                                  gap?.severity ||
                                  (gap?.source
                                    ? String(gap.source).toUpperCase()
                                    : "");
                                const rationale =
                                  gap?.rationale ||
                                  gap?.description ||
                                  gap?.reason ||
                                  "";

                                return (
                                  <div
                                    key={i}
                                    className="bg-white text-slate-800 border border-[#E0E7FF] rounded-xl p-2.5 shadow-2xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">
                                          ✓
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-900 truncate">
                                          {skill || "Optimized Skill"}
                                        </span>
                                      </div>
                                      {severity && (
                                        <span
                                          className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${severity === "CRITICAL"
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
                                      <p className="text-[11px] text-slate-600 leading-snug pl-5.5 font-normal">
                                        {rationale}
                                      </p>
                                    )}
                                  </div>
                                );
                              })
                            ) : typeof enhancedResultsMap[selectedJobId]
                              .bridgeable_gaps === "object" ? (
                              Object.entries(
                                enhancedResultsMap[selectedJobId].bridgeable_gaps
                              ).map(([k, v], i) => (
                                <div
                                  key={i}
                                  className="bg-white text-slate-800 border border-[#E0E7FF] rounded-xl p-2.5 shadow-2xs space-y-1"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">
                                      ✓
                                    </span>
                                    <span className="text-[12px] font-bold text-slate-900">
                                      {k}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-snug pl-5.5 font-normal">
                                    {String(v)}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-[12px] text-slate-600">
                                {String(
                                  enhancedResultsMap[selectedJobId]
                                    .bridgeable_gaps
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Enhanced Resume Preview */}
                      {(enhancedResultsMap[selectedJobId]?.EnhResume ||
                        enhancedResultsMap[selectedJobId]?.enhResume ||
                        enhancedResultsMap[selectedJobId]?.enhanced_resume) && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[12px] font-semibold text-slate-700">Enhanced Resume Preview:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyEnhancedResume(
                                    enhancedResultsMap[selectedJobId]?.EnhResume ||
                                    enhancedResultsMap[selectedJobId]?.enhResume ||
                                    enhancedResultsMap[selectedJobId]?.enhanced_resume
                                  )
                                }
                                className="text-[11.5px] font-medium text-[#4F46E5] hover:text-[#3730A3] flex items-center gap-1 cursor-pointer"
                              >
                                {copiedResume ? "✓ Copied" : "Copy Text"}
                              </button>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto pr-0.5">
                              <EnhancedResumeViewer
                                resumeText={
                                  enhancedResultsMap[selectedJobId]?.EnhResume ||
                                  enhancedResultsMap[selectedJobId]?.enhResume ||
                                  enhancedResultsMap[selectedJobId]?.enhanced_resume ||
                                  enhancedResultsMap[selectedJobId]?.enhancedResume
                                }
                                compact={true}
                              />
                            </div>
                          </div>
                        )}

                      <button
                        type="button"
                        onClick={() => setShowEnhancedModal(true)}
                        className="w-full py-2 bg-white hover:bg-indigo-50/50 border border-[#C7D2FE] text-[#4F46E5] text-[12px] font-semibold rounded-xl transition-colors cursor-pointer text-center"
                      >
                        View Full Enhanced Resume
                      </button>
                    </div>
                  )}


                  {/* ATS Match Box */}
                  <div className="rounded-[16px] border border-slate-200/80 bg-[#F8FAFC]/70 p-4.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-[68px] h-[68px] shrink-0 flex items-center justify-center">
                        <svg
                          className="w-full h-full -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            className="text-slate-200"
                            strokeWidth="3.2"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {activeAtsScore !== null && (
                            <path
                              className="text-[#4F46E5]"
                              strokeDasharray={`${activeAtsScore}, 100`}
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[14px] font-bold text-[#0F172A] leading-none">
                            {activeAtsScore !== null
                              ? `${activeAtsScore}%`
                              : "N/A"}
                          </span>
                          <span className="text-[9px] text-[#64748B] font-medium leading-none mt-0.5">
                            Match
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <h3 className="text-[14.5px] font-bold text-[#0F172A]">
                          ATS Match
                        </h3>
                        <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                          {activeAtsScore !== null
                            ? activeAtsScore >= 80
                              ? "Strong match based on your profile, skills, experience and preferences."
                              : activeAtsScore >= 60
                                ? "Moderate match. Enhancing your resume can bridge key skill and keyword gaps."
                                : "Lower match. Review identified gaps below or click Enhance Resume."
                            : "ATS score unavailable for this job."}
                        </p>
                      </div>
                    </div>

                    {/* Get Updated ATS Button */}
                    {enhancedResultsMap[selectedJobId] && (
                      <button
                        type="button"
                        onClick={handleGetUpdatedAts}
                        disabled={isUpdatingAts}
                        className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold rounded-xl shadow-xs shrink-0 whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
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

                  {/* ATS Identified Gaps */}
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
                    <div className="text-[12.5px] text-[#475569] leading-relaxed mt-1.5 whitespace-pre-line">
                      {cleanHtmlText(
                        selectedJobModal.description ||
                        selectedJobModal.fullJdText ||
                        selectedJobModal.preview
                      )}
                    </div>
                  </div>

                  {/* Key Responsibilities */}
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A]">
                      Key responsibilities:
                    </h3>
                    <ul className="space-y-2 mt-2">
                      {(selectedJobModal.responsibilities || []).map(
                        (resp, idx) => (
                          <li
                            key={idx}
                            className="text-[12.5px] text-[#475569] flex items-start gap-2 leading-snug"
                          >
                            <span className="text-[#94A3B8] shrink-0">•</span>
                            <span>{resp}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A]">
                      Required skills
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(selectedJobModal.requiredSkills || []).map((skill) => (
                        <span
                          key={skill}
                          className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Skills */}
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A]">
                      Preferred skills
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(selectedJobModal.preferredSkills || []).map((skill) => (
                        <span
                          key={skill}
                          className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A] mb-2.5">
                      Job details
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      <div className="flex flex-col text-[12.5px]">
                        <span className="text-[#64748B]">Experience</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5">
                          {selectedJobModal.experience}
                        </span>
                      </div>
                      <div className="flex flex-col text-[12.5px]">
                        <span className="text-[#64748B]">Work mode</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5">
                          {selectedJobModal.workMode}
                        </span>
                      </div>
                      <div className="flex flex-col text-[12.5px]">
                        <span className="text-[#64748B]">Employment type</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5">
                          {selectedJobModal.type}
                        </span>
                      </div>
                      <div className="flex flex-col text-[12.5px]">
                        <span className="text-[#64748B]">Location</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5">
                          {selectedJobModal.fullLocation}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsJobSaved(!isJobSaved)}
                    className={`flex-1 h-[42px] rounded-[10px] border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${isJobSaved
                      ? "border-[#A5B4FC] bg-indigo-50 text-[#4F46E5]"
                      : "border-[#C7D2FE] bg-white text-[#4F46E5] hover:bg-indigo-50/50"
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
                    className="flex-1 h-[42px] rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Apply now</span>
                    <span>→</span>
                  </button>
                </div>
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
                        enhancedResultsMap[getJobId(selectedJobModal)]?.EnhResume ||
                        enhancedResultsMap[getJobId(selectedJobModal)]?.enhResume ||
                        enhancedResultsMap[getJobId(selectedJobModal)]?.enhanced_resume ||
                        enhancedResultsMap[getJobId(selectedJobModal)]?.enhancedResume,
                        selectedJobModal
                      )
                    }
                    className="px-3.5 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
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
                                    <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">✓</span>
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
                        ) : typeof enhancedResultsMap[getJobId(selectedJobModal)].bridgeable_gaps === "object" ? (
                          Object.entries(enhancedResultsMap[getJobId(selectedJobModal)].bridgeable_gaps).map(([k, v], i) => (
                            <div
                              key={i}
                              className="bg-white text-slate-800 border border-[#E0E7FF] rounded-xl p-3 shadow-2xs space-y-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">✓</span>
                                <span className="text-xs font-bold text-slate-900">{k}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed pl-6 font-normal">
                                {String(v)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#4F46E5]">{String(enhancedResultsMap[getJobId(selectedJobModal)].bridgeable_gaps)}</p>
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

export default Dashboard;