import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import JobFilterBar from "../components/JobFilterBar";
import {
  JOB_WORKPLACE_OPTIONS,
  getJobWorkplace,
  matchesJobDateFilter,
  normalizeWorkplaceValue,
  sortWorkplaceOptions,
} from "../utils/jobHelpers";
import {
  X,
  Briefcase,
  Mail,
  MapPin,
  Check,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  getC2CJobs,
  formatC2CJob,
  resolveActiveResumeId,
  applyToC2CJobs,
  getStoredC2CAppliedJobIds,
} from "../services/api";

// Helper to determine if a job originates from Email (Vendor) vs Job Portal
const isEmailVendorJob = (job) => {
  const route = String(job?.route || "").trim().toUpperCase();
  if (route.includes("EMAIL") || route.includes("VENDOR")) return true;
  const src = String(job?.sourceType || job?.source || "").trim().toLowerCase();
  return src.includes("email") || src.includes("vendor");
};

// Verified Tick Component
const VerifiedBadge = () => (
  <span
    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#3B82F6] text-white shrink-0"
    title="Verified Company"
  >
    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

const C2CJobs = () => {
  // Jobs List State
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeResumeId, setActiveResumeId] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("All time");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedWorkplace, setSelectedWorkplace] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");

  // Open dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Job Details Modal
  const [selectedJobModal, setSelectedJobModal] = useState(null);

  // Enhanced Resume Modal
const [showEnhancedResumeModal, setShowEnhancedResumeModal] = useState(false);
const [emailNotConnected, setEmailNotConnected] = useState(false);

  // Application States
  const [appliedJobIds, setAppliedJobIds] = useState(() => {
    try {
      const hasReset = localStorage.getItem("c2c_applied_reset_v2");
      if (!hasReset) {
        localStorage.removeItem("c2c_applied_job_ids");
        localStorage.setItem("c2c_applied_reset_v2", "true");
        return [];
      }
      const stored = localStorage.getItem("c2c_applied_job_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [applyingJobIds, setApplyingJobIds] = useState({});

  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
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

  // Sync appliedJobIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("c2c_applied_job_ids", JSON.stringify(appliedJobIds));
    } catch (e) {
      console.warn("Could not cache applied C2C jobs:", e);
    }
  }, [appliedJobIds]);

  // Fetch C2C Jobs from real API using active resume ID
  const fetchApiJobs = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const resId = await resolveActiveResumeId();
      setActiveResumeId(resId);

      const res = await getC2CJobs({ resumeId: resId, page: 0, size: 20 });
      const rawList = res?.items || [];
      const formatted = rawList.map((item, idx) => formatC2CJob(item, idx, resId));
      setJobs(formatted);

      // Collect any jobs that are already applied according to the backend
      const backendApplied = rawList
        .filter((item) => {
          const j = item?.job || item || {};
          return Boolean(
            item?.applied ||
            item?.isApplied ||
            item?.hasApplied ||
            j?.applied ||
            j?.isApplied ||
            j?.hasApplied ||
            String(item?.status || '').toUpperCase() === 'APPLIED' ||
            String(j?.status || '').toUpperCase() === 'APPLIED' ||
            String(item?.applicationStatus || '').toUpperCase() === 'APPLIED' ||
            String(j?.applicationStatus || '').toUpperCase() === 'APPLIED'
          );
        })
        .map((item) => (item?.job?.jobId || item?.job?.id || item?.jobId || item?.id))
        .filter(Boolean);

      if (backendApplied.length > 0) {
        setAppliedJobIds((prev) => Array.from(new Set([...prev.map(String), ...backendApplied.map(String)])));
      }
    } catch (err) {
      console.error("[C2CJobs] Error fetching C2C jobs:", err);
      setFetchError(err?.message || "Unable to load C2C jobs. Please check your connection or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiJobs();
  }, []);

  const toggleCheckbox = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Filter Dropdown Options
  const locationOptions = useMemo(() => {
    const locs = new Set([
      "Plano, TX",
      "Chicago, IL",
      "Seattle, WA",
      "Austin, TX",
      "San Jose, CA",
      "New York, NY",
      "Dallas, TX",
      "Atlanta, GA",
    ]);
    jobs.forEach((j) => {
      if (j.city && j.city !== "United States") locs.add(j.city);
      if (j.location) {
        j.location.split(";").forEach((l) => {
          const t = l.trim();
          if (t && t.toLowerCase() !== "remote" && t !== "United States") {
            locs.add(t);
          }
        });
      }
    });
    selectedLocations.forEach((loc) => {
      if (loc) locs.add(loc);
    });
    return Array.from(locs).sort();
  }, [jobs, selectedLocations]);

  const roleOptions = useMemo(() => {
    const roles = new Set(["Developer", "Designer", "DevOps", "Engineer", "QA"]);
    jobs.forEach((j) => {
      if (j.role) roles.add(j.role);
    });
    selectedRoles.forEach((role) => {
      if (role) roles.add(role);
    });
    return Array.from(roles).sort();
  }, [jobs, selectedRoles]);

  const workplaceOptions = useMemo(() => {
    return sortWorkplaceOptions([
      ...JOB_WORKPLACE_OPTIONS,
      ...jobs.map((j) => getJobWorkplace(j)),
      ...selectedWorkplace,
    ]);
  }, [jobs, selectedWorkplace]);

  const companyOptions = useMemo(() => {
    const comps = new Set([
      "Tech Solutions Inc.",
      "Digital Minds LLC",
      "CloudTech Solutions",
      "Innovative Systems",
      "NextGen Technologies",
      "Global Tech Inc.",
      "DataSphere LLC",
      "Quality Systems",
    ]);
    jobs.forEach((j) => {
      if (j.company) comps.add(j.company);
    });
    selectedCompanies.forEach((comp) => {
      if (comp) comps.add(comp);
    });
    return Array.from(comps).sort();
  }, [jobs, selectedCompanies]);

  // Reset Search & Filters
  const handleClearAll = () => {
    setSearchTerm("");
    setSelectedDate("All time");
    setSelectedLocations([]);
    setLocationSearch("");
    setSelectedRoles([]);
    setSelectedWorkplace([]);
    setSelectedCompanies([]);
    setCompanySearch("");
    setOpenDropdown(null);
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inTitle = (job.title || "").toLowerCase().includes(q);
        const inCompany = (job.company || "").toLowerCase().includes(q);
        const inLocation = (job.location || "").toLowerCase().includes(q);
        const inSkills = Array.isArray(job.requiredSkills)
          ? job.requiredSkills.some((s) => s.toLowerCase().includes(q))
          : false;
        if (!inTitle && !inCompany && !inLocation && !inSkills) {
          return false;
        }
      }

      // 2. Date Filter (reuses shared date-filtering logic)
      if (!matchesJobDateFilter(job, selectedDate)) {
        return false;
      }

      // 3. Location (multi-select)
      if (selectedLocations.length > 0) {
        const jobLoc = (job.location || "").toLowerCase();
        const jobCity = (job.city || "").toLowerCase();
        const matchesLoc = selectedLocations.some((loc) => {
          const target = loc.toLowerCase().trim();
          return jobLoc.includes(target) || jobCity.includes(target);
        });
        if (!matchesLoc) {
          return false;
        }
      }

      // 4. Role (multi-select)
      if (selectedRoles.length > 0) {
        const jobTitle = (job.title || "").toLowerCase();
        const jobRole = (job.role || "").toLowerCase();
        const matchesRole = selectedRoles.some((role) => {
          const target = role.toLowerCase().trim();
          return jobTitle.includes(target) || jobRole.includes(target);
        });
        if (!matchesRole) {
          return false;
        }
      }

      // 5. Workplace (multi-select with normalized On-Site comparison)
      if (selectedWorkplace.length > 0) {
        const jobMode = normalizeWorkplaceValue(
          getJobWorkplace(job) || job.workplace
        ).toLowerCase();
        const matchesWorkplace = selectedWorkplace.some((wp) => {
          const targetMode = normalizeWorkplaceValue(wp).toLowerCase();
          return Boolean(targetMode) && jobMode === targetMode;
        });
        if (!matchesWorkplace) {
          return false;
        }
      }

      // 6. Companies (multi-select)
      if (selectedCompanies.length > 0) {
        const jobComp = (job.company || "").toLowerCase();
        const matchesComp = selectedCompanies.some(
          (comp) => jobComp === comp.toLowerCase().trim()
        );
        if (!matchesComp) {
          return false;
        }
      }

      return true;
    });
  }, [
    jobs,
    searchTerm,
    selectedDate,
    selectedLocations,
    selectedRoles,
    selectedWorkplace,
    selectedCompanies,
  ]);

  // Handle Application
  const handleApply = async (job, e) => {
    e?.stopPropagation();
    const jId = job.id || job.jobId;

    if (
      job.isApplied ||
      appliedJobIds.some((id) => String(id) === String(jId))
    ) {
      setToast({
        show: true,
        message: "You have already applied to this position.",
        type: "warning",
      });
      return;
    }

    setApplyingJobIds((prev) => ({ ...prev, [jId]: true }));

    try {
      // 1. Resolve dynamic resumeId (from job record, active state, or storage/backend)
      const resIdToApply = job.resumeId || activeResumeId || (await resolveActiveResumeId());
      const numResumeId = Number(resIdToApply);
      const finalResumeId = !isNaN(numResumeId) && numResumeId > 0 ? numResumeId : 315;

      // 2. Resolve dynamic jobId
      const numJobId = Number(job.jobId || job.id);
      const finalJobId = !isNaN(numJobId) ? numJobId : (job.jobId || job.id);

      // 3. Call POST /api/c2c/applications with dynamic payload: { resumeId, jobIds: [jobId] }
      await applyToC2CJobs({
        resumeId: finalResumeId,
        jobIds: [finalJobId],
      });

      // 4. Update UI to Applied
      setAppliedJobIds((prev) => [...prev, jId]);
      setJobs((prevJobs) =>
        prevJobs.map((j) =>
          String(j.id || j.jobId) === String(jId) ? { ...j, isApplied: true } : j
        )
      );

      setToast({
        show: true,
        message: `Application submitted successfully for ${job.title}!`,
        type: "success",
      });
    } catch (err) {
      console.error("[C2CJobs] Failed to apply to C2C job:", err);
      const errMsg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : "") ||
        err?.message ||
        `Failed to submit application for ${job.title}.`;
      setToast({
        show: true,
        message: errMsg,
        type: "error",
      });
    } finally {
      setApplyingJobIds((prev) => {
        const next = { ...prev };
        delete next[jId];
        return next;
      });
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

        {/* Main C2C Jobs Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight">
              C2C One At A Time
            </h1>
            <p className="text-[13.5px] sm:text-[14px] text-slate-500">
              Discover and apply to the best C2C job opportunities that match your resume and preferences.
            </p>
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

          {/* Search & Filters Container */}
          <JobFilterBar
            dropdownRef={dropdownRef}
            searchQuery={searchTerm}
            onSearchChange={setSearchTerm}
            onClear={handleClearAll}
            activeDropdown={openDropdown}
            onToggleDropdown={(name) =>
              setOpenDropdown((prev) => (prev === name ? null : name))
            }
            selectedDate={selectedDate}
            onSelectDate={(opt) => {
              setSelectedDate(opt);
              setOpenDropdown(null);
            }}
            selectedLocations={selectedLocations}
            locationSearch={locationSearch}
            onLocationSearchChange={setLocationSearch}
            locationOptions={locationOptions}
            onToggleLocation={(loc) =>
              toggleCheckbox(selectedLocations, setSelectedLocations, loc)
            }
            selectedRoles={selectedRoles}
            roleOptions={roleOptions}
            onToggleRole={(role) =>
              toggleCheckbox(selectedRoles, setSelectedRoles, role)
            }
            selectedWorkplace={selectedWorkplace}
            workplaceOptions={workplaceOptions}
            onToggleWorkplace={(wp) =>
              toggleCheckbox(selectedWorkplace, setSelectedWorkplace, wp)
            }
            selectedCompanies={selectedCompanies}
            companySearch={companySearch}
            onCompanySearchChange={setCompanySearch}
            companyOptions={companyOptions}
            onToggleCompany={(comp) =>
              toggleCheckbox(selectedCompanies, setSelectedCompanies, comp)
            }
            showSort={false}
          />

          {/* Job Cards Grid (4 columns on wide screens matching Image 1) */}
          {isLoading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-[16px] border border-[#E2E8F0] p-4.5 flex flex-col justify-between shadow-2xs animate-pulse h-[220px]"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 w-24 bg-slate-100 rounded-lg" />
                      <div className="h-4 w-16 bg-slate-100 rounded" />
                    </div>
                    <div className="mt-3.5 space-y-2">
                      <div className="h-4 w-4/5 bg-slate-100 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                      <div className="h-3 w-2/3 bg-slate-100 rounded" />
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <div className="h-5 w-14 bg-slate-100 rounded" />
                      <div className="h-5 w-10 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="pt-3.5 mt-1">
                    <div className="h-9 w-full bg-slate-100 rounded-[10px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError && jobs.length === 0 ? (
            /* Error State */
            <div className="bg-white rounded-[20px] border border-rose-100 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Failed to Load C2C Jobs</h3>
              <p className="text-sm text-slate-500 max-w-md">
                {fetchError}
              </p>
              <button
                type="button"
                onClick={fetchApiJobs}
                className="mt-2 px-4 py-2 rounded-lg bg-[#4F46E5] text-white text-xs font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5]">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No C2C Jobs Found</h3>
              <p className="text-sm text-slate-500 max-w-md">
                We couldn't find any C2C positions matching your current search or filters. Try adjusting your search criteria or resetting filters.
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className="mt-2 px-4 py-2 rounded-lg bg-[#4F46E5] text-white text-xs font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredJobs.map((job) => {
                const jId = job.id || job.jobId;
                const isApplied = appliedJobIds.some((id) => String(id) === String(jId));
                const isApplying = Boolean(applyingJobIds[jId]);

                return (
                  <div
                    key={jId}
                    className="bg-white rounded-[16px] border border-[#E2E8F0] p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#C7D2FE] transition-all group"
                  >
                    <div>
                      {/* Card Top Row: Source Badge Pill + Match Percentage */}
                      <div className="flex items-center justify-between">
                        {isEmailVendorJob(job) ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-[12px] font-semibold">
                            <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>Email (Vendor)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFEEFF] text-[#1A0EA5] text-[12px] font-semibold">
                            <Briefcase className="w-3.5 h-3.5 text-[#1A0EA5]" />
                            <span>Job Portal</span>
                          </div>
                        )}
                        <span className="text-[12px] font-medium text-slate-500">
                          {job.matchPercent}% match
                        </span>
                      </div>

                      {/* Job Title */}
                      <h3
                        onClick={() => setSelectedJobModal(job)}
                        className="text-[15px] font-bold text-slate-900 mt-3 hover:text-[#4F46E5] transition-colors cursor-pointer line-clamp-1"
                        title={job.title}
                      >
                        {job.title}
                      </h3>

                      {/* Company Name + Verified Badge */}
                      <div className="flex items-center gap-1.5 mt-1 text-[13px] font-medium text-slate-600">
                        <span className="truncate">{job.company}</span>
                        {job.isVerified && <VerifiedBadge />}
                      </div>

                      {/* Location with Pin Icon */}
                      <div className="flex items-center gap-1 text-[12.5px] text-slate-500 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>

                      {/* Tags Row: Workplace & C2C Badges */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-100">
                          {job.workplace}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-100">
                          {job.jobType || "C2C"}
                        </span>
                      </div>

                      {/* Posted Date */}
                      <div className="text-[11.5px] text-slate-400 mt-2">
                        {job.posted}
                      </div>
                    </div>

                    {/* Action Buttons: Apply */}
                    <div className="pt-3.5 mt-1">
                      {isEmailVendorJob(job) ? (
                        <button
                          type="button"
                          disabled={isApplied || isApplying}
                          onClick={(e) => handleApply(job, e)}
                          className={`w-full h-[36px] font-semibold rounded-[10px] text-[13px] transition-all flex items-center justify-center ${
                            isApplied
                              ? "bg-[#EAF4FF] text-[#2563EB] border border-[#C7E0FF] cursor-not-allowed shadow-none"
                              : isApplying
                              ? "bg-[#EAF4FF]/80 text-[#2563EB] border border-[#C7E0FF] cursor-not-allowed"
                              : "bg-[#EAF4FF] text-[#2563EB] border border-[#C7E0FF] hover:bg-[#DCEBFF] hover:border-[#ADCFFF] active:bg-[#CEE3FF] cursor-pointer"
                          }`}
                        >
                          {isApplying ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 border-2 border-[#2563EB]/40 border-t-[#2563EB] rounded-full animate-spin" />
                              <span>Applying...</span>
                            </span>
                          ) : isApplied ? (
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>Applied</span>
                            </span>
                          ) : (
                            "Apply"
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isApplied || isApplying}
                          onClick={(e) => handleApply(job, e)}
                          className={`w-full h-[36px] font-semibold rounded-[10px] text-[13px] transition-all flex items-center justify-center ${
                            isApplied
                              ? "bg-[#EFEEFF] text-[#4F46E5] border border-[#D8D4FF] cursor-not-allowed shadow-none"
                              : isApplying
                              ? "bg-[#EFEEFF]/80 text-[#4F46E5] border border-[#D8D4FF] cursor-not-allowed"
                              : "bg-[#EFEEFF] text-[#4F46E5] border border-[#D8D4FF] hover:bg-[#E4E2FF] hover:border-[#C4BFFF] active:bg-[#D6D0FF] cursor-pointer"
                          }`}
                        >
                          {isApplying ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 border-2 border-[#4F46E5]/40 border-t-[#4F46E5] rounded-full animate-spin" />
                              <span>Applying...</span>
                            </span>
                          ) : isApplied ? (
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                              <span>Applied</span>
                            </span>
                          ) : (
                            "Apply"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= Job Details Modal ================= */}
          {selectedJobModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setSelectedJobModal(null)}
            >
              <div
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#3B82F6] shrink-0 mt-0.5">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 leading-snug">
                        {selectedJobModal.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[13.5px] font-medium text-slate-700">
                          {selectedJobModal.company}
                        </span>
                        {selectedJobModal.isVerified && <VerifiedBadge />}
                        <span className="text-slate-300">•</span>
                        <span className="text-[12.5px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {selectedJobModal.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedJobModal(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex flex-col gap-5 text-sm text-slate-700 leading-relaxed">
                  {/* Key Details Pill Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      Match: {selectedJobModal.matchPercent}%
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      Workplace: {selectedJobModal.workplace}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      Contract: {selectedJobModal.jobType}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      Rate: {selectedJobModal.salary}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      Posted: {selectedJobModal.posted}
                    </span>
                  </div>

                  {/* Overview */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">Overview</h4>
                    <p className="text-slate-600 text-[13.5px]">
                      {selectedJobModal.description}
                    </p>
                  </div>

                  {/* Responsibilities */}
                  {selectedJobModal.responsibilities && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Key Responsibilities</h4>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-[13.5px]">
                        {selectedJobModal.responsibilities.map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Required Skills */}
                  {selectedJobModal.requiredSkills && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJobModal.requiredSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Skills */}
                  {selectedJobModal.preferredSkills && selectedJobModal.preferredSkills.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Preferred Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJobModal.preferredSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedJobModal(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  {appliedJobIds.some((id) => String(id) === String(selectedJobModal.id || selectedJobModal.jobId)) ? (
                    <span className="px-5 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Application Submitted</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEmailNotConnected(false);
                          setShowEnhancedResumeModal(true);
                        }}
                        className="px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Enhance Resume
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(applyingJobIds[selectedJobModal.id || selectedJobModal.jobId])}
                        onClick={() => handleApply(selectedJobModal)}
                        className="px-5 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-60 flex items-center gap-2"
                      >
                        {applyingJobIds[selectedJobModal.id || selectedJobModal.jobId] ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>Applying...</span>  
                          </>
                        ) : (
                          <span>Apply</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
{/* ================= Enhanced Resume Modal ================= */}
{showEnhancedResumeModal && selectedJobModal && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    onClick={() => setShowEnhancedResumeModal(false)}
  >
    <div
      className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Enhanced Resume
            </h2>
            <p className="text-sm text-slate-500">
              Resume preview tailored to the selected job
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowEnhancedResumeModal(false)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close enhanced resume"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Resume Preview */}
      <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-bold text-slate-900">
              Koti Jyothsna
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Software Developer
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Email • Phone • Location
            </p>
          </div>

          <section className="mt-5">
            <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
              Professional Summary
            </h3>

            <p className="text-sm text-slate-600 leading-6 mt-2">
              Motivated software professional with skills relevant to{" "}
              {selectedJobModal.title}. Focused on building maintainable
              applications, solving technical problems, collaborating with
              teams, and delivering quality software solutions.
            </p>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
              Target Position
            </h3>

            <p className="text-sm text-slate-700 font-medium mt-2">
              {selectedJobModal.title}
            </p>

            <p className="text-sm text-slate-500 mt-1">
              {selectedJobModal.company}
            </p>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
              Key Skills
            </h3>

            <div className="flex flex-wrap gap-2 mt-3">
              {(selectedJobModal.requiredSkills || []).map(
                (skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
              Relevant Responsibilities
            </h3>

            <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-slate-600">
              {(selectedJobModal.responsibilities || []).map(
                (item, index) => (
                  <li key={index}>{item}</li>
                )
              )}
            </ul>
          </section>

          <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800">
              Demo preview: replace the sample profile and content with
              your actual enhanced resume from the Resume Enhancement API.
            </p>
          </div>
        </div>

        {/* Email Connection Error */}
        {emailNotConnected && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />

            <div>
              <p className="text-sm font-semibold text-rose-800">
                Email Not Connected
              </p>

              <p className="text-sm text-rose-700 mt-1">
                Please connect your email account before sending your
                application.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 sm:px-6 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowEnhancedResumeModal(false)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>

        <button
          type="button"
          onClick={() => setEmailNotConnected(true)}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Send Application
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

export default C2CJobs;
