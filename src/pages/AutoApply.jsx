import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import mapIcon from "../assets/map.svg";
import tickIcon from "../assets/tick.svg";

// Helper to identify static / placeholder dummy logos that should never be rendered
const isStaticLogo = (logoUrl) => {
  if (!logoUrl || typeof logoUrl !== "string") return true;
  return (
    logoUrl.includes("ai.svg") ||
    logoUrl.includes("amazon") ||
    logoUrl.includes("google.svg") ||
    logoUrl.includes("microsoft.svg") ||
    logoUrl.includes("shopify.svg")
  );
};
import {
  getJobs,
  getBillingStatus,
  getResumes,
  applyToJobs,
  applyToJobsInBatches,
  extractNumericJobId,
  extractNumericResumeId,
  markJobsAsApplied,
  getApplicationStatuses,
  isJobSubmitted,
  isApplyNowHiddenForJob,
  getMatchingApplicationForJob,
  normalizeApplicationStatus,
  isApplicationActiveStatus,
} from "../services/api";
import {
  transformMatchToJob,
  buildJobQueryParams,
  resolveSelectedResumeId,
  findTargetResume,
  getStoredSelectedResumeId,
  getStoredSelectedResumeData,
  saveResumeSelection,
  cleanHtmlText,
} from "../utils/jobHelpers";

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

const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-[14px] h-[14px] object-contain shrink-0"
  />
);

const AutoApply = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isJobSaved, setIsJobSaved] = useState(false);

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

  // Floating Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  // Helper to resolve selected numeric resume ID (matching BrowseJobs logic)
  const resolveNumericResumeId = async () => {
    let targetResume = selectedResumeRef.current;
    let numericResumeId = extractNumericResumeId(targetResume);

    if (!numericResumeId && userResumes.length > 0) {
      targetResume = findTargetResume(userResumes, activeResumeIdRef.current);
      numericResumeId = extractNumericResumeId(targetResume);
    }

    if (!numericResumeId) {
      try {
        const fetched = await getResumes();
        if (Array.isArray(fetched) && fetched.length > 0) {
          setUserResumes(fetched);
          targetResume = findTargetResume(fetched, activeResumeIdRef.current);
          numericResumeId = extractNumericResumeId(targetResume);
        }
      } catch {
        // ignore
      }
    }

    if (!numericResumeId && activeResumeIdRef.current) {
      numericResumeId = extractNumericResumeId(activeResumeIdRef.current);
    }

    if (!numericResumeId) {
      const storedId = getStoredSelectedResumeId();
      if (storedId) numericResumeId = extractNumericResumeId(storedId);
    }

    return numericResumeId;
  };

  // Application Service States for Side Panel / Modal
  const [isApplyingPanelJob, setIsApplyingPanelJob] = useState(false);
  const [panelApplyStatus, setPanelApplyStatus] = useState(null);

  // Application Status State & Sync (GET /api/applications is source of truth)
  const [applicationMap, setApplicationMap] = useState(() => new Map());
  const [submittedJobIdSet, setSubmittedJobIdSet] = useState(() => new Set());
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(null);

  const fetchApplicationStatuses = useCallback(async (forceRefresh = false) => {
    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      const res = await getApplicationStatuses({ forceRefresh });
      setApplicationMap(res.applicationMap || new Map());
      setSubmittedJobIdSet(res.submittedJobIdSet || new Set());
    } catch (err) {
      console.error("[AutoApply] Failed to load application statuses:", err);
      setStatusError(err.message || "Failed to load application statuses from server.");
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchApplicationStatuses();
  }, [fetchApplicationStatuses]);

  useEffect(() => {
    const handleStatusSync = (e) => {
      if (e?.detail?.applicationMap && e?.detail?.submittedJobIdSet) {
        setApplicationMap(e.detail.applicationMap);
        setSubmittedJobIdSet(e.detail.submittedJobIdSet);
      } else {
        fetchApplicationStatuses(true);
      }
    };
    window.addEventListener("applicationStatusesUpdated", handleStatusSync);
    window.addEventListener("appliedJobIdsUpdated", handleStatusSync);
    window.addEventListener("storage", handleStatusSync);
    return () => {
      window.removeEventListener("applicationStatusesUpdated", handleStatusSync);
      window.removeEventListener("appliedJobIdsUpdated", handleStatusSync);
      window.removeEventListener("storage", handleStatusSync);
    };
  }, [fetchApplicationStatuses]);

  // If selected job was or becomes submitted, clear modal selection to avoid stale application state
  useEffect(() => {
    if (selectedJobModal && isJobSubmitted(selectedJobModal, submittedJobIdSet, applicationMap)) {
      setSelectedJobModal(null);
    }
  }, [selectedJobModal, submittedJobIdSet, applicationMap]);

  const handleApplyToPanelJob = async () => {
    if (!selectedJobModal) return;

    if (isJobSubmitted(selectedJobModal, submittedJobIdSet, applicationMap)) {
      setPanelApplyStatus({
        type: "error",
        message: "This job has already been submitted.",
      });
      showToast("This job has already been submitted.", "warning");
      return;
    }

    const numericJobId = extractNumericJobId(selectedJobModal);
    if (!numericJobId) {
      setPanelApplyStatus({
        type: "error",
        message: "Displayed job is missing a valid numeric backend Job ID.",
      });
      return;
    }

    if (isApplyingPanelJob) return;

    const numericResumeId = await resolveNumericResumeId();
    if (!numericResumeId) {
      setPanelApplyStatus({
        type: "error",
        message: "No valid resume found. Please go to Profile to select/upload a resume.",
      });
      return;
    }

    setIsApplyingPanelJob(true);
    setPanelApplyStatus(null);

    try {
      const res = await applyToJobs({ resumeId: numericResumeId, jobIds: [numericJobId] });
      const queuedCount = res.queued?.length || 0;
      const skippedArr = res.skipped || [];

      if (queuedCount > 0) {
        markJobsAsApplied(res.queued);
        setPanelApplyStatus({
          type: "success",
          message: `Application queued successfully! (${queuedCount} queued)`,
        });

        getBillingStatus()
          .then((status) => {
            if (status) {
              setBillingInfo(status);
              window.dispatchEvent(new CustomEvent("billingStatusUpdated", { detail: status }));
            }
          })
          .catch(() => {});
      } else if (skippedArr.length > 0) {
        const reason = skippedArr[0]?.reason || "ALREADY_SUBMITTED";
        setPanelApplyStatus({
          type: "skipped",
          message: `Application skipped: ${reason}`,
        });
      } else {
        setPanelApplyStatus({
          type: "skipped",
          message: "Application skipped (No new jobs queued).",
        });
      }

      await fetchApplicationStatuses(true);
    } catch (err) {
      console.error("[AutoApply] Panel apply error:", err);
      setPanelApplyStatus({
        type: "error",
        message: err.message || "Failed to submit application.",
      });
    } finally {
      setIsApplyingPanelJob(false);
    }
  };

  // Bulk Auto Apply State & Handler
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [bulkApplyStatus, setBulkApplyStatus] = useState(null);

  const handleStartBulkAutoApply = async () => {
    if (isBulkApplying) return;

    if (isLoadingStatus) {
      showToast("Please wait while application statuses are loaded...", "warning");
      return;
    }

    if (selectedJobIds.length === 0) {
      showToast("Please select at least 1 job to auto apply.", "warning");
      return;
    }

    if (selectedJobIds.length > 5) {
      showToast("You can only select up to 5 jobs for Auto Bulk Apply.", "warning");
      return;
    }

    setIsBulkApplying(true);
    setBulkApplyStatus(null);

    try {
      const billing = await getBillingStatus().catch(() => null);
      const remaining =
        typeof billing?.remainingApplications === "number"
          ? billing.remainingApplications
          : typeof billing?.remaining === "number"
            ? billing.remaining
            : typeof billingInfo?.remainingApplications === "number"
              ? billingInfo.remainingApplications
              : 100;

      if (remaining <= 0) {
        const msg = "Insufficient application credits. Please upgrade your plan in Subscriptions.";
        showToast(msg, "error");
        setBulkApplyStatus({ type: "error", message: msg });
        setIsBulkApplying(false);
        return;
      }

      const numericResumeId = await resolveNumericResumeId();
      if (!numericResumeId) {
        const msg = "No resume found. Please go to Profile to upload/select a resume.";
        showToast(msg, "error");
        setBulkApplyStatus({ type: "error", message: msg });
        setIsBulkApplying(false);
        return;
      }

      // Map selected job IDs to actual backend numeric job IDs and revalidate against submitted status
      const selectedJobsList = eligibleJobs.filter((j) => selectedJobIds.includes(j.id));
      const validNumericJobIds = [];

      for (const j of selectedJobsList) {
        // Strictly exclude already submitted jobs and active applications
        if (isJobSubmitted(j, submittedJobIdSet, applicationMap)) {
          continue;
        }
        if (isApplyNowHiddenForJob(j, applicationMap, submittedJobIdSet)) {
          continue;
        }
        const numId = extractNumericJobId(j);
        if (numId !== null && !validNumericJobIds.includes(numId)) {
          validNumericJobIds.push(numId);
        }
      }

      if (validNumericJobIds.length === 0) {
        const msg = "None of the selected jobs are eligible for submission (already submitted or active).";
        showToast(msg, "warning");
        setBulkApplyStatus({ type: "warning", message: msg });
        setIsBulkApplying(false);
        return;
      }

      // Enforce up to 5 jobs limit and user quota
      const jobIdsToApply = validNumericJobIds.slice(0, Math.min(5, remaining));

      console.log(`[AutoApply] Submitting bulk auto apply for ${jobIdsToApply.length} jobs:`, jobIdsToApply);

      // Hits the same applications endpoint (/api/applications) used in browse jobs
      const res = await applyToJobs({
        resumeId: numericResumeId,
        jobIds: jobIdsToApply,
      });

      const queuedCount = res.queued?.length || 0;
      const skippedArr = res.skipped || [];

      if (queuedCount > 0) {
        markJobsAsApplied(res.queued);
        const msg = `Application queued successfully! (${queuedCount} queued)`;
        showToast(msg, "success");
        setBulkApplyStatus({ type: "success", message: msg });

        // Remove successfully queued jobs from selection
        setSelectedJobIds((prev) =>
          prev.filter((id) => {
            const matched = jobs.find((j) => j.id === id);
            const nId = matched ? extractNumericJobId(matched) : null;
            return nId ? !res.queued.includes(nId) : true;
          })
        );

        // Update billing status
        getBillingStatus()
          .then((status) => {
            if (status) {
              setBillingInfo(status);
              window.dispatchEvent(new CustomEvent("billingStatusUpdated", { detail: status }));
            }
          })
          .catch(() => {});
      } else if (skippedArr.length > 0) {
        const reason = skippedArr[0]?.reason || "ALREADY_SUBMITTED";
        const msg = `Application skipped: ${reason}`;
        showToast(msg, "warning");
        setBulkApplyStatus({ type: "warning", message: msg });
      } else {
        const msg = "Application skipped (No new jobs queued).";
        showToast(msg, "warning");
        setBulkApplyStatus({ type: "warning", message: msg });
      }

      await fetchApplicationStatuses(true);
    } catch (err) {
      console.error("[AutoApply] Bulk auto apply error:", err);
      const msg = err.message || "Failed to submit bulk applications.";
      showToast(msg, "error");
      setBulkApplyStatus({ type: "error", message: msg });
    } finally {
      setIsBulkApplying(false);
    }
  };

  // Resume & Jobs State (exact parity with BrowseJobs)
  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(() => getStoredSelectedResumeData());
  const [activeResumeId, setActiveResumeId] = useState(() => getStoredSelectedResumeId());

  const selectedResumeRef = useRef(selectedResume);
  selectedResumeRef.current = selectedResume;
  const activeResumeIdRef = useRef(activeResumeId);
  activeResumeIdRef.current = activeResumeId;
  const hasLoadedRef = useRef(false);

  const [billingInfo, setBillingInfo] = useState(() => {
    try {
      const stored =
        localStorage.getItem("billingStatus") ||
        sessionStorage.getItem("billingStatus");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Fetch user resumes and resolve the selected resume ID matching BrowseJobs logic
  const fetchUserResumes = useCallback(async () => {
    try {
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

      const targetResume = findTargetResume(list);
      let targetResumeId = null;

      if (targetResume) {
        setSelectedResume(targetResume);
        selectedResumeRef.current = targetResume;
        targetResumeId =
          targetResume.id ??
          targetResume.resumeId ??
          targetResume._id ??
          targetResume.fileId ??
          targetResume.uuid ??
          targetResume.resume_id;
      }

      if (!targetResumeId) {
        targetResumeId = await resolveSelectedResumeId({
          selectedResume: targetResume,
          activeResumeId: activeResumeIdRef.current,
        });
      }

      if (targetResumeId !== undefined && targetResumeId !== null) {
        const strId = String(targetResumeId);
        setActiveResumeId(strId);
        activeResumeIdRef.current = strId;
        saveResumeSelection(targetResume, strId);
      }

      return targetResumeId;
    } catch (err) {
      console.warn("[AutoApply] Error fetching user resumes:", err);
      const fallbackId = await resolveSelectedResumeId({
        selectedResume: selectedResumeRef.current,
        activeResumeId: activeResumeIdRef.current,
      });
      return fallbackId;
    }
  }, []);

  // Fetch jobs using the exact same request parameters, filtering, sorting, and mapping as BrowseJobs
  const loadJobsData = useCallback(
    async ({
      resumeId = null,
      search = searchQuery,
      locations = selectedLocations,
      roles = selectedRoles,
      workplaces = selectedWorkplace,
      jobTypes = selectedJobTypes,
      companies = selectedCompanies,
      date = selectedDate,
    } = {}) => {
      try {
        setIsLoadingJobs(true);

        let targetResumeId = resumeId;
        if (!targetResumeId) {
          targetResumeId = await resolveSelectedResumeId({
            selectedResume: selectedResumeRef.current,
            activeResumeId: activeResumeIdRef.current,
          });
        }

        const params = buildJobQueryParams({
          resumeId: targetResumeId,
          searchQuery: search,
          selectedLocations: locations,
          selectedRoles: roles,
          selectedWorkplace: workplaces,
          selectedJobTypes: jobTypes,
          selectedCompanies: companies,
          selectedDate: date,
          sortOption: "best_match",
          page: 0,
          pageSize: 20,
        });

        console.log("[AutoApply] Fetching jobs via GET /api/jobs with params:", params);
        const res = await getJobs(params);
        const items = res?.items || [];
        const transformed = items.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);

        // Update jobs state with fresh transformed matches (no stale fallback cache)
        setJobs(transformed);
        setSelectedJobIds([]);
      } catch (err) {
        console.warn("[AutoApply] Error fetching jobs from GET /api/jobs:", err);
        // Do not use old cached jobs as a fallback when the API returns no results or errors
        setJobs([]);
        setSelectedJobIds([]);
      } finally {
        setIsLoadingJobs(false);
      }
    },
    [
      searchQuery,
      selectedLocations,
      selectedRoles,
      selectedWorkplace,
      selectedJobTypes,
      selectedCompanies,
      selectedDate,
    ]
  );

  // Initial load: resolve resume then load jobs
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setIsLoadingJobs(true);
      const resId = await fetchUserResumes();
      if (isMounted) {
        await loadJobsData({ resumeId: resId });
        hasLoadedRef.current = true;
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [fetchUserResumes, loadJobsData]);

  // Re-fetch jobs whenever search query or filters change
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    loadJobsData();
  }, [
    searchQuery,
    selectedLocations,
    selectedCompanies,
    selectedRoles,
    selectedWorkplace,
    selectedJobTypes,
    selectedDate,
    loadJobsData,
  ]);

  // Refresh jobs when the selected resume changes in BrowseJobs or elsewhere
  useEffect(() => {
    const handleResumeChange = async (e) => {
      const newResumeId = e?.detail?.resumeId || getStoredSelectedResumeId();
      if (newResumeId && String(newResumeId) !== String(activeResumeIdRef.current)) {
        console.log(`[AutoApply] Selected resume changed from ${activeResumeIdRef.current} to ${newResumeId}. Refreshing jobs...`);
        const resId = await fetchUserResumes();
        await loadJobsData({ resumeId: resId || newResumeId });
      }
    };

    const handleJobMatchesUpdated = async () => {
      const resId = await fetchUserResumes();
      await loadJobsData({ resumeId: resId });
    };

    window.addEventListener("resumeSelectionUpdated", handleResumeChange);
    window.addEventListener("selectedResumeChanged", handleResumeChange);
    window.addEventListener("jobMatchesUpdated", handleJobMatchesUpdated);
    window.addEventListener("storage", handleResumeChange);

    return () => {
      window.removeEventListener("resumeSelectionUpdated", handleResumeChange);
      window.removeEventListener("selectedResumeChanged", handleResumeChange);
      window.removeEventListener("jobMatchesUpdated", handleJobMatchesUpdated);
      window.removeEventListener("storage", handleResumeChange);
    };
  }, [fetchUserResumes, loadJobsData]);

  // Fetch Dynamic Billing Status (GET /api/billing/status)
  useEffect(() => {
    let isMounted = true;

    const loadBilling = async () => {
      try {
        const status = await getBillingStatus();
        if (isMounted && status) {
          setBillingInfo(status);
        }
      } catch (err) {
        console.warn("[AutoApply] Could not fetch billing status:", err);
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
      } else if (isMounted) {
        loadBilling();
      }
    };

    window.addEventListener("billingStatusUpdated", handleBillingUpdated);
    window.addEventListener("storage", handleBillingUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("billingStatusUpdated", handleBillingUpdated);
      window.removeEventListener("storage", handleBillingUpdated);
    };
  }, []);



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
    setSelectedDegrees([]);
    setSelectedExperience("");
    setSelectedRoles([]);
    setSelectedJobTypes([]);
    setSponsorsVisa(false);
    setSelectedEmploymentTypes([]);
    setActiveDropdown(null);
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

  // Filter out jobs that already have a SUBMITTED application
  const eligibleJobs = useMemo(() => {
    return jobs.filter((job) => !isJobSubmitted(job, submittedJobIdSet, applicationMap));
  }, [jobs, submittedJobIdSet, applicationMap]);

  // Selectable jobs for bulk auto apply (excludes submitted AND active in-progress jobs)
  const selectableJobs = useMemo(() => {
    return eligibleJobs.filter(
      (job) => !isApplyNowHiddenForJob(job, applicationMap, submittedJobIdSet)
    );
  }, [eligibleJobs, applicationMap, submittedJobIdSet]);

  // Automatically deselect any job that is no longer selectable (submitted or active)
  useEffect(() => {
    setSelectedJobIds((prev) =>
      prev.filter((id) => {
        const matched = eligibleJobs.find((j) => j.id === id);
        if (!matched) return false;
        if (isJobSubmitted(matched, submittedJobIdSet, applicationMap)) return false;
        if (isApplyNowHiddenForJob(matched, applicationMap, submittedJobIdSet)) return false;
        return true;
      })
    );
  }, [eligibleJobs, submittedJobIdSet, applicationMap]);

  const maxSelectable = Math.min(5, selectableJobs.length);
  const isAllSelected = selectedJobIds.length === maxSelectable && maxSelectable > 0;
  const isIndeterminate = selectedJobIds.length > 0 && !isAllSelected;

  const toggleJobSelection = (id) => {
    if (selectedJobIds.includes(id)) {
      setSelectedJobIds((prev) => prev.filter((jId) => jId !== id));
      return;
    }

    const targetJob = eligibleJobs.find((j) => j.id === id);
    if (!targetJob) return;

    if (isApplyNowHiddenForJob(targetJob, applicationMap, submittedJobIdSet)) {
      showToast("This job application is already in progress.", "warning");
      return;
    }

    if (selectedJobIds.length >= 5) {
      showToast("You can only select up to 5 jobs for Auto Bulk Apply.", "warning");
      return;
    }

    setSelectedJobIds((prev) => [...prev, id]);
  };

  const handleToggleSelectAll = () => {
    if (selectedJobIds.length > 0) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(selectableJobs.slice(0, 5).map((j) => j.id));
    }
  };

  // Extract dynamic billing info (from GET /api/billing/status)
  const hasPlan = Boolean(billingInfo?.hasPlan ?? true);
  const rawPlanName = (billingInfo?.planName || "").trim();

  const planTitle = rawPlanName
    ? (rawPlanName.toLowerCase().includes("plan") || rawPlanName.toLowerCase().includes("pack")
      ? rawPlanName
      : `${rawPlanName.charAt(0).toUpperCase() + rawPlanName.slice(1)} Plan`)
    : (hasPlan ? "Pro Plan" : "Free Plan");

  const applicationAllowance =
    typeof billingInfo?.applicationAllowance === "number"
      ? billingInfo.applicationAllowance
      : typeof billingInfo?.applicationLimit === "number"
        ? billingInfo.applicationLimit
        : typeof billingInfo?.allowance === "number"
          ? billingInfo.allowance
          : typeof billingInfo?.limit === "number"
            ? billingInfo.limit
            : typeof billingInfo?.totalApplications === "number"
              ? billingInfo.totalApplications
              : 100;

  const usedApplications =
    typeof billingInfo?.usedApplications === "number"
      ? billingInfo.usedApplications
      : typeof billingInfo?.applicationsUsed === "number"
        ? billingInfo.applicationsUsed
        : typeof billingInfo?.used === "number"
          ? billingInfo.used
          : 48;

  const remainingApplications =
    typeof billingInfo?.remainingApplications === "number"
      ? billingInfo.remainingApplications
      : typeof billingInfo?.applicationsRemaining === "number"
        ? billingInfo.applicationsRemaining
        : typeof billingInfo?.remaining === "number"
          ? billingInfo.remaining
          : Math.max(0, applicationAllowance - usedApplications);

  const rawInterval = (billingInfo?.billingInterval || "month").toLowerCase().trim();
  const intervalDisplay =
    rawInterval && rawInterval !== "none" && rawInterval !== "null"
      ? (rawInterval === "quarter" ? "quarter" : rawInterval === "year" ? "year" : "month")
      : "month";

  const progressPercent =
    applicationAllowance > 0
      ? (usedApplications / applicationAllowance) * 100
      : 0;
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Auto Apply Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
             Full Time Bulk Apply
            </h1>
            <p className="text-[13px] text-[#64748B]">
              Select job matches and let us handle the rest. We'll tailor your resume, complete applications and submit them automatically.
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadJobsData();
                    }
                  }}
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
                onClick={() => loadJobsData()}
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

              {/* 6. Companies Dropdown */}
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
            </div>
          </div>

          {/* Main 2-Column Content: Left Jobs Selection List + Right Plan & Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">

            {/* Left Column (8 cols): Select Jobs to Auto Apply Card */}
            <div className="lg:col-span-8 bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-4">

              {/* Card Header with Select top 5 moved above */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight">
                    Select Jobs to Bulk Auto Apply
                  </h2>
                  <p className="text-[13px] text-[#64748B]">
                    Choose from your matched jobs or use filters to find more opportunities.
                  </p>
                </div>

                {selectableJobs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-[12.5px] sm:text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer transition-colors shrink-0 pt-0.5"
                  >
                    {selectedJobIds.length > 0 ? "Unselect all" : `Select top ${Math.min(5, selectableJobs.length)}`}
                  </button>
                )}
              </div>

              {/* Status Header: Select All on left, ATS heading above ATS donut scores */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  disabled={selectableJobs.length === 0}
                  className="flex items-center gap-2 text-[13px] font-bold text-[#0F172A] cursor-pointer group select-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${isAllSelected
                        ? "bg-[#2563EB] text-white"
                        : isIndeterminate
                          ? "bg-[#2563EB] text-white"
                          : "border-2 border-slate-300 bg-white group-hover:border-slate-400"
                      }`}
                  >
                    {isAllSelected && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {isIndeterminate && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <span className="font-bold text-[#0F172A]">{selectedJobIds.length} of {Math.min(5, selectableJobs.length)} jobs selected (max 5)</span>
                </button>

                {/* Column Heading for ATS Donut Score */}
                <div className="w-[44px] text-center shrink-0">
                  <span className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
                    ATS
                  </span>
                </div>
              </div>

              {/* Job List Container */}
              <div className="flex flex-col divide-y divide-slate-100 mt-1">
                {isLoadingJobs || isLoadingStatus ? (
                  <div className="py-12 text-center">
                    <p className="text-[13.5px] font-medium text-[#64748B]">Loading job matches and application statuses...</p>
                  </div>
                ) : eligibleJobs.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                    </div>
                    <p className="text-[14px] font-semibold text-[#0F172A]">
                      {jobs.length > 0 ? "All matched jobs already submitted" : "No job matches available"}
                    </p>
                    <p className="text-[12.5px] text-[#64748B] max-w-sm">
                      {jobs.length > 0
                        ? "All matched jobs currently have submitted applications. Check your Applications dashboard for updates."
                        : "Upload your resume in Profile to view and select job matches for Auto Apply."}
                    </p>
                    {jobs.length === 0 && (
                      <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="mt-2 text-[13px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Go to Profile
                      </button>
                    )}
                  </div>
                ) : (
                  eligibleJobs.map((job) => {
                    const isSelected = selectedJobIds.includes(job.id);
                    const isHidden = isApplyNowHiddenForJob(job, applicationMap, submittedJobIdSet);
                    const appRecord = getMatchingApplicationForJob(job, applicationMap);
                    const normStatus = normalizeApplicationStatus(appRecord?.status || appRecord?.state || appRecord?.applicationStatus);

                    return (
                      <div
                        key={job.id}
                        className={`py-4.5 flex items-center justify-between gap-4 -mx-6 px-6 transition-colors group ${
                          isHidden ? "bg-slate-50/40 cursor-default opacity-85" : "hover:bg-slate-50/70 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (isHidden) {
                            showToast("This job application is already in progress.", "warning");
                            return;
                          }
                          toggleJobSelection(job.id);
                        }}
                      >
                        {/* Left: Checkbox / Active Badge + Logo + Title & Info */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {/* Circle Checkbox or In-Progress Badge */}
                          {isHidden ? (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                                normStatus === "QUEUED"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200/80"
                                  : normStatus === "IN_PROGRESS"
                                  ? "bg-blue-50 text-blue-700 border-blue-200/80"
                                  : normStatus === "NEEDS_ACTION"
                                  ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                  : normStatus === "PREPARING"
                                  ? "bg-purple-50 text-purple-700 border-purple-200/80"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {normStatus === "QUEUED"
                                ? "Queued"
                                : normStatus === "IN_PROGRESS"
                                ? "In Progress"
                                : normStatus === "NEEDS_ACTION"
                                ? "Needs Action"
                                : normStatus === "PREPARING"
                                ? "Preparing"
                                : "Active"}
                            </span>
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? "bg-[#2563EB] text-white"
                                  : "border-2 border-slate-300 bg-white group-hover:border-slate-400"
                              }`}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          )}

                          {/* Company Logo */}
                          {job.logo && !isStaticLogo(job.logo) ? (
                            <div className="w-[38px] h-[38px] rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2">
                              <img
                                src={job.logo}
                                alt={job.company}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  if (e.currentTarget.parentElement) {
                                    e.currentTarget.parentElement.style.display = "none";
                                  }
                                }}
                              />
                            </div>
                          ) : null}

                          {/* Job Title & Subline */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <h3
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJobModal(job);
                                }}
                                className="text-[14.5px] font-bold text-[#0F172A] tracking-tight truncate hover:text-[#2563EB] transition-colors"
                              >
                                {job.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2 text-[12.5px] text-[#64748B] mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <span>{job.company}</span>
                                <VerifiedTick />
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1">
                                <img src={mapIcon} alt="" className="w-2.5 h-3 object-contain shrink-0" />
                                <span>{job.location}</span>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                                <span>{job.type}</span>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                </svg>
                                <span>{job.workMode}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: ATS Match Donut */}
                        <div className="flex items-center shrink-0">
                          {/* Circular Donut Match Score */}
                          <div className="relative w-[44px] h-[44px] shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-slate-100"
                                strokeWidth="2.6"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={job.matchPercent >= 90 ? "text-[#0D9488]" : "text-[#D97706]"}
                                strokeDasharray={`${job.matchPercent || 85}, 100`}
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span className="absolute text-[9.5px] font-bold text-[#0F172A] tracking-tight leading-none select-none">
                              {typeof job.matchPercent === "number" && !isNaN(job.matchPercent)
                                ? Number.isInteger(job.matchPercent)
                                  ? `${job.matchPercent}%`
                                  : `${job.matchPercent.toFixed(1)}%`
                                : job.matchPercent
                                ? `${job.matchPercent}%`
                                : "--"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column (4 cols): Application Plan Card & Auto Apply Settings Card */}
            <div className="lg:col-span-4 flex flex-col gap-6 w-full">

              {/* 1. Your Application Plan Card */}
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5.5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-[#0F172A]">
                    Your Application Plan
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate("/upgrade-plan")}
                    className="text-[12.5px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                  >
                    Manage Plan
                  </button>
                </div>

                <div className="flex flex-col mt-0.5">
                  <span className="text-[14px] font-bold text-[#0F172A]">{planTitle}</span>
                  <span className="text-[12px] text-[#64748B] mt-0.5">
                    {applicationAllowance} applications per {intervalDisplay}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#E2E8F0] h-[6px] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                    style={{ width: `${clampedProgress}%` }}
                  />
                </div>

                {/* Usage Footnote */}
                <div className="flex items-center justify-between text-[11.5px] text-[#64748B]">
                  <span>{usedApplications} used</span>
                  <span>{remainingApplications} remaining</span>
                </div>
              </div>

              {/* 2. Bulk Auto Apply Action Card */}
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-2.5">
                {bulkApplyStatus && (
                  <div
                    className={`p-3 rounded-xl border text-[12.5px] font-medium flex items-center justify-between gap-2 ${
                      bulkApplyStatus.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : bulkApplyStatus.type === "warning" || bulkApplyStatus.type === "skipped"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    <span>{bulkApplyStatus.message}</span>
                    <button
                      type="button"
                      onClick={() => setBulkApplyStatus(null)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartBulkAutoApply}
                  disabled={selectedJobIds.length === 0 || isBulkApplying || isLoadingStatus}
                  className="h-[46px] w-full rounded-[12px] bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[14px] font-medium flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                >
                  {isLoadingStatus ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Checking application statuses...</span>
                    </>
                  ) : isBulkApplying ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Applying to {selectedJobIds.length} {selectedJobIds.length === 1 ? "Job" : "Jobs"}...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>
                        Start Auto Bulk Apply ({selectedJobIds.length} {selectedJobIds.length === 1 ? "Job" : "Jobs"})
                      </span>
                    </>
                  )}
                </button>

                <span className="text-[11.5px] text-[#94A3B8] text-center">
                  {selectedJobIds.length === 0
                    ? "Select up to 5 jobs to start bulk auto apply."
                    : `This will use ${selectedJobIds.length.toString().padStart(2, "0")} application${
                        selectedJobIds.length === 1 ? "" : "s"
                      } from your quota.`}
                </span>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Job Details Modal Popup */}
      {selectedJobModal && (
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
              <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-2">
                {selectedJobModal.logo && !isStaticLogo(selectedJobModal.logo) ? (
                  <div className="w-[44px] h-[44px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2 mt-0.5">
                    <img
                      src={selectedJobModal.logo}
                      alt={selectedJobModal.company}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.style.display = "none";
                        }
                      }}
                    />
                  </div>
                ) : null}

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
              <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedJobModal(null)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/resume-setup")}
                  className="mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                >
                  Enhance Resume
                </button>
              </div>
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
                      className={selectedJobModal.matchPercent >= 90 ? "text-[#0D9488]" : "text-[#D97706]"}
                      strokeDasharray={`${selectedJobModal.matchPercent || 96}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-bold text-[#0F172A] leading-none">
                      {selectedJobModal.matchPercent || 96}%
                    </span>
                    <span className="text-[9px] text-[#64748B] font-medium leading-none mt-0.5">
                      Match
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-[15px] font-bold text-[#0F172A]">ATS Match</h3>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5 leading-snug">
                    Strong match based on your profile, skills, experience and preferences.
                  </p>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h3 className="text-[14.5px] font-bold text-[#0F172A]">Job description</h3>
                <p className="text-[13px] text-[#475569] leading-relaxed mt-1.5">
                  {selectedJobModal.description || "No description available."}
                </p>
              </div>

              {/* Key Responsibilities */}
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A]">Key responsibilities:</h3>
                <ul className="space-y-2 mt-2">
                  {(selectedJobModal.responsibilities || []).map((resp, idx) => (
                    <li key={idx} className="text-[13px] text-[#475569] flex items-start gap-2 leading-snug">
                      <span className="text-[#94A3B8] shrink-0">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Skills */}
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A]">Required skills</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(selectedJobModal.requiredSkills || []).map((skill) => (
                    <span
                      key={skill}
                      className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Skills */}
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A]">Preferred skills</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(selectedJobModal.preferredSkills || []).map((skill) => (
                    <span
                      key={skill}
                      className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Details */}
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A] mb-2.5">Job details</h3>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-[#64748B]">Experience</span>
                    <span className="font-semibold text-[#0F172A]">{selectedJobModal.experience || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-[#64748B]">Work mode</span>
                    <span className="font-semibold text-[#0F172A]">{selectedJobModal.workMode || selectedJobModal.workplace || "Remote"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-[#64748B]">Employment type</span>
                    <span className="font-semibold text-[#0F172A]">{selectedJobModal.type || selectedJobModal.employmentType || "Full-time"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-[#64748B]">Location</span>
                    <span className="font-semibold text-[#0F172A]">{selectedJobModal.fullLocation || selectedJobModal.location || "Remote"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex flex-col gap-2.5">
              {panelApplyStatus && (
                <div
                  className={`p-3 rounded-xl border text-[12.5px] font-medium flex items-center justify-between gap-2 ${
                    panelApplyStatus.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : panelApplyStatus.type === "skipped"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <span>{panelApplyStatus.message}</span>
                  <button
                    type="button"
                    onClick={() => setPanelApplyStatus(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )}
              {(() => {
                if (isLoadingStatus) {
                  return (
                    <button
                      type="button"
                      disabled
                      className="w-full h-[44px] rounded-[12px] bg-slate-100 border border-slate-200 text-slate-400 text-[13.5px] font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Checking status...</span>
                    </button>
                  );
                }

                const isHidden = isApplyNowHiddenForJob(selectedJobModal, applicationMap, submittedJobIdSet);

                if (isHidden) {
                  const record = getMatchingApplicationForJob(selectedJobModal, applicationMap);
                  const rawStatus = record?.status || record?.state || record?.applicationStatus;
                  const norm = normalizeApplicationStatus(rawStatus);

                  let displayLabel = "Already Applied";
                  if (norm === "SUBMITTED") displayLabel = "Submitted";
                  else if (norm === "QUEUED") displayLabel = "Queued";
                  else if (norm === "IN_PROGRESS") displayLabel = "In Progress";
                  else if (norm === "NEEDS_ACTION") displayLabel = "Needs Action";
                  else if (norm === "PREPARING") displayLabel = "Preparing";

                  return (
                    <button
                      type="button"
                      disabled
                      className="w-full h-[44px] rounded-[12px] bg-slate-100 border border-slate-200 text-slate-500 text-[13.5px] font-semibold flex items-center justify-center cursor-not-allowed"
                    >
                      {displayLabel}
                    </button>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={handleApplyToPanelJob}
                    disabled={isApplyingPanelJob}
                    className="w-full h-[44px] rounded-[12px] bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-[13.5px] font-medium flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isApplyingPanelJob ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Submitting application...</span>
                      </span>
                    ) : (
                      <>
                        <span>Apply now</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                );
              })()}

              <p className="text-[11.5px] text-[#94A3B8] text-center">
                Your application quota will be reserved before submission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-6 md:right-8 z-[100] animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] ${
              toast.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : toast.type === "skipped" || toast.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === "error"
                  ? "bg-rose-100 text-rose-600"
                  : toast.type === "skipped" || toast.type === "warning"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[#E0E7FF] text-[#4F46E5]"
              }`}
            >
              {toast.type === "error" ? (
                <span className="text-sm font-bold">✕</span>
              ) : toast.type === "skipped" || toast.type === "warning" ? (
                <span className="text-sm font-bold">!</span>
              ) : (
                <span className="text-sm font-bold">✓</span>
              )}
            </div>
            <span className="text-[13px] font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast({ show: false, message: "", type: "success" })}
              className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoApply;
