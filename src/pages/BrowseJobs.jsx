import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getMoreJobsForResume, getPrimaryResumeId, getOnboardingState } from "../services/api";

import googleLogo from "../assets/google.svg";
import microsoftLogo from "../assets/microsoft.svg";
import amazonLogo from "../assets/amazon.svg";
import shopifyLogo from "../assets/shopify.svg";
import aiLogo from "../assets/ai.svg";
import mapIcon from "../assets/map.svg";
import tickIcon from "../assets/tick.svg";
import {
  getMoreJobs,
  getNMoreJDsForResume,
  getStoredResumeId,
  getStoredJobMatches,
  getEnhancedResume,
  getCandidateId,
  getJobId,
  getScoreForEnhancedResume,
} from "../services/api";

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

const extractCleanJobTitle = (rawTitle, rawText, index = 0) => {
  let title = cleanHtmlText(rawTitle || "");
  const text = cleanHtmlText(rawText || "");

  if (
    title &&
    title.length <= 55 &&
    !title.toLowerCase().startsWith("the ") &&
    !title.toLowerCase().includes("is looking for") &&
    !title.toLowerCase().includes("we are looking") &&
    !title.toLowerCase().includes("team is seeking") &&
    !title.includes("\n")
  ) {
    return title;
  }

  const candidateText = title || text;
  if (candidateText) {
    const lookingMatch = candidateText.match(
      /(?:is\s+looking\s+for\s+(?:a|an)?|we\s+are\s+looking\s+for\s+(?:a|an)?|seeking\s+(?:a|an)?|hiring\s+(?:a|an)?)\s+([A-Z][A-Za-z0-9\s\-/+(),&]+?)(?:\s+to|\s+who|\s+in|\s+at|\s+with|[.,;\n\r]|$)/i
    );
    if (lookingMatch && lookingMatch[1] && lookingMatch[1].trim().length >= 3 && lookingMatch[1].trim().length <= 60) {
      return lookingMatch[1].trim();
    }

    const explicitMatch = candidateText.match(
      /(?:job\s+title|title|role|position)\s*[:-]\s*([^\n\r,;.]+)/i
    );
    if (explicitMatch && explicitMatch[1] && explicitMatch[1].trim().length >= 3 && explicitMatch[1].trim().length <= 60) {
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
    if (firstLine && firstLine.length <= 50 && !firstLine.toLowerCase().includes("http")) {
      return firstLine;
    }
  }

  return `Position #${index + 1}`;
};

const extractCleanCompany = (rawCompany, rawText) => {
  let company = cleanHtmlText(rawCompany || "");
  const text = cleanHtmlText(rawText || "");

  if (company && company.length <= 40 && !company.toLowerCase().includes("hiring") && !company.includes("\n")) {
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

    const compMatch = candidateText.match(/(?:company|organization|employer|at)\s*[:-]\s*([A-Za-z0-9\s&.,'-]+)/i);
    if (compMatch && compMatch[1] && compMatch[1].trim().length <= 35) {
      return compMatch[1].trim();
    }
  }

  return company || "Hiring Organization";
};

const transformMatchToJob = (match, index = 0) => {
  if (!match) return null;

  const rawText = match.full_jd_text || match.preview || match.description || "";
  const cleanedFullText = cleanHtmlText(rawText);

  const title = extractCleanJobTitle(match.title || match.job_title || match.role, rawText, index);
  const company = extractCleanCompany(match.company || match.company_name, rawText);

  const rawScore =
    typeof match.overall_score === "number"
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

  // Pick logo based on company
  let logo = aiLogo;
  const compLower = company.toLowerCase();
  if (compLower.includes("google")) logo = googleLogo;
  else if (compLower.includes("microsoft")) logo = microsoftLogo;
  else if (compLower.includes("amazon") || compLower.includes("luna")) logo = amazonLogo;
  else if (compLower.includes("shopify")) logo = shopifyLogo;

  // Location
  let location = cleanHtmlText(match.location || match.city || "");
  if (!location && cleanedFullText) {
    const locMatch = cleanedFullText.match(/(?:location|place|city)\s*[:-]\s*([^\n\r]+)/i);
    if (locMatch && locMatch[1] && locMatch[1].trim().length <= 40) {
      location = locMatch[1].trim();
    }
  }
  if (!location) {
    location = "Remote / Flexible";
  }

  // Skills
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

  let description = cleanHtmlText(match.description || match.preview || (match.full_jd_text ? match.full_jd_text.slice(0, 400) + "..." : ""));
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
      .filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*") || (l.length > 25 && l.length < 200));
    if (lines.length > 0) {
      responsibilities = lines.slice(0, 6).map((l) => l.replace(/^[•\-*]\s*/, ""));
    }
  }

  return {
    id: match.job_id || match.id || `match-${index + 1}`,
    job_id: match.job_id || match.id || `match-${index + 1}`,
    JDid: match.job_id || match.id || `match-${index + 1}`,
    title,
    company,
    location,
    fullLocation: cleanHtmlText(match.fullLocation || location),
    type: cleanHtmlText(match.type || match.employment_type || "Full-time"),
    workMode: cleanHtmlText(match.workMode || match.work_mode || (location.toLowerCase().includes("remote") ? "Remote" : "On-site")),
    department: cleanHtmlText(match.department || "Engineering"),
    posted: cleanHtmlText(match.posted || "Recent match"),
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

const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-[14px] h-[14px] object-contain shrink-0"
  />
);

const BrowseJobs = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isJobSaved, setIsJobSaved] = useState(false);

  // Dynamic Jobs State (loaded from storage if available, fallback to empty array)
  const [jobsList, setJobsList] = useState(() => {
    try {
      const stored = getStoredJobMatches();
      if (Array.isArray(stored) && stored.length > 0) {
        const transformed = stored.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
        if (transformed.length > 0) return transformed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);

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

  // Listen for jobMatches updates across the application & fetch dynamic jobs on mount if needed
  useEffect(() => {
    const handleJobMatchesUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        const transformed = e.detail.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
        if (transformed.length > 0) {
          setJobsList(transformed);
        }
      }
    };

    window.addEventListener("jobMatchesUpdated", handleJobMatchesUpdated);

    // Initial fetch if list is empty and user has a resume uploaded
    const resumeId = getStoredResumeId();
    if (jobsList.length === 0 && resumeId) {
      setIsLoadingJobs(true);
      getMoreJobs({
        N: 10,
        LastJDid: '',
        top_k: 1000,
        ResumeID: resumeId,
      })
        .then((data) => {
          if (data && Array.isArray(data.matches) && data.matches.length > 0) {
            const transformed = data.matches
              .map((m, idx) => transformMatchToJob(m, idx))
              .filter(Boolean);
            if (transformed.length > 0) {
              setJobsList(transformed);
            }
          }
        })
        .catch((err) => {
          console.error('[BrowseJobs] Error loading dynamic jobs on mount:', err);
        })
        .finally(() => {
          setIsLoadingJobs(false);
        });
    }

    return () => {
      window.removeEventListener("jobMatchesUpdated", handleJobMatchesUpdated);
    };
  }, []);

  // Handle Load More Jobs from Backend API (POST /api/v1/Get_N_moreJDs_for_Res)
  const handleLoadMoreJobs = async () => {
    if (isLoadingMore || !hasMoreJobs) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      // Find the last job ID from the current jobs list
      const lastJob = jobsList[jobsList.length - 1];
      const LastJDid = lastJob ? (lastJob.job_id || lastJob.JDid || lastJob.id || '') : '';
      const ResumeID = getStoredResumeId();

      console.log('[BrowseJobs] Calling Get_N_moreJDs_for_Res with payload:', {
        N: 10,
        LastJDid,
        top_k: 1000,
        ResumeID,
      });

      const data = await getMoreJobs({
        N: 10,
        LastJDid,
        top_k: 1000,
        ResumeID,
      });

      console.log('[BrowseJobs] Get_N_moreJDs_for_Res response:', data);

      if (data && Array.isArray(data.matches) && data.matches.length > 0) {
        const newJobs = data.matches
          .map((m, idx) => transformMatchToJob(m, jobsList.length + idx))
          .filter(Boolean);

        setJobsList((prev) => {
          const existingIds = new Set(prev.map((j) => j.job_id || j.JDid || j.id));
          const fresh = newJobs.filter((j) => !existingIds.has(j.job_id || j.JDid || j.id));
          return [...prev, ...fresh];
        });

        if (data.matches.length < 10) {
          setHasMoreJobs(false);
        }
      } else {
        setHasMoreJobs(false);
        setLoadMoreError('No additional job matches found at this time.');
      }
    } catch (err) {
      console.error('[BrowseJobs] Error loading more jobs:', err);
      setLoadMoreError(err?.message || 'Unable to load more jobs. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Enhance Resume Action Handler
  const handleEnhanceResume = async () => {
    if (isEnhancing || !selectedJobModal) return;
    setEnhanceError(null);
    setEnhanceSuccess(null);

    const candidateId = getCandidateId();
    const resumeId = getStoredResumeId();
    const selectedJobId = getJobId(selectedJobModal);

    console.log("[BrowseJobs] Triggering Enhance Resume with dynamic IDs:", {
      JDid: selectedJobId,
      Candidateid: candidateId,
      ResumeID: resumeId,
    });

    if (!selectedJobId || !candidateId || !resumeId) {
      const missing = [];
      if (!selectedJobId) missing.push("Job ID (JDid)");
      if (!candidateId) missing.push("Candidate ID (Candidateid)");
      if (!resumeId) missing.push("Resume ID (ResumeID)");

      setEnhanceError(
        `Required information is missing: ${missing.join(", ")}. Please ensure you are logged in and have uploaded a resume.`
      );
      return;
    }

    try {
      setIsEnhancing(true);

      const payload = {
        JDid: selectedJobId,
        Candidateid: candidateId,
        ResumeID: resumeId,
      };

      const result = await getEnhancedResume(payload);
      console.log("[BrowseJobs] Enhance Resume API Response:", result);

      setEnhancedResultsMap((prev) => ({
        ...prev,
        [selectedJobId]: result,
      }));
      setEnhanceSuccess("Resume successfully enhanced for this role!");
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

      const rawScore = response?.EnhATS ?? response?.score_data?.overall_score ?? response?.score;
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

              {/* 2. Location Dropdown */}
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

              {/* 5. Workplace Dropdown */}
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

              {/* 6. Sponsors Visa Button Toggle */}
              <button
                type="button"
                onClick={() => setSponsorsVisa(!sponsorsVisa)}
                className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${sponsorsVisa
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
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "employmentType" || selectedEmploymentTypes.length > 0
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Employment Type</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "employmentType" ? "rotate-180" : ""
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
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "degree" || selectedDegrees.length > 0
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Degree Level</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "degree" ? "rotate-180" : ""
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
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${activeDropdown === "experience" || selectedExperience !== ""
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span>Max Experience</span>
                  <svg
                    className={`w-3 h-3 text-[#94A3B8] transition-transform ${activeDropdown === "experience" ? "rotate-180" : ""
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
                          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${isSelected
                            ? "font-semibold text-[#0F172A] bg-slate-50"
                            : "text-slate-700"
                            }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected
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

          {/* Dynamic Job Cards Grid */}
          {(() => {
            const filteredJobs = jobsList.filter((job) => {
              if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (job.title || "").toLowerCase().includes(q);
                const matchComp = (job.company || "").toLowerCase().includes(q);
                const matchDesc = (job.description || "").toLowerCase().includes(q);
                const matchSkills = (job.requiredSkills || []).some((s) => s.toLowerCase().includes(q));
                if (!matchTitle && !matchComp && !matchDesc && !matchSkills) return false;
              }
              if (selectedLocations.length > 0) {
                const jobLoc = (job.location || job.fullLocation || "").toLowerCase();
                const matchesLoc = selectedLocations.some((loc) => jobLoc.includes(loc.toLowerCase().split(",")[0]));
                if (!matchesLoc) return false;
              }
              if (selectedCompanies.length > 0) {
                const jobComp = (job.company || "").toLowerCase();
                const matchesComp = selectedCompanies.some((comp) => jobComp.includes(comp.toLowerCase()));
                if (!matchesComp) return false;
              }
              if (selectedWorkplace.length > 0) {
                const jobMode = (job.workMode || "").toLowerCase();
                const matchesWorkMode = selectedWorkplace.some((m) => jobMode.includes(m.toLowerCase()));
                if (!matchesWorkMode) return false;
              }
              if (selectedJobTypes.length > 0) {
                const jobType = (job.type || "").toLowerCase();
                const matchesType = selectedJobTypes.some((t) => jobType.includes(t.toLowerCase()));
                if (!matchesType) return false;
              }
              return true;
            });

            return (
              <>
                {isLoadingJobs ? (
                  <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-16 text-center flex flex-col items-center justify-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-[#4F46E5]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <p className="text-[14px] font-medium text-slate-700">Finding matched jobs for your profile...</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-12 text-center flex flex-col items-center justify-center gap-3">
                    {jobsList.length === 0 ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-[#4F46E5] mb-1">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" />
                          </svg>
                        </div>
                        <p className="text-[15px] font-semibold text-slate-800">No matching jobs found yet</p>
                        <p className="text-[13px] text-slate-500 max-w-sm">
                          Upload your resume or click below to discover jobs matched specifically to your skills and experience.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={handleLoadMoreJobs}
                            disabled={isLoadingMore}
                            className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Fetch Matched Jobs
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Go to Dashboard
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[15px] font-semibold text-slate-700">No jobs match your filter criteria.</p>
                        <button
                          type="button"
                          onClick={handleClear}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
                    {filteredJobs.map((job, idx) => (
                      <div
                        key={job.id || job.job_id || `job-${idx}`}
                        onClick={() => setSelectedJobModal(job)}
                        className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(15,23,42,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-200 min-h-[230px] cursor-pointer group"
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
                              className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${job.matchColor || "bg-[#EEF2FF] text-[#4F46E5]"}`}
                            >
                              {job.match || (job.matchPercent ? `${job.matchPercent}% match` : "ATS Match")}
                            </span>
                          </div>

                          {/* Job Title & Company */}
                          <div className="mt-3.5">
                            <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight leading-snug group-hover:text-[#4F46E5] transition-colors">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-1 text-[13px] text-[#64748B] font-normal mt-1">
                              <span>{job.company}</span>
                              <VerifiedTick />
                            </div>
                          </div>

                          {/* Location & Posted Date */}
                          <div className="mt-3 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[12.5px] text-[#64748B]">
                              <img
                                src={mapIcon}
                                alt=""
                                className="w-[10px] h-[12px] object-contain shrink-0"
                              />
                              <span>{job.location}</span>
                            </div>
                            <div className="text-[12px] text-[#94A3B8]">
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
                              setSelectedJobModal(job);
                            }}
                            className="flex-1 h-[36px] rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#334155] hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center"
                          >
                            ViewDetails
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
                    ))}
                  </div>
                )}

                {/* Load More Button & Status */}
                <div className="flex flex-col items-center justify-center pt-4 pb-8 gap-2.5">
                  {loadMoreError && (
                    <div className="text-[13px] text-rose-600 bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg flex items-center gap-2">
                      <span>{loadMoreError}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setHasMoreJobs(true);
                          handleLoadMoreJobs();
                        }}
                        className="underline text-rose-700 font-medium hover:text-rose-900 cursor-pointer ml-1"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {hasMoreJobs ? (
                    <button
                      type="button"
                      onClick={handleLoadMoreJobs}
                      disabled={isLoadingMore}
                      className="h-[44px] px-6 rounded-[12px] bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-[#818CF8] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Fetching matching jobs...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Jobs</span>
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                            +10
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-medium border border-slate-200">
                      All available matched jobs loaded
                    </div>
                  )}
                  <p className="text-[12px] text-[#94A3B8]">
                    Showing {filteredJobs.length} matched jobs based on your resume
                  </p>
                </div>
              </>
            );
          })()}
        </main>
      </div>

      {/* Job Details Modal Popup */}
      {selectedJobModal && (() => {
        const selectedJobId = getJobId(selectedJobModal);
        const activeAtsScore = updatedAtsScores[selectedJobId] ?? selectedJobModal.matchPercent ?? 96;
        const scoreData = selectedJobModal.scoreData || selectedJobModal.rawMatch?.score_data;
        const missingRequiredSkills = scoreData?.missing_required_skills || selectedJobModal.rawMatch?.missing_required_skills || [];
        const missingPreferredSkills = scoreData?.missing_preferred_skills || selectedJobModal.rawMatch?.missing_preferred_skills || [];
        const missingKeywords = scoreData?.missing_keywords || selectedJobModal.rawMatch?.missing_keywords || [];

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 sm:p-6"
            onClick={() => {
              setSelectedJobModal(null);
              setEnhanceError(null);
              setEnhanceSuccess(null);
            }}
          >
            <div
              className="bg-white rounded-[20px] max-w-[540px] w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-2">
                  <div className="w-[44px] h-[44px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2 mt-0.5">
                    <img
                      src={selectedJobModal.logo || aiLogo}
                      alt={selectedJobModal.company}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight leading-snug break-words">
                      {typeof selectedJobModal.title === "string" ? selectedJobModal.title.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : selectedJobModal.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-[13.5px] text-[#475569] font-medium mt-1">
                      <span className="truncate">{selectedJobModal.company}</span>
                      <VerifiedTick />
                    </div>

                    <div className="flex items-center gap-2.5 text-[12px] text-[#64748B] mt-2 flex-wrap">
                      <span>{selectedJobModal.fullLocation || selectedJobModal.location}</span>
                      <span className="text-slate-300">•</span>
                      <span>{selectedJobModal.type || "Full-time"}</span>
                      <span className="text-slate-300">•</span>
                      <span>{selectedJobModal.workMode || "On-site"}</span>
                    </div>
                    <div className="text-[12px] text-[#64748B] mt-1">
                      {selectedJobModal.department || "Software Engineering"}
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    {enhancedResultsMap[selectedJobId] && (
                      <button
                        type="button"
                        onClick={() => setShowEnhancedModal(true)}
                        className="bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#C7D2FE] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        View Enhanced
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleEnhanceResume}
                      disabled={isEnhancing}
                      className="bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-[#818CF8] text-white text-[12.5px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5 active:scale-[0.98] disabled:cursor-not-allowed"
                    >
                      {isEnhancing ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Enhancing...</span>
                        </>
                      ) : enhancedResultsMap[selectedJobId] ? (
                        "Re-enhance"
                      ) : (
                        "Enhance Resume"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Feedback Alerts */}
                {enhanceSuccess && (
                  <div className="bg-[#EEF2FF] border border-[#C7D2FE] text-[#312E81] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span className="font-semibold">{enhanceSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEnhancedModal(true)}
                      className="underline font-bold text-[#4F46E5] hover:text-[#3730A3] cursor-pointer ml-2"
                    >
                      Preview
                    </button>
                  </div>
                )}

                {enhanceError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">!</span>
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
                          strokeDasharray={`${activeAtsScore}, 100`}
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
                      <h3 className="text-[14px] font-bold text-[#0F172A]">ATS Match</h3>
                      <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                        {activeAtsScore >= 80
                          ? "Strong match based on your profile, skills, experience and preferences."
                          : activeAtsScore >= 60
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
                          <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                {(missingRequiredSkills.length > 0 || missingPreferredSkills.length > 0 || missingKeywords.length > 0) && (
                  <div className="rounded-[16px] border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center">!</span>
                        <h4 className="text-[13px] font-bold text-amber-950">ATS Identified Gaps</h4>
                      </div>
                      <span className="text-[10.5px] font-semibold text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full">
                        {missingRequiredSkills.length + missingPreferredSkills.length + missingKeywords.length} Gaps
                      </span>
                    </div>

                    {missingRequiredSkills.length > 0 && (
                      <div>
                        <span className="text-[11.5px] font-semibold text-amber-900 block mb-1.5">Missing Required Skills:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {missingRequiredSkills.map((skill, i) => (
                            <span key={i} className="bg-white border border-amber-200 text-amber-900 text-[11.5px] font-medium px-2.5 py-0.5 rounded-md shadow-2xs">
                              • {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {missingPreferredSkills.length > 0 && (
                      <div>
                        <span className="text-[11.5px] font-semibold text-amber-900 block mb-1.5">Missing Preferred Skills:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {missingPreferredSkills.map((skill, i) => (
                            <span key={i} className="bg-white border border-amber-200 text-amber-900 text-[11.5px] font-medium px-2.5 py-0.5 rounded-md shadow-2xs">
                              • {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {missingKeywords.length > 0 && (
                      <div>
                        <span className="text-[11.5px] font-semibold text-amber-900 block mb-1.5">Missing Keywords:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {missingKeywords.map((kw, i) => (
                            <span key={i} className="bg-white border border-amber-200 text-slate-700 text-[11px] font-normal px-2 py-0.5 rounded-md">
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
                  <h3 className="text-[14px] font-bold text-[#0F172A]">Job description</h3>
                  <p className="text-[12.5px] text-[#475569] leading-relaxed mt-1.5">
                    {cleanHtmlText(selectedJobModal.description || selectedJobModal.fullJdText || selectedJobModal.preview)}
                  </p>
                </div>

                {/* Key Responsibilities */}
                {Array.isArray(selectedJobModal.responsibilities) && selectedJobModal.responsibilities.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A]">Key responsibilities:</h3>
                    <ul className="space-y-2 mt-2">
                      {selectedJobModal.responsibilities.map((resp, idx) => (
                        <li key={idx} className="text-[12.5px] text-[#475569] flex items-start gap-2 leading-snug">
                          <span className="text-[#94A3B8] shrink-0">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Skills */}
                {Array.isArray(selectedJobModal.requiredSkills) && selectedJobModal.requiredSkills.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A]">Required skills</h3>
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
                {Array.isArray(selectedJobModal.preferredSkills) && selectedJobModal.preferredSkills.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A]">Preferred skills</h3>
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
                  <h3 className="text-[14px] font-bold text-[#0F172A] mb-2.5">Job details</h3>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-[#64748B]">Experience</span>
                      <span className="font-semibold text-[#0F172A]">{selectedJobModal.experience}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-[#64748B]">Work mode</span>
                      <span className="font-semibold text-[#0F172A]">{selectedJobModal.workMode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-[#64748B]">Employment type</span>
                      <span className="font-semibold text-[#0F172A]">{selectedJobModal.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-[#64748B]">Location</span>
                      <span className="font-semibold text-[#0F172A]">{selectedJobModal.fullLocation || selectedJobModal.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsJobSaved(!isJobSaved)}
                    className={`flex-1 h-[44px] rounded-[12px] border text-[13.5px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${isJobSaved
                      ? "border-indigo-300 bg-indigo-50 text-[#4F46E5]"
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

      {/* Full Enhanced Resume Modal View */}
      {showEnhancedModal && selectedJobModal && enhancedResultsMap[getJobId(selectedJobModal)] && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] font-bold text-sm">
                  AI
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">AI Enhanced Resume</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Tailored specifically for {selectedJobModal.title} at {selectedJobModal.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyEnhancedResume(
                      enhancedResultsMap[getJobId(selectedJobModal)]?.EnhResume ||
                      enhancedResultsMap[getJobId(selectedJobModal)]?.enhResume ||
                      enhancedResultsMap[getJobId(selectedJobModal)]?.enhanced_resume
                    )
                  }
                  className="px-3.5 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copiedResume ? "Copied!" : "Copy Resume"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEnhancedModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Bridged Gaps Summary */}
              {enhancedResultsMap[getJobId(selectedJobModal)]?.bridgeable_gaps && (
                <div className="bg-[#EEF2FF]/70 border border-[#C7D2FE] rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#312E81] uppercase tracking-wide">
                      Bridged Skills & Qualifications
                    </h4>
                    {Array.isArray(enhancedResultsMap[getJobId(selectedJobModal)].bridgeable_gaps) && (
                      <span className="text-[11px] font-semibold text-[#4F46E5] bg-white border border-[#C7D2FE] px-2 py-0.5 rounded-full">
                        {enhancedResultsMap[getJobId(selectedJobModal)].bridgeable_gaps.length} Tailored Improvements
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {Array.isArray(enhancedResultsMap[getJobId(selectedJobModal)].bridgeable_gaps) ? (
                      enhancedResultsMap[getJobId(selectedJobModal)].bridgeable_gaps.map((gap, i) => {
                        if (typeof gap === "string") {
                          return (
                            <div key={i} className="flex items-center gap-2 bg-white text-slate-800 border border-[#E0E7FF] rounded-lg p-2.5 shadow-2xs">
                              <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">✓</span>
                              <span className="text-xs font-semibold text-slate-900">{gap}</span>
                            </div>
                          );
                        }

                        const skill = gap?.skill || gap?.name || gap?.title || "";
                        const severity = gap?.severity || (gap?.source ? String(gap.source).toUpperCase() : "");
                        const rationale = gap?.rationale || gap?.description || gap?.reason || "";

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

              {/* Enhanced Resume Content */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Enhanced Resume Text
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed select-text">
                  {enhancedResultsMap[getJobId(selectedJobModal)]?.EnhResume ||
                    enhancedResultsMap[getJobId(selectedJobModal)]?.enhResume ||
                    enhancedResultsMap[getJobId(selectedJobModal)]?.enhanced_resume ||
                    "No enhanced resume text content returned."}
                </div>
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
