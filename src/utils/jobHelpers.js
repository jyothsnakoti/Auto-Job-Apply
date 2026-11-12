import { getJobs, getPrimaryResumeId } from "../services/jobService.js";
import { getOnboardingState } from "../services/onboardingService.js";
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

const isPlaceholderWorkplaceToken = (text) => {
  if (!text) return true;
  const compact = String(text).toUpperCase().replace(/[\s_/-]+/g, "");
  return (
    !compact ||
    compact === "NULL" ||
    compact === "UNDEFINED" ||
    compact === "NONE" ||
    compact === "NA"
  );
};

const firstValidWorkplaceRaw = (...values) => {
  for (const val of values) {
    if (val === undefined || val === null || typeof val === "boolean") continue;
    const cleaned = cleanHtmlText(val);
    if (cleaned && !isPlaceholderWorkplaceToken(cleaned)) return cleaned;
  }
  return "";
};

const WORKPLACE_DISPLAY_ORDER = new Map([
  ["remote", 0],
  ["on-site", 1],
  ["hybrid", 2],
]);

export const normalizeWorkplaceValue = (rawWorkplace) => {
  if (rawWorkplace === undefined || rawWorkplace === null) return "";
  if (typeof rawWorkplace === "boolean") {
    return rawWorkplace ? "Remote" : "";
  }
  const cleaned = cleanHtmlText(rawWorkplace);
  if (!cleaned || isPlaceholderWorkplaceToken(cleaned)) return "";

  const upper = cleaned.toUpperCase();
  const compact = upper.replace(/[\s_-]+/g, "");

  if (compact.includes("HYBRID")) return "Hybrid";
  if (
    compact.includes("NONREMOTE") ||
    compact.includes("NOTREMOTE") ||
    compact.includes("ONSITE") ||
    upper.includes("OFFICE") ||
    compact.includes("INPERSON")
  ) {
    return "On-Site";
  }
  if (compact.includes("REMOTE")) return "Remote";

  return cleaned;
};

export const extractRawJobWorkplace = (job) => {
  if (!job || typeof job !== "object") return "";
  const source = job.rawMatch && typeof job.rawMatch === "object" ? job.rawMatch : job;
  return firstValidWorkplaceRaw(
    source.workplace,
    source.workMode,
    source.work_mode,
    source.workplaceType,
    source.workplace_type,
    source.workLocationType,
    source.work_location_type,
    source.remoteType,
    source.remote_type
  );
};

export const getJobWorkplace = (job) => {
  if (!job || typeof job !== "object") return "";
  const raw = firstValidWorkplaceRaw(
    job.workMode,
    job.workplace,
    job.work_mode,
    job.workplaceType,
    job.workplace_type,
    job.workLocationType,
    job.work_location_type,
    job.remoteType,
    job.remote_type,
    job.rawMatch?.workplace,
    job.rawMatch?.workMode,
    job.rawMatch?.work_mode,
    job.rawMatch?.workplaceType,
    job.rawMatch?.workplace_type,
    job.rawMatch?.workLocationType,
    job.rawMatch?.work_location_type,
    job.rawMatch?.remoteType,
    job.rawMatch?.remote_type,
    job.isRemote === true || job.remote === true ? "Remote" : ""
  );
  return normalizeWorkplaceValue(raw);
};

export const sortWorkplaceOptions = (options = []) => {
  const uniqueMap = new Map();
  (options || []).forEach((opt) => {
    const normalized = normalizeWorkplaceValue(opt);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, normalized);
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => {
    const rankA = WORKPLACE_DISPLAY_ORDER.get(a.toLowerCase());
    const rankB = WORKPLACE_DISPLAY_ORDER.get(b.toLowerCase());
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    return a.localeCompare(b);
  });
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
  const rawWorkplace = firstValidWorkplaceRaw(
    match.workplace,
    match.workMode,
    match.work_mode,
    match.workplaceType,
    match.workplace_type,
    match.workLocationType,
    match.work_location_type,
    match.remoteType,
    match.remote_type,
    match.isRemote === true || match.remote === true ? "Remote" : ""
  );
  const normalizedRawWorkplace = normalizeWorkplaceValue(rawWorkplace);
  let workplace;
  if (normalizedRawWorkplace) {
    workplace = normalizedRawWorkplace;
  } else if (location.toLowerCase().includes("remote")) {
    workplace = "Remote";
  } else {
    workplace = "On-Site";
  }

  const rawEmploymentType = match.employmentType || match.type || match.employment_type || "";
  let employmentType;
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

export const buildWorkplaceQueryParam = (selectedWorkplace = [], referenceJobs = []) => {
  if (!Array.isArray(selectedWorkplace) || selectedWorkplace.length === 0) {
    return undefined;
  }

  const observedByNormalizedKey = new Map();
  (referenceJobs || []).forEach((job) => {
    const raw = extractRawJobWorkplace(job);
    if (!raw) return;
    const normalized = normalizeWorkplaceValue(raw);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (!observedByNormalizedKey.has(key)) {
      observedByNormalizedKey.set(key, new Set());
    }
    observedByNormalizedKey.get(key).add(raw.trim().toLowerCase());
  });

  const queryTokens = [];
  const seen = new Set();

  selectedWorkplace.forEach((item) => {
    const normalized = normalizeWorkplaceValue(item);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    const observed = observedByNormalizedKey.get(key);
    if (observed && observed.size > 0) {
      observed.forEach((token) => {
        if (token && !seen.has(token)) {
          seen.add(token);
          queryTokens.push(token);
        }
      });
    } else if (!seen.has(key)) {
      seen.add(key);
      queryTokens.push(key);
    }
  });

  return queryTokens.length > 0 ? queryTokens.join(",") : undefined;
};

export const buildBaseJobFilterKey = ({
  resumeId = null,
  searchQuery = "",
  selectedLocations = [],
  selectedRoles = [],
  selectedCompanies = [],
  selectedDate = "All time",
  sortOption = "best_match",
  pageSize = 20,
} = {}) => {
  const normList = (arr) =>
    Array.isArray(arr) ? [...arr].map((v) => String(v ?? "").trim()).filter(Boolean).sort() : [];
  return JSON.stringify({
    resumeId: resumeId ? String(resumeId) : "",
    q: typeof searchQuery === "string" ? searchQuery.trim() : "",
    locations: normList(selectedLocations),
    roles: normList(selectedRoles),
    companies: normList(selectedCompanies),
    date: selectedDate || "All time",
    sort: sortOption || "best_match",
    size: pageSize || 20,
  });
};

export const shouldFallbackToClientWorkplaceFilter = ({
  activeWorkplaces = [],
  pageNumber = 1,
  transformed = [],
  hasMoreServer = false,
  baseJobs = [],
} = {}) => {
  if (!Array.isArray(activeWorkplaces) || activeWorkplaces.length === 0) {
    return false;
  }

  const targetKeys = Array.from(
    new Set(
      activeWorkplaces
        .map((w) => normalizeWorkplaceValue(w).toLowerCase())
        .filter(Boolean)
    )
  );
  if (targetKeys.length === 0) return false;

  const baseWorkplaceSet = new Set(
    (baseJobs || []).map((j) => getJobWorkplace(j).toLowerCase()).filter(Boolean)
  );
  const baseHasAnyTarget = targetKeys.some((k) => baseWorkplaceSet.has(k));

  if ((!transformed || transformed.length === 0) && pageNumber === 1 && baseHasAnyTarget) {
    return true;
  }

  if (
    pageNumber === 1 &&
    !hasMoreServer &&
    Array.isArray(transformed) &&
    transformed.length > 0 &&
    baseHasAnyTarget
  ) {
    const returnedWorkplaceSet = new Set(
      transformed.map((j) => getJobWorkplace(j).toLowerCase()).filter(Boolean)
    );
    const missingFromServer = targetKeys.some(
      (k) => baseWorkplaceSet.has(k) && !returnedWorkplaceSet.has(k)
    );
    if (missingFromServer) {
      return true;
    }
  }

  return false;
};

export const recordUnsupportedWorkplaces = ({
  unsupportedSet,
  activeWorkplaces = [],
  transformed = [],
} = {}) => {
  if (!unsupportedSet || !Array.isArray(activeWorkplaces) || activeWorkplaces.length === 0) {
    return;
  }
  const targetKeys = Array.from(
    new Set(
      activeWorkplaces
        .map((w) => normalizeWorkplaceValue(w).toLowerCase())
        .filter(Boolean)
    )
  );
  if (targetKeys.length === 0) return;

  if (targetKeys.length === 1) {
    unsupportedSet.add(targetKeys[0]);
    return;
  }

  if (!Array.isArray(transformed) || transformed.length === 0) {
    unsupportedSet.add(targetKeys.slice().sort().join(","));
    return;
  }

  const returnedWorkplaceSet = new Set(
    transformed.map((j) => getJobWorkplace(j).toLowerCase()).filter(Boolean)
  );
  targetKeys.forEach((k) => {
    if (!returnedWorkplaceSet.has(k)) {
      unsupportedSet.add(k);
    }
  });
};

export const hasUnsupportedWorkplaceTarget = ({
  unsupportedSet,
  activeWorkplaces = [],
} = {}) => {
  if (!unsupportedSet || unsupportedSet.size === 0 || !Array.isArray(activeWorkplaces) || activeWorkplaces.length === 0) {
    return false;
  }
  const targetKeys = Array.from(
    new Set(
      activeWorkplaces
        .map((w) => normalizeWorkplaceValue(w).toLowerCase())
        .filter(Boolean)
    )
  );
  if (targetKeys.length === 0) return false;
  const comboKey = targetKeys.slice().sort().join(",");
  return targetKeys.some((k) => unsupportedSet.has(k)) || unsupportedSet.has(comboKey);
};

export const hasAnyJobMatchingWorkplaces = (jobs = [], activeWorkplaces = []) => {
  if (!Array.isArray(jobs) || jobs.length === 0 || !Array.isArray(activeWorkplaces) || activeWorkplaces.length === 0) {
    return false;
  }
  const targetKeys = new Set(
    activeWorkplaces.map((w) => normalizeWorkplaceValue(w).toLowerCase()).filter(Boolean)
  );
  if (targetKeys.size === 0) return false;
  return jobs.some((j) => targetKeys.has(getJobWorkplace(j).toLowerCase()));
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
  referenceJobs = [],
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
    workplace: buildWorkplaceQueryParam(selectedWorkplace, referenceJobs),
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

export const JOB_DATE_OPTIONS = [
  "Last 6 hours",
  "Last 24 hours",
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
  "All time",
];

export const JOB_WORKPLACE_OPTIONS = ["Remote", "On-Site", "Hybrid"];

export const JOB_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

export const FULL_TIME_JOB_TYPE_OPTIONS = ["Full-Time"];

export const C2C_JOB_TYPE_OPTIONS = ["C2C"];

export const JOB_SORT_OPTIONS = [
  { value: "best_match", label: "Best ATS Match" },
  { value: "newest", label: "Newest First" },
];

export const extractDynamicJobFilterOptions = (
  jobs = [],
  {
    selectedLocations = [],
    selectedCompanies = [],
    selectedRoles = [],
    selectedWorkplace = [],
  } = {}
) => {
  const companySet = new Set();
  const roleSet = new Set();
  const locationSet = new Set();
  const workplaceList = [];

  (jobs || []).forEach((j) => {
    if (!j) return;
    if (j.company && j.company !== "Hiring Organization") {
      companySet.add(j.company);
    }
    if (j.title && !j.title.startsWith("Position #")) {
      roleSet.add(j.title);
    }
    if (j.location && j.location !== "Remote / Flexible") {
      locationSet.add(j.location);
    }
    const wp = getJobWorkplace(j);
    if (wp) {
      workplaceList.push(wp);
    }
  });

  (selectedCompanies || []).forEach((c) => {
    if (c) companySet.add(c);
  });
  (selectedRoles || []).forEach((r) => {
    if (r) roleSet.add(r);
  });
  (selectedLocations || []).forEach((l) => {
    if (l) locationSet.add(l);
  });
  (selectedWorkplace || []).forEach((w) => {
    const normalized = normalizeWorkplaceValue(w);
    if (normalized) workplaceList.push(normalized);
  });

  return {
    companyOptions: Array.from(companySet),
    roleOptions: Array.from(roleSet),
    locationOptions: Array.from(locationSet),
    workplaceOptions: sortWorkplaceOptions(workplaceList),
  };
};

export const getJobDateFilterMaxAgeMs = (selectedDate) => {
  if (selectedDate === "Last 6 hours") return 6 * 60 * 60 * 1000;
  if (selectedDate === "Last 24 hours") return 24 * 60 * 60 * 1000;
  if (selectedDate === "Last 7 days") return 7 * 24 * 60 * 60 * 1000;
  if (selectedDate === "Last 14 days") return 14 * 24 * 60 * 60 * 1000;
  if (selectedDate === "Last 30 days") return 30 * 24 * 60 * 60 * 1000;
  return Infinity;
};

export const matchesJobDateFilter = (job, selectedDate, nowMs = Date.now()) => {
  if (!selectedDate || selectedDate === "All time" || selectedDate === "All") {
    return true;
  }

  const maxAgeMs = getJobDateFilterMaxAgeMs(selectedDate);
  if (!Number.isFinite(maxAgeMs)) {
    return true;
  }

  const rawDate = job?.createdAt || job?.postedAt || job?.postedDate || job?.date;
  if (!rawDate) {
    return true;
  }

  const jobTime = new Date(rawDate).getTime();
  if (isNaN(jobTime)) {
    return true;
  }

  return nowMs - jobTime <= maxAgeMs;
};

export const matchesJobTypeFilter = (job, selectedJobTypes = []) => {
  const types = Array.isArray(selectedJobTypes)
    ? selectedJobTypes
    : selectedJobTypes && selectedJobTypes !== "All"
      ? [selectedJobTypes]
      : [];

  if (types.length === 0) {
    return true;
  }

  const jobTypeText = [job?.type, job?.jobType, job?.employmentType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return types.some((t) => {
    const target = String(t).toLowerCase().trim();
    if (!target || target === "all") return true;
    if (target === "full-time") {
      return (
        jobTypeText.includes("full-time") ||
        jobTypeText.includes("full_time") ||
        jobTypeText.includes("full time") ||
        /\bfulltime\b/.test(jobTypeText)
      );
    }
    if (target === "c2c") {
      return (
        jobTypeText.includes("c2c") ||
        jobTypeText.includes("contract") ||
        jobTypeText.includes("corp-to-corp") ||
        jobTypeText.includes("corp_to_corp") ||
        jobTypeText.includes("corp to corp")
      );
    }
    return jobTypeText.includes(target);
  });
};

export const filterJobMatches = (
  jobs = [],
  {
    searchQuery = "",
    selectedDate = "All time",
    selectedLocations = [],
    selectedCompanies = [],
    selectedRoles = [],
    selectedWorkplace = [],
    selectedJobTypes = [],
  } = {},
  { isSubmittedFn = null } = {}
) => {
  const trimmedQuery =
    typeof searchQuery === "string" ? searchQuery.toLowerCase().trim() : "";
  const now = Date.now();

  return (jobs || []).filter((job) => {
    if (!job) return false;

    if (typeof isSubmittedFn === "function" && isSubmittedFn(job)) {
      return false;
    }

    if (trimmedQuery) {
      const matchTitle = (job.title || "").toLowerCase().includes(trimmedQuery);
      const matchComp = (job.company || "").toLowerCase().includes(trimmedQuery);
      const matchLoc = (job.location || "").toLowerCase().includes(trimmedQuery);
      const matchDesc = (job.description || "").toLowerCase().includes(trimmedQuery);
      const matchSkills =
        Array.isArray(job.requiredSkills) &&
        job.requiredSkills.some((s) => String(s).toLowerCase().includes(trimmedQuery));
      if (!matchTitle && !matchComp && !matchLoc && !matchDesc && !matchSkills) {
        return false;
      }
    }

    if (!matchesJobDateFilter(job, selectedDate, now)) {
      return false;
    }

    if (selectedLocations.length > 0) {
      const jobLoc = (job.location || job.fullLocation || "").toLowerCase();
      const matchesLoc = selectedLocations.some((loc) =>
        jobLoc.includes(loc.toLowerCase().split(",")[0].trim())
      );
      if (!matchesLoc) return false;
    }

    if (selectedCompanies.length > 0) {
      const jobComp = (job.company || "").toLowerCase();
      const matchesComp = selectedCompanies.some((comp) =>
        jobComp.includes(comp.toLowerCase().trim())
      );
      if (!matchesComp) return false;
    }

    if (selectedRoles.length > 0) {
      const jobRole = (job.title || "").toLowerCase();
      const matchesRole = selectedRoles.some((role) =>
        jobRole.includes(role.toLowerCase().trim())
      );
      if (!matchesRole) return false;
    }

    if (selectedWorkplace.length > 0) {
      const jobMode = getJobWorkplace(job).toLowerCase();
      const matchesWorkMode = selectedWorkplace.some((m) => {
        const targetMode = normalizeWorkplaceValue(m).toLowerCase();
        return Boolean(targetMode) && jobMode === targetMode;
      });
      if (!matchesWorkMode) return false;
    }

    if (!matchesJobTypeFilter(job, selectedJobTypes)) {
      return false;
    }

    return true;
  });
};

export default {
  cleanHtmlText,
  formatPostedDate,
  extractCleanJobTitle,
  extractCleanCompany,
  normalizeWorkplaceValue,
  extractRawJobWorkplace,
  getJobWorkplace,
  sortWorkplaceOptions,
  transformMatchToJob,
  getStoredSelectedResumeId,
  getStoredSelectedResumeData,
  saveResumeSelection,
  findTargetResume,
  resolveSelectedResumeId,
  buildWorkplaceQueryParam,
  buildBaseJobFilterKey,
  shouldFallbackToClientWorkplaceFilter,
  recordUnsupportedWorkplaces,
  hasUnsupportedWorkplaceTarget,
  hasAnyJobMatchingWorkplaces,
  buildJobQueryParams,
  fetchJobsForResume,
  JOB_DATE_OPTIONS,
  JOB_WORKPLACE_OPTIONS,
  JOB_TYPE_OPTIONS,
  FULL_TIME_JOB_TYPE_OPTIONS,
  C2C_JOB_TYPE_OPTIONS,
  JOB_SORT_OPTIONS,
  getJobDateFilterMaxAgeMs,
  matchesJobDateFilter,
  matchesJobTypeFilter,
  extractDynamicJobFilterOptions,
  filterJobMatches,
};
