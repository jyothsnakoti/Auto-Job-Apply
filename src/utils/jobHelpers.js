import { getJobs, getPrimaryResumeId } from "../services/jobService.js";
import { getOnboardingState } from "../services/onboardingService.js";
import { checkUserHasResume } from "../services/resumeService.js";
import { getStoredResumeId } from "../services/enhanceResumeService.js";
import { extractNumericJobId } from "../services/applicationService.js";

export const cleanHtmlText = (text) => {
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

export const formatPostedDate = (postedAt) => {
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

export const extractCleanJobTitle = (rawTitle, rawText, index = 0) => {
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

export const extractCleanCompany = (rawCompany, rawText) => {
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

export const transformMatchToJob = (match, index = 0) => {
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
    rawScore !== null &&
      rawScore !== undefined &&
      Number.isFinite(Number(rawScore)) &&
      Number(rawScore) >= 0 &&
      Number(rawScore) <= 100
      ? Number(rawScore)
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

  const displayScore = matchPercent;
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

  const numericJobId = extractNumericJobId(match);
  const primaryId = match.job_id || match.jobId || match.id || match.JDid || match.jd_id || (numericJobId !== null ? numericJobId : `job-${index + 1}`);

  return {
    id: primaryId,
    jobId: numericJobId !== null ? numericJobId : (match.jobId || primaryId),
    job_id: match.job_id || primaryId,
    numericJobId,
    JDid: match.JDid || primaryId,
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

export const getStoredSelectedResumeId = () => {
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
};

export const getStoredSelectedResumeData = () => {
  try {
    const storedData =
      localStorage.getItem("selected_resume_data") ||
      sessionStorage.getItem("selected_resume_data");
    return storedData ? JSON.parse(storedData) : null;
  } catch {
    return null;
  }
};

export const saveResumeSelection = (resume, resumeId) => {
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("resumeSelectionUpdated", {
          detail: { resume, resumeId: strId },
        })
      );
    }
  } catch (e) {
    console.error("Error saving resume selection to storage:", e);
  }
};

export const findTargetResume = (resumesList, storedResumeId = null, storedResumeData = null) => {
  if (!Array.isArray(resumesList) || resumesList.length === 0) return null;

  const targetId = storedResumeId || getStoredSelectedResumeId();
  const targetData = storedResumeData || getStoredSelectedResumeData();

  // 1. Try matching by ID
  if (targetId) {
    const matched = resumesList.find((r) => {
      const id = r.id ?? r.resumeId ?? r._id ?? r.fileId ?? r.uuid ?? r.resume_id;
      return String(id) === String(targetId);
    });
    if (matched) return matched;
  }

  // 2. Try matching by stored resume file name if ID match fails
  if (targetData) {
    const storedName = targetData.fileName || targetData.name || targetData.originalName;
    if (storedName) {
      const matched = resumesList.find((r) => {
        const rName = r.fileName || r.name || r.originalName;
        return rName && rName === storedName;
      });
      if (matched) return matched;
    }
  }

  // 3. Fallback to primary resume or first resume in list
  return resumesList.find((r) => r.isPrimary === true) || resumesList[0];
};

export const resolveSelectedResumeId = async ({
  customResumeId = null,
  selectedResume = null,
  activeResumeId = null,
} = {}) => {
  let resumeIdVal = customResumeId;
  if (resumeIdVal === null || resumeIdVal === undefined) {
    if (selectedResume) {
      resumeIdVal =
        selectedResume.id ??
        selectedResume.resumeId ??
        selectedResume._id ??
        selectedResume.fileId ??
        selectedResume.uuid ??
        selectedResume.resume_id;
    } else if (activeResumeId) {
      resumeIdVal = activeResumeId;
    }
  }
  if (!resumeIdVal) {
    resumeIdVal = getStoredSelectedResumeId();
  }
  if (!resumeIdVal) {
    try {
      resumeIdVal = await getPrimaryResumeId();
    } catch {
      // fallback
    }
  }
  const onboardingState = typeof getOnboardingState === "function" ? getOnboardingState() : null;
  if (!resumeIdVal && onboardingState?.resumeId) {
    resumeIdVal = String(onboardingState.resumeId);
  }
  if (!resumeIdVal) {
    resumeIdVal = typeof getStoredResumeId === "function" ? getStoredResumeId() : null;
  }
  return resumeIdVal ? String(resumeIdVal) : null;
};

export const buildJobQueryParams = ({
  resumeId = null,
  searchQuery = "",
  selectedLocations = [],
  selectedRoles = [],
  selectedWorkplace = [],
  selectedJobTypes = [],
  selectedCompanies = [],
  selectedDate = "All time",
  sortOption = "best_match",
  page = 0,
  pageSize = 20,
} = {}) => {
  let postedWithinDays = undefined;
  if (selectedDate === "Last 6 hours" || selectedDate === "Last 24 hours") {
    postedWithinDays = 1;
  } else if (selectedDate === "Last 7 days") {
    postedWithinDays = 7;
  } else if (selectedDate === "Last 14 days") {
    postedWithinDays = 14;
  } else if (selectedDate === "Last 30 days") {
    postedWithinDays = 30;
  }

  return {
    resumeId: resumeId || undefined,
    q: searchQuery && typeof searchQuery === "string" && searchQuery.trim() ? searchQuery.trim() : undefined,
    location: selectedLocations.length > 0 ? selectedLocations.join(",") : undefined,
    role: selectedRoles.length > 0 ? selectedRoles.join(",") : undefined,
    workplace: selectedWorkplace.length > 0 ? selectedWorkplace.map((w) => w.toLowerCase()).join(",") : undefined,
    employmentType: selectedJobTypes.length > 0 ? selectedJobTypes.map((t) => t.toLowerCase()).join(",") : undefined,
    company: selectedCompanies.length > 0 ? selectedCompanies.join(",") : undefined,
    postedWithinDays,
    sort: sortOption || "best_match",
    page: Math.max(0, page),
    size: pageSize || 20,
  };
};

export const fetchJobsForResume = async ({
  resumeId = null,
  searchQuery = "",
  selectedLocations = [],
  selectedRoles = [],
  selectedWorkplace = [],
  selectedJobTypes = [],
  selectedCompanies = [],
  selectedDate = "All time",
  sortOption = "best_match",
  page = 0,
  pageSize = 20,
} = {}) => {
  const params = buildJobQueryParams({
    resumeId,
    searchQuery,
    selectedLocations,
    selectedRoles,
    selectedWorkplace,
    selectedJobTypes,
    selectedCompanies,
    selectedDate,
    sortOption,
    page,
    pageSize,
  });

  console.log("[fetchJobsForResume] Calling GET /api/jobs with params:", params);
  const res = await getJobs(params);
  const items = res?.items || [];
  const transformed = items
    .map((m, idx) => transformMatchToJob(m, page * pageSize + idx))
    .filter(Boolean);

  const totalItems =
    typeof res?.totalItems === "number" && res.totalItems >= 0
      ? res.totalItems
      : items.length >= pageSize
      ? (page + 2) * pageSize
      : page * pageSize + items.length;

  const totalPages =
    typeof res?.totalPages === "number" && res.totalPages > 0
      ? res.totalPages
      : Math.max(1, Math.ceil(totalItems / (pageSize || 20)));

  return {
    params,
    res,
    items,
    transformed,
    totalItems,
    totalPages,
    hasMore: page + 1 < totalPages && items.length >= pageSize,
  };
};

export default {
  cleanHtmlText,
  formatPostedDate,
  extractCleanJobTitle,
  extractCleanCompany,
  transformMatchToJob,
  getStoredSelectedResumeId,
  getStoredSelectedResumeData,
  saveResumeSelection,
  findTargetResume,
  resolveSelectedResumeId,
  buildJobQueryParams,
  fetchJobsForResume,
};
