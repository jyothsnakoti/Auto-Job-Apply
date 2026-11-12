import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import JobFilterBar from "../components/JobFilterBar";

import mapIcon from "../assets/map.svg";
import tickIcon from "../assets/tick.svg";


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
  extractNumericJobId,
  extractNumericResumeId,
  markJobsAsApplied,
  getApplicationStatuses,
  isJobSubmitted,
  isApplyNowHiddenForJob,
  getMatchingApplicationForJob,
  normalizeApplicationStatus,
} from "../services/api";
import {
  transformMatchToJob,
  buildJobQueryParams,
  buildBaseJobFilterKey,
  shouldFallbackToClientWorkplaceFilter,
  recordUnsupportedWorkplaces,
  hasUnsupportedWorkplaceTarget,
  hasAnyJobMatchingWorkplaces,
  resolveSelectedResumeId,
  findTargetResume,
  getStoredSelectedResumeId,
  getStoredSelectedResumeData,
  saveResumeSelection,
  extractDynamicJobFilterOptions,
  filterJobMatches,
  sortWorkplaceOptions,
} from "../utils/jobHelpers";

const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-[14px] h-[14px] object-contain shrink-0"
  />
);

const AutoApply = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedJobModal, setSelectedJobModal] = useState(null);

  const [selectedDate, setSelectedDate] = useState("All time");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedWorkplace, setSelectedWorkplace] = useState([]);
  const [knownWorkplaceOptions, setKnownWorkplaceOptions] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [sortOption, setSortOption] = useState("best_match");

  const dropdownRef = useRef(null);

  
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

 
  const [isApplyingPanelJob, setIsApplyingPanelJob] = useState(false);
  const [panelApplyStatus, setPanelApplyStatus] = useState(null);

  
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
          .catch(() => { });
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

 
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [bulkApplyStatus, setBulkApplyStatus] = useState(null);

  const handleStartBulkAutoApply = async () => {
    if (isBulkApplying) return;

    if (isLoadingStatus || isLoadingJobs || isLoadingPage) {
      showToast("Please wait while filtered jobs and application statuses finish loading...", "warning");
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

      // Map selected job IDs ONLY from currently filtered jobs and revalidate against submitted/active status
      const selectedJobsList = (allFilteredJobs || []).filter((j) =>
        selectedJobIds.includes(j.id)
      );
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
        const msg = "None of the selected jobs are eligible for submission (filtered out, already submitted, or active).";
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
            const matched =
              (allFilteredJobs || []).find((j) => j.id === id) ||
              (allCachedJobs || []).find((j) => j.id === id);
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
          .catch(() => { });
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

  // Dynamic Jobs State with Page-based Cache { [pageNumber]: [jobs] } (exact parity with BrowseJobs)
  const [jobsCache, setJobsCache] = useState({});
  const jobsCacheRef = useRef({});
  const [activePage, setActivePage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const fetchingPagesRef = useRef(new Map());
  const queryVersionRef = useRef(0);
  const navigationRequestRef = useRef(0);
  const fillingPagesRef = useRef(false);
  const autoFillTrackerRef = useRef({ key: "", count: 0 });
  const baseJobsCacheRef = useRef(null);
  const serverUnsupportedWorkplacesRef = useRef(new Set());
  const [isClientWorkplaceFilterActive, setIsClientWorkplaceFilterActive] = useState(false);
  const loadPageRef = useRef(null);

  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(() => getStoredSelectedResumeData());
  const [activeResumeId, setActiveResumeId] = useState(() => getStoredSelectedResumeId());

  const selectedResumeRef = useRef(selectedResume);
  const activeResumeIdRef = useRef(activeResumeId);
  const currentFilterSignature = JSON.stringify({
    searchQuery,
    sortOption,
    selectedLocations,
    selectedCompanies,
    selectedRoles,
    selectedWorkplace,
    selectedDate,
  });
  const lastFilterSignatureRef = useRef(currentFilterSignature);

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

  // Dynamic Page Loading with Page-based Cache & Generation Guards
  const loadPage = useCallback(
    async (
      pageNumber,
      {
        forceRefresh = false,
        customQuery = null,
        customSort = null,
        overrideFilters = null,
        customResumeId = null,
        restoreFromBaseIfAvailable = false,
        background = false,
      } = {}
    ) => {
      // Track active query version so force-refreshes supersede stale queries cleanly,
      // and track navigation request version so rapid foreground page clicks win over slower responses.
      const requestVersion = forceRefresh
        ? ++queryVersionRef.current
        : queryVersionRef.current;
      const navVersion = background
        ? navigationRequestRef.current
        : ++navigationRequestRef.current;

      const isCurrent = () => requestVersion === queryVersionRef.current;
      const isLatestNav = () =>
        isCurrent() && navVersion === navigationRequestRef.current;

      // 1. Check cache first (unless forceRefresh is requested)
      if (
        !forceRefresh &&
        Array.isArray(jobsCacheRef.current[pageNumber]) &&
        jobsCacheRef.current[pageNumber].length > 0
      ) {
        console.log(
          `[AutoApply] Page ${pageNumber} found in cache. Using cached data (NO API CALL).`
        );
        if (!background && isLatestNav()) {
          setActivePage(pageNumber);
          setIsLoadingJobs(false);
          setIsLoadingPage(false);
        }
        return jobsCacheRef.current[pageNumber];
      }

      const fetchKey = `${requestVersion}:${pageNumber}`;

      // Prevent duplicate concurrent requests for the same query version + page
      if (fetchingPagesRef.current.has(fetchKey)) {
        console.log(
          `[AutoApply] Request for page ${pageNumber} is already in flight. Skipping duplicate call.`
        );
        const existingPromise = fetchingPagesRef.current.get(fetchKey);
        if (!background && isLatestNav()) {
          setIsLoadingPage(true);
          try {
            return await existingPromise;
          } finally {
            if (isLatestNav()) {
              setIsLoadingJobs(false);
              setIsLoadingPage(false);
            }
          }
        }
        return existingPromise;
      }

      const activeWorkplaces =
        overrideFilters?.workplace ?? selectedWorkplace;
      const q = customQuery !== null ? customQuery : searchQuery;
      const sort = customSort !== null ? customSort : sortOption;
      const activeLocs = overrideFilters?.locations ?? selectedLocations;
      const activeRoles = overrideFilters?.roles ?? selectedRoles;
      const activeDate = overrideFilters?.date ?? selectedDate;
      const activeCompanies =
        overrideFilters?.companies ?? selectedCompanies;
      const apiPage = Math.max(0, pageNumber - 1); // 0-indexed for GET /api/jobs

      const applyBaseCacheEntry = (entry, clientFiltered) => {
        const nextPages = { ...(entry?.pages || {}) };
        jobsCacheRef.current = nextPages;
        setJobsCache(nextPages);
        const allBaseJobs = Object.keys(nextPages)
          .map(Number)
          .filter((n) => Number.isInteger(n) && n > 0)
          .sort((a, b) => a - b)
          .flatMap((p) => nextPages[p] || []);
        setKnownWorkplaceOptions(extractDynamicJobFilterOptions(allBaseJobs).workplaceOptions);
        setTotalItems(entry?.totalItems ?? allBaseJobs.length);
        setTotalPages(entry?.totalPages ?? 1);
        setHasMoreJobs(Boolean(entry?.hasMore));
        setIsClientWorkplaceFilterActive(Boolean(clientFiltered));
        if (!background && isLatestNav()) {
          setActivePage(pageNumber <= (entry?.totalPages || 1) ? pageNumber : 1);
        }
        return nextPages[pageNumber] || allBaseJobs;
      };

      const syncResumeIdHint =
        customResumeId ??
        selectedResumeRef.current?.id ??
        selectedResumeRef.current?.resumeId ??
        selectedResumeRef.current?._id ??
        selectedResumeRef.current?.fileId ??
        selectedResumeRef.current?.uuid ??
        selectedResumeRef.current?.resume_id ??
        activeResumeIdRef.current ??
        getStoredSelectedResumeId();

      const preCheckBaseKey = buildBaseJobFilterKey({
        resumeId: syncResumeIdHint,
        searchQuery: q,
        selectedLocations: activeLocs,
        selectedRoles: activeRoles,
        selectedCompanies: activeCompanies,
        selectedDate: activeDate,
        sortOption: sort || "best_match",
        pageSize: pageSize || 20,
      });

      const preBaseEntry =
        baseJobsCacheRef.current?.key === preCheckBaseKey ? baseJobsCacheRef.current : null;
      const isKnownUnsupportedPre = hasUnsupportedWorkplaceTarget({
        unsupportedSet: serverUnsupportedWorkplacesRef.current,
        activeWorkplaces,
      });

      if (preBaseEntry?.pages?.[pageNumber]) {
        if (
          (activeWorkplaces.length === 0 && restoreFromBaseIfAvailable) ||
          (activeWorkplaces.length > 0 &&
            (isKnownUnsupportedPre || (restoreFromBaseIfAvailable && !preBaseEntry.hasMore)))
        ) {
          if (!background) {
            setFetchError(null);
            if (isLatestNav()) {
              setIsLoadingJobs(false);
              setIsLoadingPage(false);
            }
          }
          return applyBaseCacheEntry(preBaseEntry, activeWorkplaces.length > 0);
        }
      }

      if (forceRefresh && pageNumber === 1) {
        jobsCacheRef.current = {};
        setJobsCache({});
      }
      if (!background) {
        if (
          pageNumber === 1 &&
          (forceRefresh || Object.keys(jobsCacheRef.current).length === 0)
        ) {
          setIsLoadingJobs(true);
        } else {
          setIsLoadingPage(true);
        }
        setFetchError(null);
      }

      let releaseFetchGate;
      const fetchGate = new Promise((resolve) => {
        releaseFetchGate = resolve;
      });

      const requestPromise = (async () => {
        await fetchGate;
        try {
          // Extract target resumeId for GET /api/jobs?resumeId=...
          let resumeIdVal = customResumeId;
          if (resumeIdVal === null || resumeIdVal === undefined) {
            resumeIdVal = await resolveSelectedResumeId({
              selectedResume: selectedResumeRef.current,
              activeResumeId: activeResumeIdRef.current,
            });
          }

          if (!isCurrent()) {
            return [];
          }

          const baseQueryKey = buildBaseJobFilterKey({
            resumeId: resumeIdVal,
            searchQuery: q,
            selectedLocations: activeLocs,
            selectedRoles: activeRoles,
            selectedCompanies: activeCompanies,
            selectedDate: activeDate,
            sortOption: sort || "best_match",
            pageSize: pageSize || 20,
          });
          const matchingBaseEntry =
            baseJobsCacheRef.current?.key === baseQueryKey ? baseJobsCacheRef.current : null;
          const baseJobsForRef = matchingBaseEntry
            ? Object.keys(matchingBaseEntry.pages || {})
                .map(Number)
                .filter((n) => Number.isInteger(n) && n > 0)
                .sort((a, b) => a - b)
                .flatMap((p) => matchingBaseEntry.pages[p] || [])
            : Object.keys(jobsCacheRef.current || {})
                .map(Number)
                .filter((n) => Number.isInteger(n) && n > 0)
                .sort((a, b) => a - b)
                .flatMap((p) => jobsCacheRef.current[p] || []);

          const shouldSendWorkplace =
            activeWorkplaces.length > 0 &&
            !hasUnsupportedWorkplaceTarget({
              unsupportedSet: serverUnsupportedWorkplacesRef.current,
              activeWorkplaces,
            });

          const buildUnfilteredParams = () =>
            buildJobQueryParams({
              resumeId: resumeIdVal,
              searchQuery: q,
              selectedLocations: activeLocs,
              selectedRoles: activeRoles,
              selectedWorkplace: [],
              selectedCompanies: activeCompanies,
              selectedDate: activeDate,
              sortOption: sort || "best_match",
              page: apiPage,
              pageSize: pageSize || 20,
            });

          const parsePagedResult = (resObj) => {
            const rawItems = resObj?.items || [];
            const mapped = rawItems
              .map((m, idx) => transformMatchToJob(m, apiPage * pageSize + idx))
              .filter(Boolean);
            const calcTotalItems =
              typeof resObj?.totalItems === "number" && resObj.totalItems >= 0
                ? resObj.totalItems
                : rawItems.length >= pageSize
                  ? (apiPage + 2) * pageSize
                  : apiPage * pageSize + rawItems.length;
            const calcTotalPages =
              typeof resObj?.totalPages === "number" && resObj.totalPages > 0
                ? resObj.totalPages
                : Math.max(1, Math.ceil(calcTotalItems / (pageSize || 20)));
            const calcHasMore =
              apiPage + 1 < calcTotalPages && rawItems.length >= pageSize;
            return {
              items: rawItems,
              transformed: mapped,
              resTotalItems: calcTotalItems,
              resTotalPages: calcTotalPages,
              hasMore: calcHasMore,
            };
          };

          try {
          const params = buildJobQueryParams({
            resumeId: resumeIdVal,
            searchQuery: q,
            selectedLocations: activeLocs,
            selectedRoles: activeRoles,
            selectedWorkplace: shouldSendWorkplace ? activeWorkplaces : [],
            selectedCompanies: activeCompanies,
            selectedDate: activeDate,
            sortOption: sort || "best_match",
            page: apiPage,
            pageSize: pageSize || 20,
            referenceJobs: baseJobsForRef,
          });

          console.log(
            `[AutoApply] Fetching Page ${pageNumber} (apiPage ${apiPage}) via GET /api/jobs with params:`,
            params
          );
          const res = await getJobs(params);

          if (!isCurrent()) {
            return [];
          }

          const {
            transformed,
            resTotalItems,
            resTotalPages,
            hasMore,
          } = parsePagedResult(res);

          // Seamless client workplace fallback if backend returns empty/partial for 'on-site' etc.
          if (shouldSendWorkplace) {
            const needFallback = shouldFallbackToClientWorkplaceFilter({
              activeWorkplaces,
              pageNumber,
              transformed,
              hasMoreServer: hasMore,
              baseJobs: baseJobsForRef,
            });

            if (needFallback && matchingBaseEntry?.pages?.[1]) {
              recordUnsupportedWorkplaces({
                unsupportedSet: serverUnsupportedWorkplacesRef.current,
                activeWorkplaces,
                transformed,
              });
              return applyBaseCacheEntry(matchingBaseEntry, true);
            }

            if (transformed.length === 0 && pageNumber === 1 && !matchingBaseEntry) {
              const unfilteredRes = await getJobs(buildUnfilteredParams());
              if (!isCurrent()) {
                return [];
              }
              const parsedUnfiltered = parsePagedResult(unfilteredRes);
              if (parsedUnfiltered.transformed.length > 0) {
                let unfilteredPages;
                let finalTotalItems = parsedUnfiltered.resTotalItems;
                let finalTotalPages = parsedUnfiltered.resTotalPages;
                let finalHasMore = parsedUnfiltered.hasMore;
                if (parsedUnfiltered.transformed.length > pageSize) {
                  unfilteredPages = {};
                  finalTotalPages = Math.ceil(parsedUnfiltered.transformed.length / pageSize);
                  for (let p = 1; p <= finalTotalPages; p++) {
                    unfilteredPages[p] = parsedUnfiltered.transformed.slice((p - 1) * pageSize, p * pageSize);
                  }
                  finalTotalItems = parsedUnfiltered.transformed.length;
                  finalHasMore = false;
                } else {
                  unfilteredPages = { 1: parsedUnfiltered.transformed };
                }
                const newBaseEntry = {
                  key: baseQueryKey,
                  pages: unfilteredPages,
                  totalItems: finalTotalItems,
                  totalPages: finalTotalPages,
                  hasMore: finalHasMore,
                };
                baseJobsCacheRef.current = newBaseEntry;
                if (hasAnyJobMatchingWorkplaces(parsedUnfiltered.transformed, activeWorkplaces)) {
                  recordUnsupportedWorkplaces({
                    unsupportedSet: serverUnsupportedWorkplacesRef.current,
                    activeWorkplaces,
                    transformed,
                  });
                }
                return applyBaseCacheEntry(newBaseEntry, true);
              }
            }
          }

          setHasMoreJobs(hasMore);
          setTotalItems(resTotalItems);
          setTotalPages(resTotalPages);

          if (transformed.length === 0) {
            if (
              pageNumber === 1 &&
              (forceRefresh || Object.keys(jobsCacheRef.current).length === 0)
            ) {
              jobsCacheRef.current = {};
              setJobsCache({});
              if (!shouldSendWorkplace) {
                baseJobsCacheRef.current = {
                  key: baseQueryKey,
                  pages: {},
                  totalItems: 0,
                  totalPages: 1,
                  hasMore: false,
                };
                setKnownWorkplaceOptions([]);
              }
              setIsClientWorkplaceFilterActive(false);
              if (!background && isLatestNav()) {
                setActivePage(1);
              }
              setTotalItems(0);
              setTotalPages(1);
              setHasMoreJobs(false);
              return [];
            } else if (pageNumber > 1) {
              setHasMoreJobs(false);
              setTotalPages((prev) => Math.min(prev, pageNumber - 1));
              if (!shouldSendWorkplace && matchingBaseEntry) {
                matchingBaseEntry.hasMore = false;
                matchingBaseEntry.totalPages = Math.min(
                  matchingBaseEntry.totalPages || pageNumber - 1,
                  pageNumber - 1
                );
              }
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
            if (!shouldSendWorkplace) {
              baseJobsCacheRef.current = {
                key: baseQueryKey,
                pages: chunked,
                totalItems: transformed.length,
                totalPages: chunkPages,
                hasMore: false,
              };
              setKnownWorkplaceOptions(
                extractDynamicJobFilterOptions(
                  Object.keys(chunked)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .flatMap((p) => chunked[p] || [])
                ).workplaceOptions
              );
              setIsClientWorkplaceFilterActive(activeWorkplaces.length > 0);
            } else {
              setIsClientWorkplaceFilterActive(false);
            }
            if (!background && isLatestNav()) {
              setActivePage(1);
            }
            setTotalItems(transformed.length);
            setTotalPages(chunkPages);
            setHasMoreJobs(false);
            return transformed;
          }

          // Cache page data
          const nextCache = forceRefresh
            ? { [pageNumber]: transformed }
            : { ...jobsCacheRef.current, [pageNumber]: transformed };
          jobsCacheRef.current = nextCache;
          setJobsCache((prev) => ({
            ...(forceRefresh ? {} : prev),
            [pageNumber]: transformed,
          }));
          if (!shouldSendWorkplace) {
            const nextBasePages =
              pageNumber === 1 && forceRefresh && !matchingBaseEntry
                ? { [pageNumber]: transformed }
                : { ...(matchingBaseEntry?.pages || {}), [pageNumber]: transformed };
            baseJobsCacheRef.current = {
              key: baseQueryKey,
              pages: nextBasePages,
              totalItems: resTotalItems,
              totalPages: resTotalPages,
              hasMore,
            };
            setKnownWorkplaceOptions(
              extractDynamicJobFilterOptions(
                Object.keys(nextBasePages)
                  .map(Number)
                  .filter((n) => Number.isInteger(n) && n > 0)
                  .sort((a, b) => a - b)
                  .flatMap((p) => nextBasePages[p] || [])
              ).workplaceOptions
            );
            setIsClientWorkplaceFilterActive(activeWorkplaces.length > 0);
          } else {
            setIsClientWorkplaceFilterActive(false);
          }
          if (!background && isLatestNav()) {
            setActivePage(pageNumber);
          }

          return transformed;
        } catch (err) {
          if (!isCurrent()) {
            return [];
          }
          console.error(
            `[AutoApply] Error fetching Page ${pageNumber} from GET /api/jobs:`,
            err
          );

          if (shouldSendWorkplace && pageNumber === 1 && !background) {
            if (matchingBaseEntry?.pages?.[1]) {
              recordUnsupportedWorkplaces({
                unsupportedSet: serverUnsupportedWorkplacesRef.current,
                activeWorkplaces,
                transformed: [],
              });
              setFetchError(null);
              return applyBaseCacheEntry(matchingBaseEntry, true);
            }
            try {
              const unfilteredRes = await getJobs(buildUnfilteredParams());
              if (!isCurrent()) {
                return [];
              }
              const parsedUnfiltered = parsePagedResult(unfilteredRes);
              const uPages =
                parsedUnfiltered.transformed.length > pageSize
                  ? (() => {
                      const chunked = {};
                      const cp = Math.ceil(parsedUnfiltered.transformed.length / pageSize);
                      for (let p = 1; p <= cp; p++) {
                        chunked[p] = parsedUnfiltered.transformed.slice((p - 1) * pageSize, p * pageSize);
                      }
                      return chunked;
                    })()
                  : { 1: parsedUnfiltered.transformed };
              const uTotalPages =
                parsedUnfiltered.transformed.length > pageSize
                  ? Object.keys(uPages).length
                  : parsedUnfiltered.resTotalPages;
              const uTotalItems =
                parsedUnfiltered.transformed.length > pageSize
                  ? parsedUnfiltered.transformed.length
                  : parsedUnfiltered.resTotalItems;
              const uHasMore =
                parsedUnfiltered.transformed.length > pageSize ? false : parsedUnfiltered.hasMore;
              const newBaseEntry = {
                key: baseQueryKey,
                pages: uPages,
                totalItems: uTotalItems,
                totalPages: uTotalPages,
                hasMore: uHasMore,
              };
              baseJobsCacheRef.current = newBaseEntry;
              recordUnsupportedWorkplaces({
                unsupportedSet: serverUnsupportedWorkplacesRef.current,
                activeWorkplaces,
                transformed: [],
              });
              setFetchError(null);
              return applyBaseCacheEntry(newBaseEntry, true);
            } catch {
              // Fall through to normal error handling
            }
          }

          if (!background) {
            const msg =
              err?.response?.data?.message ||
              err?.message ||
              "Unable to load jobs. Please try again.";
            setFetchError(msg);
            if (
              pageNumber === 1 &&
              Object.keys(jobsCacheRef.current).length === 0
            ) {
              jobsCacheRef.current = {};
              setJobsCache({});
              if (!shouldSendWorkplace) {
                setKnownWorkplaceOptions([]);
              }
            }
          }
          return [];
          }
        } finally {
          if (fetchingPagesRef.current.get(fetchKey) === requestPromise) {
            fetchingPagesRef.current.delete(fetchKey);
          }
          if (!background && isLatestNav()) {
            setIsLoadingJobs(false);
            setIsLoadingPage(false);
          }
        }
      })();

      fetchingPagesRef.current.set(fetchKey, requestPromise);
      releaseFetchGate();
      return requestPromise;
    },
    [
      searchQuery,
      sortOption,
      selectedLocations,
      selectedRoles,
      selectedWorkplace,
      selectedCompanies,
      selectedDate,
      pageSize,
    ]
  );

  useEffect(() => {
    loadPageRef.current = loadPage;
  }, [loadPage]);

  useEffect(() => {
    selectedResumeRef.current = selectedResume;
  }, [selectedResume]);

  useEffect(() => {
    activeResumeIdRef.current = activeResumeId;
  }, [activeResumeId]);

  // Initial & route-entry load: always initialize/reset pagination to Page 1 and fetch Page 1 once
  useEffect(() => {
    let isActive = true;
    const fetchingPages = fetchingPagesRef.current;

    const init = async () => {
      queryVersionRef.current += 1;
      navigationRequestRef.current += 1;
      const mountVersion = queryVersionRef.current;
      fetchingPages.clear();
      fillingPagesRef.current = false;
      autoFillTrackerRef.current = { key: "", count: 0 };
      baseJobsCacheRef.current = null;
      jobsCacheRef.current = {};
      setJobsCache({});
      setKnownWorkplaceOptions([]);
      setIsClientWorkplaceFilterActive(false);
      setActivePage(1);
      setTotalItems(0);
      setTotalPages(1);
      setHasMoreJobs(true);
      setSelectedJobIds([]);
      setFetchError(null);
      setIsLoadingJobs(true);
      setIsLoadingPage(false);

      const resId = await fetchUserResumes();
      if (
        isActive &&
        mountVersion === queryVersionRef.current &&
        loadPageRef.current
      ) {
        await loadPageRef.current(1, {
          forceRefresh: true,
          customResumeId: resId,
        });
      }
    };

    init();

    return () => {
      isActive = false;
      queryVersionRef.current += 1;
      navigationRequestRef.current += 1;
      fetchingPages.clear();
      fillingPagesRef.current = false;
      autoFillTrackerRef.current = { key: "", count: 0 };
    };
  }, [fetchUserResumes, location.pathname, location.key]);

  // Re-fetch page 1 whenever search query, filters, or sort change (never duplicates initial load)
  useEffect(() => {
    if (lastFilterSignatureRef.current === currentFilterSignature) {
      return;
    }
    lastFilterSignatureRef.current = currentFilterSignature;
    queryVersionRef.current += 1;
    navigationRequestRef.current += 1;
    fetchingPagesRef.current.clear();
    fillingPagesRef.current = false;
    autoFillTrackerRef.current = { key: "", count: 0 };
    jobsCacheRef.current = {};
    setJobsCache({});
    setActivePage(1);
    setTotalPages(1);
    if (loadPageRef.current) {
      loadPageRef.current(1, {
        forceRefresh: true,
        restoreFromBaseIfAvailable: true,
        customQuery: searchQuery,
        customSort: sortOption,
        overrideFilters: {
          locations: selectedLocations,
          companies: selectedCompanies,
          roles: selectedRoles,
          workplace: selectedWorkplace,
          date: selectedDate,
        },
      });
    }
  }, [
    currentFilterSignature,
    searchQuery,
    sortOption,
    selectedLocations,
    selectedCompanies,
    selectedRoles,
    selectedWorkplace,
    selectedDate,
  ]);

  // Refresh jobs when the selected resume changes in BrowseJobs or elsewhere
  useEffect(() => {
    const handleResumeChange = async (e) => {
      const newResumeId = e?.detail?.resumeId || getStoredSelectedResumeId();
      if (newResumeId && String(newResumeId) !== String(activeResumeIdRef.current)) {
        console.log(`[AutoApply] Selected resume changed from ${activeResumeIdRef.current} to ${newResumeId}. Refreshing jobs...`);
        queryVersionRef.current += 1;
        navigationRequestRef.current += 1;
        fetchingPagesRef.current.clear();
        fillingPagesRef.current = false;
        autoFillTrackerRef.current = { key: "", count: 0 };
        const changeVersion = queryVersionRef.current;
        const resId = await fetchUserResumes();
        if (changeVersion !== queryVersionRef.current) return;
        baseJobsCacheRef.current = null;
        serverUnsupportedWorkplacesRef.current.clear();
        setIsClientWorkplaceFilterActive(false);
        jobsCacheRef.current = {};
        setJobsCache({});
        setKnownWorkplaceOptions([]);
        setActivePage(1);
        setTotalPages(1);
        if (loadPageRef.current) {
          await loadPageRef.current(1, { forceRefresh: true, customResumeId: resId || newResumeId });
        }
      }
    };

    const handleJobMatchesUpdated = async () => {
      queryVersionRef.current += 1;
      navigationRequestRef.current += 1;
      fetchingPagesRef.current.clear();
      fillingPagesRef.current = false;
      autoFillTrackerRef.current = { key: "", count: 0 };
      const updateVersion = queryVersionRef.current;
      const resId = await fetchUserResumes();
      if (updateVersion !== queryVersionRef.current) return;
      baseJobsCacheRef.current = null;
      serverUnsupportedWorkplacesRef.current.clear();
      setIsClientWorkplaceFilterActive(false);
      jobsCacheRef.current = {};
      setJobsCache({});
      setKnownWorkplaceOptions([]);
      setActivePage(1);
      setTotalPages(1);
      if (loadPageRef.current) {
        await loadPageRef.current(1, { forceRefresh: true, customResumeId: resId });
      }
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
  }, [fetchUserResumes]);

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
  const alreadyDefault =
    !searchQuery &&
    selectedDate === "All time" &&
    selectedLocations.length === 0 &&
    selectedWorkplace.length === 0 &&
    selectedCompanies.length === 0 &&
    selectedRoles.length === 0 &&
    sortOption === "best_match";

  setSearchQuery("");
  setSelectedDate("All time");
  setSelectedLocations([]);
  setLocationSearch("");
  setSelectedWorkplace([]);
  setSelectedCompanies([]);
  setCompanySearch("");
  setSelectedRoles([]);
  setSortOption("best_match");
  setActiveDropdown(null);
  setActivePage(1);
  queryVersionRef.current += 1;
  navigationRequestRef.current += 1;
  fetchingPagesRef.current.clear();
  fillingPagesRef.current = false;
  autoFillTrackerRef.current = { key: "", count: 0 };
  baseJobsCacheRef.current = null;
  serverUnsupportedWorkplacesRef.current.clear();
  setIsClientWorkplaceFilterActive(false);

  if (alreadyDefault) {
    jobsCacheRef.current = {};
    setJobsCache({});
    setTotalPages(1);
    if (loadPageRef.current) {
      loadPageRef.current(1, {
        forceRefresh: true,
        customQuery: "",
        customSort: "best_match",
        overrideFilters: {
          locations: [],
          companies: [],
          roles: [],
          workplace: [],
          date: "All time",
        },
      });
    }
  }
};

const handleApplySearchAndFilters = () => {
  setActiveDropdown(null);
  setActivePage(1);
  lastFilterSignatureRef.current = currentFilterSignature;
  queryVersionRef.current += 1;
  navigationRequestRef.current += 1;
  fetchingPagesRef.current.clear();
  fillingPagesRef.current = false;
  autoFillTrackerRef.current = { key: "", count: 0 };
  baseJobsCacheRef.current = null;
  jobsCacheRef.current = {};
  setJobsCache({});
  setTotalPages(1);
  if (loadPageRef.current) {
    loadPageRef.current(1, { forceRefresh: true });
  }
};

const hasActiveFilters = Boolean(
  searchQuery.trim() ||
    (selectedDate && selectedDate !== "All time") ||
    selectedLocations.length > 0 ||
    selectedRoles.length > 0 ||
    selectedWorkplace.length > 0 ||
    selectedCompanies.length > 0
);

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

  // Sorted cached page keys & flattened cached jobs across all loaded pages
  const cachedPageNumbers = useMemo(() => {
    return Object.keys(jobsCache)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => a - b);
  }, [jobsCache]);

  const allCachedJobs = useMemo(() => {
    return cachedPageNumbers.flatMap((pageNum) => jobsCache[pageNum] || []);
  }, [cachedPageNumbers, jobsCache]);

  // Dynamically extract filter options from cached jobs (exact parity with BrowseJobs, preserving selected items)
  const {
    companyOptions: dynamicCompanyOptions,
    roleOptions: dynamicRoleOptions,
    locationOptions: dynamicLocationOptions,
    workplaceOptions: extractedWorkplaceOptions,
  } = useMemo(() => {
    return extractDynamicJobFilterOptions(allCachedJobs, {
      selectedLocations,
      selectedCompanies,
      selectedRoles,
      selectedWorkplace,
    });
  }, [
    allCachedJobs,
    selectedLocations,
    selectedCompanies,
    selectedRoles,
    selectedWorkplace,
  ]);

  const dynamicWorkplaceOptions = useMemo(() => {
    if (selectedWorkplace.length === 0) {
      return extractedWorkplaceOptions;
    }
    return sortWorkplaceOptions([
      ...knownWorkplaceOptions,
      ...extractedWorkplaceOptions,
      ...selectedWorkplace,
    ]);
  }, [knownWorkplaceOptions, extractedWorkplaceOptions, selectedWorkplace]);

  // Per-page filtered jobs map + combined filtered list across loaded pages
  const filteredPagesMap = useMemo(() => {
    const map = new Map();
    const filterCriteria = {
      searchQuery,
      selectedDate,
      selectedLocations,
      selectedCompanies,
      selectedRoles,
      selectedWorkplace,
    };
    const filterOptions = {
      isSubmittedFn: (job) =>
        isJobSubmitted(job, submittedJobIdSet, applicationMap),
    };

    for (const pageNum of cachedPageNumbers) {
      map.set(
        pageNum,
        filterJobMatches(jobsCache[pageNum] || [], filterCriteria, filterOptions)
      );
    }
    return map;
  }, [
    cachedPageNumbers,
    jobsCache,
    submittedJobIdSet,
    applicationMap,
    searchQuery,
    selectedDate,
    selectedLocations,
    selectedCompanies,
    selectedRoles,
    selectedWorkplace,
  ]);

  const allFilteredJobs = useMemo(() => {
    return cachedPageNumbers.flatMap(
      (pageNum) => filteredPagesMap.get(pageNum) || []
    );
  }, [cachedPageNumbers, filteredPagesMap]);

  // Derived total pages & clamped active page without setState cascading effects
  const totalFilteredPages = Math.max(
    1,
    Math.ceil(allFilteredJobs.length / pageSize)
  );
  const displayTotalPages =
    isClientWorkplaceFilterActive && !hasMoreJobs
      ? totalFilteredPages
      : Math.max(1, totalPages);
  const effectiveActivePage =
    !isLoadingJobs &&
    !isLoadingPage &&
    activePage > displayTotalPages &&
    displayTotalPages > 0
      ? displayTotalPages
      : activePage;

  // Compute displayed slice for effectiveActivePage:
  // - In client-side workplace fallback mode with a contiguous loaded prefix 1..effectiveActivePage,
  //   slice compacted list at (effectiveActivePage - 1) * pageSize.
  // - In standard server-paginated mode (and direct page jumps), anchor to effectiveActivePage
  //   so submitted jobs on earlier pages never shift or empty out Page P's results.
  const pageSliceState = useMemo(() => {
    if (isClientWorkplaceFilterActive) {
      let isPrefixContiguous = true;
      for (let p = 1; p <= effectiveActivePage; p += 1) {
        if (!filteredPagesMap.has(p)) {
          isPrefixContiguous = false;
          break;
        }
      }

      if (isPrefixContiguous) {
        const prefixFiltered = [];
        let prefixEnd = 0;
        for (let p = 1; filteredPagesMap.has(p); p += 1) {
          prefixFiltered.push(...(filteredPagesMap.get(p) || []));
          prefixEnd = p;
        }
        const startIdx = (effectiveActivePage - 1) * pageSize;
        const slice = prefixFiltered.slice(startIdx, startIdx + pageSize);
        const shortfall = Math.max(0, pageSize - slice.length);
        return {
          displayedJobs: slice,
          shortfallCount: shortfall,
          nextFillPage: shortfall > 0 && prefixEnd > 0 ? prefixEnd + 1 : null,
        };
      }
    }

    if (filteredPagesMap.has(effectiveActivePage)) {
      const blockFiltered = [];
      let blockEnd = effectiveActivePage - 1;
      for (let p = effectiveActivePage; filteredPagesMap.has(p); p += 1) {
        blockFiltered.push(...(filteredPagesMap.get(p) || []));
        blockEnd = p;
      }
      const slice = blockFiltered.slice(0, pageSize);
      const shortfall = Math.max(0, pageSize - slice.length);
      return {
        displayedJobs: slice,
        shortfallCount: shortfall,
        nextFillPage:
          shortfall > 0 && blockEnd >= effectiveActivePage ? blockEnd + 1 : null,
      };
    }

    return {
      displayedJobs: [],
      shortfallCount: 0,
      nextFillPage: null,
    };
  }, [filteredPagesMap, effectiveActivePage, pageSize, isClientWorkplaceFilterActive]);

  const { displayedJobs } = pageSliceState;

  // Bounded background backfill when submitted/client-filtered jobs leave empty slots on the current page.
  // Uses background: true so it NEVER alters activePage and stops after a tight page cap.
  useEffect(() => {
    if (
      isLoadingJobs ||
      isLoadingPage ||
      isLoadingStatus ||
      fetchError ||
      fillingPagesRef.current ||
      !hasMoreJobs
    ) {
      return;
    }

    if (!filteredPagesMap.has(effectiveActivePage)) {
      return;
    }

    const { shortfallCount, nextFillPage } = pageSliceState;
    if (shortfallCount <= 0 || !nextFillPage || nextFillPage > totalPages) {
      return;
    }

    const version = queryVersionRef.current;
    const scopeKey = `${version}:${effectiveActivePage}`;
    const currentTracker =
      autoFillTrackerRef.current.key === scopeKey
        ? autoFillTrackerRef.current
        : { key: scopeKey, count: 0 };

    const maxAutoFillPages = isClientWorkplaceFilterActive ? 5 : 2;
    if (currentTracker.count >= maxAutoFillPages) {
      return;
    }

    const fetchKey = `${version}:${nextFillPage}`;
    if (fetchingPagesRef.current.has(fetchKey)) {
      return;
    }

    autoFillTrackerRef.current = {
      key: scopeKey,
      count: currentTracker.count + 1,
    };

    let cancelled = false;
    const fillShortfall = async () => {
      fillingPagesRef.current = true;
      try {
        if (!cancelled && version === queryVersionRef.current && loadPageRef.current) {
          await loadPageRef.current(nextFillPage, { background: true });
        }
      } finally {
        fillingPagesRef.current = false;
      }
    };

    fillShortfall();

    return () => {
      cancelled = true;
    };
  }, [
    pageSliceState,
    filteredPagesMap,
    effectiveActivePage,
    hasMoreJobs,
    isLoadingJobs,
    isLoadingPage,
    isLoadingStatus,
    fetchError,
    totalPages,
    isClientWorkplaceFilterActive,
  ]);

  // Determine dynamic visible pages for pagination controls
  const visiblePages = useMemo(() => {
    const highestPage = Math.max(1, displayTotalPages);
    if (highestPage <= 5) {
      return Array.from({ length: highestPage }, (_, i) => i + 1);
    }
    let start = Math.max(1, effectiveActivePage - 2);
    let end = Math.min(highestPage, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [displayTotalPages, effectiveActivePage]);

  // Handle Page Change with immediate active page selection, cache check, and single-page API fetch
  const handlePageChange = (targetPage) => {
    if (
      !Number.isInteger(targetPage) ||
      targetPage < 1 ||
      targetPage > displayTotalPages ||
      targetPage === effectiveActivePage ||
      isLoadingJobs
    ) {
      return;
    }

    navigationRequestRef.current += 1;
    setActivePage(targetPage);

    const hasDirectCachedPage =
      Array.isArray(jobsCacheRef.current[targetPage]) &&
      jobsCacheRef.current[targetPage].length > 0;
    const canResolveFromLoadedPrefix =
      isClientWorkplaceFilterActive && !hasMoreJobs;

    if (hasDirectCachedPage || canResolveFromLoadedPrefix) {
      setIsLoadingPage(false);
      return;
    }

    loadPage(targetPage);
  };

  // All selectable jobs across filtered results (excludes submitted and active in-progress jobs)
  const selectableFilteredJobs = useMemo(() => {
    return allFilteredJobs.filter(
      (job) => !isApplyNowHiddenForJob(job, applicationMap, submittedJobIdSet)
    );
  }, [allFilteredJobs, applicationMap, submittedJobIdSet]);

  // Selectable jobs on current page (excludes submitted and active in-progress jobs)
  const selectableJobsOnPage = useMemo(() => {
    return displayedJobs.filter(
      (job) => !isApplyNowHiddenForJob(job, applicationMap, submittedJobIdSet)
    );
  }, [displayedJobs, applicationMap, submittedJobIdSet]);

  // Reconcile selectedJobIds once filtered results finish loading:
  // preserve already-selected jobs that remain in filtered results and remove hidden/filtered-out/submitted jobs.
  useEffect(() => {
    if (isLoadingJobs || isLoadingPage || fetchError) return;
    const validFilteredIds = new Set(selectableFilteredJobs.map((j) => j.id));
    setSelectedJobIds((prev) => {
      const next = prev.filter((id) => validFilteredIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [selectableFilteredJobs, isLoadingJobs, isLoadingPage, fetchError]);

  const isAllSelected =
    selectableJobsOnPage.length > 0 &&
    selectableJobsOnPage.slice(0, 5).every((j) => selectedJobIds.includes(j.id));
  const isIndeterminate = selectedJobIds.length > 0 && !isAllSelected;

  const toggleJobSelection = (id) => {
    if (selectedJobIds.includes(id)) {
      setSelectedJobIds((prev) => prev.filter((jId) => jId !== id));
      return;
    }

    const targetJob =
      displayedJobs.find((j) => j.id === id) ||
      allFilteredJobs.find((j) => j.id === id);
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
      const sourceList =
        selectableJobsOnPage.length > 0
          ? selectableJobsOnPage
          : selectableFilteredJobs;
      setSelectedJobIds(sourceList.slice(0, 5).map((j) => j.id));
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
        <JobFilterBar
          dropdownRef={dropdownRef}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchEnter={handleApplySearchAndFilters}
          onClear={handleClear}
          activeDropdown={activeDropdown}
          onToggleDropdown={toggleDropdown}
          selectedDate={selectedDate}
          onSelectDate={(opt) => {
            setSelectedDate(opt);
            setActiveDropdown(null);
          }}
          selectedLocations={selectedLocations}
          locationSearch={locationSearch}
          onLocationSearchChange={setLocationSearch}
          locationOptions={dynamicLocationOptions}
          onToggleLocation={(loc) =>
            toggleCheckbox(selectedLocations, setSelectedLocations, loc)
          }
          selectedRoles={selectedRoles}
          roleOptions={dynamicRoleOptions}
          onToggleRole={(role) =>
            toggleCheckbox(selectedRoles, setSelectedRoles, role)
          }
          selectedWorkplace={selectedWorkplace}
          workplaceOptions={dynamicWorkplaceOptions}
          onToggleWorkplace={(wp) =>
            toggleCheckbox(selectedWorkplace, setSelectedWorkplace, wp)
          }
          selectedCompanies={selectedCompanies}
          companySearch={companySearch}
          onCompanySearchChange={setCompanySearch}
          companyOptions={dynamicCompanyOptions}
          onToggleCompany={(comp) =>
            toggleCheckbox(selectedCompanies, setSelectedCompanies, comp)
          }
          sortOption={sortOption}
          onSelectSort={(newSort) => {
            setActiveDropdown(null);
            if (newSort !== sortOption) {
              setSortOption(newSort);
            }
          }}
        />

        {/* Error Banners */}
        {fetchError && (
          <div className="p-4 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-[13px] font-medium flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                !
              </span>
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                fetchingPagesRef.current.clear();
                fillingPagesRef.current = false;
                autoFillTrackerRef.current = { key: "", count: 0 };
                baseJobsCacheRef.current = null;
                loadPage(effectiveActivePage, { forceRefresh: true });
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {statusError && (
          <div className="p-4 rounded-[14px] bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-medium flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                !
              </span>
              <span>Application Status Error: {statusError}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchApplicationStatuses(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
            >
              Retry Loading Statuses
            </button>
          </div>
        )}

        {/* Main 2-Column Content: Left Jobs Selection List + Right Plan & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">

          {/* Left Column (8 cols): Select Jobs to Auto Apply Card + Pagination */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-4">

              {/* Card Header with Select top 5 moved above */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight">
                    Select Jobs to Bulk Apply
                  </h2>
                  <p className="text-[13px] text-[#64748B]">
                    Choose from your matched jobs or use filters to find more opportunities.
                  </p>
                </div>

                {(selectableJobsOnPage.length > 0 || selectedJobIds.length > 0) && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-[12.5px] sm:text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer transition-colors shrink-0 pt-0.5"
                  >
                    {selectedJobIds.length > 0 ? "Unselect all" : `Select top ${Math.min(5, selectableJobsOnPage.length)}`}
                  </button>
                )}
              </div>

              {/* Status Header: Select All on left, ATS heading above ATS donut scores */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  disabled={selectableJobsOnPage.length === 0 && selectedJobIds.length === 0}
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
                  <span className="font-bold text-[#0F172A]">{selectedJobIds.length} of {Math.min(5, selectableFilteredJobs.length)} jobs selected (max 5)</span>
                </button>

                {/* Column Heading for ATS Donut Score */}
                <div className="w-[44px] text-center shrink-0">
                  <span className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
                    ATS
                  </span>
                </div>
              </div>

              {/* Job List Container */}
              <div className={`flex flex-col divide-y divide-slate-100 mt-1 ${isLoadingPage && displayedJobs.length > 0 ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}`}>
                {isLoadingJobs || isLoadingStatus || (isLoadingPage && displayedJobs.length === 0) ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[13.5px] font-medium text-[#64748B]">Loading job matches and application statuses...</p>
                  </div>
                ) : allFilteredJobs.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                    </div>
                    <p className="text-[14px] font-semibold text-[#0F172A]">
                      {hasActiveFilters
                        ? "No matching jobs found"
                        : allCachedJobs.length > 0 && hasMoreJobs && displayTotalPages > 1
                          ? "All jobs on loaded pages already submitted"
                          : allCachedJobs.length > 0
                            ? "All matched jobs already submitted"
                            : "No job matches available"}
                    </p>
                    <p className="text-[12.5px] text-[#64748B] max-w-sm">
                      {hasActiveFilters
                        ? "No jobs match your current search or filter options. Try clearing or broadening your filters."
                        : allCachedJobs.length > 0 && hasMoreJobs && displayTotalPages > 1
                          ? "All jobs loaded on this page already have submitted applications. Use pagination below to browse additional pages."
                          : allCachedJobs.length > 0
                            ? "All matched jobs currently have submitted applications. Check your Applications dashboard for updates."
                            : "Upload your resume in Profile to view and select job matches for Auto Apply."}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="mt-2 text-[13px] font-semibold text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    ) : allCachedJobs.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="mt-2 text-[13px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Go to Profile
                      </button>
                    ) : null}
                  </div>
                ) : displayedJobs.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-[13.5px] font-medium text-[#64748B]">No jobs on this page.</p>
                  </div>
                ) : (
                  displayedJobs.map((job) => {
                    const isSelected = selectedJobIds.includes(job.id);
                    const isHidden = isApplyNowHiddenForJob(job, applicationMap, submittedJobIdSet);
                    const appRecord = getMatchingApplicationForJob(job, applicationMap);
                    const normStatus = normalizeApplicationStatus(appRecord?.status || appRecord?.state || appRecord?.applicationStatus);

                    return (
                      <div
                        key={job.id}
                        className={`py-4.5 flex items-center justify-between gap-4 -mx-6 px-6 transition-colors group ${isHidden ? "bg-slate-50/40 cursor-default opacity-85" : "hover:bg-slate-50/70 cursor-pointer"
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
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${normStatus === "QUEUED"
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
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${isSelected
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

            {/* Bottom Pagination Card (Parity with BrowseJobs) */}
            {(allFilteredJobs.length > 0 ||
              (displayTotalPages > 1 &&
                (isLoadingPage ||
                  (!isClientWorkplaceFilterActive && hasMoreJobs && allCachedJobs.length > 0)))) && (
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] px-5 py-3.5 flex items-center justify-between flex-wrap gap-4 shadow-[0_1px_3px_rgba(15,23,42,0.02)] mt-1">
                {/* Left Side: Dynamic Loaded Jobs Count Text */}
                <span className="text-[13px] sm:text-[13.5px] font-medium text-[#475569]">
                  {(() => {
                    const currentCount = displayedJobs.length;
                    const startIdx = currentCount > 0 ? (effectiveActivePage - 1) * pageSize + 1 : 0;
                    const endIdx = currentCount > 0 ? startIdx + currentCount - 1 : 0;
                    const displayTotal =
                      isClientWorkplaceFilterActive && !hasMoreJobs
                        ? allFilteredJobs.length
                        : totalItems > allFilteredJobs.length
                          ? totalItems
                          : allFilteredJobs.length;

                    return currentCount > 0
                      ? `Showing ${startIdx}–${endIdx} of ${displayTotal} jobs (Page ${effectiveActivePage} of ${displayTotalPages})`
                      : `Showing 0 of ${displayTotal} jobs (Page ${effectiveActivePage} of ${displayTotalPages})`;
                  })()}
                </span>

                {/* Right Side: Pagination Controls (< 1 2 3 >) */}
                <div className="flex items-center gap-1.5">
                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(effectiveActivePage - 1)}
                    disabled={effectiveActivePage <= 1 || isLoadingJobs}
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
                    const isActive = effectiveActivePage === pg;
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => handlePageChange(pg)}
                        disabled={isLoadingJobs || (isLoadingPage && isActive)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#2563EB] text-white shadow-xs"
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
                    onClick={() => handlePageChange(effectiveActivePage + 1)}
                    disabled={effectiveActivePage >= displayTotalPages || isLoadingJobs}
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
            )}
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
                          className={`p-3 rounded-xl border text-[12.5px] font-medium flex items-center justify-between gap-2 ${bulkApplyStatus.type === "success"
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
                        disabled={selectedJobIds.length === 0 || isBulkApplying || isLoadingStatus || isLoadingJobs || isLoadingPage}
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
                              Start Bulk Apply ({selectedJobIds.length} {selectedJobIds.length === 1 ? "Job" : "Jobs"})
                            </span>
                          </>
                        )}
                      </button>

                      <span className="text-[11.5px] text-[#94A3B8] text-center">
                        {selectedJobIds.length === 0
                          ? "Select up to 5 jobs to start bulk  apply."
                          : `This will use ${selectedJobIds.length.toString().padStart(2, "0")} application${selectedJobIds.length === 1 ? "" : "s"
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
                          <span>{selectedJobModal.workMode || "On-Site"}</span>
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
                        className={`p-3 rounded-xl border text-[12.5px] font-medium flex items-center justify-between gap-2 ${panelApplyStatus.type === "success"
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] ${toast.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : toast.type === "skipped" || toast.type === "warning"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]"
                    }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toast.type === "error"
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
