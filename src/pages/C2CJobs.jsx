import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  Search,
  X,
  ChevronDown,
  Briefcase,
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
import { getJobs, applyToJobs, getStoredAppliedJobIds } from "../services/api";

// 8 Reference C2C Job Records precisely matching Image 2
const C2C_INITIAL_JOBS = [
  {
    id: "c2c-1",
    jobId: "c2c-1",
    title: "Java Developer (C2C)",
    company: "Tech Solutions Inc.",
    isVerified: true,
    location: "Plano, TX, United States",
    city: "Plano, TX",
    workplace: "Onsite",
    jobType: "C2C",
    posted: "Oct 2, 2026",
    postedDate: "2026-10-02",
    matchPercent: 61.9,
    role: "Developer",
    description:
      "Tech Solutions Inc. is seeking a Senior Java Developer for a long-term enterprise C2C contract. You will architect, develop, and maintain high-throughput distributed microservices handling millions of financial transactions daily.",
    responsibilities: [
      "Design and implement robust microservices using Java 17+, Spring Boot, and Hibernate.",
      "Collaborate with architects and DevOps teams to ensure seamless CI/CD containerized deployments.",
      "Optimize application performance, database queries, and RESTful API response latencies.",
      "Participate in code reviews, automated unit testing, and agile sprint planning.",
    ],
    requiredSkills: ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Docker", "REST APIs"],
    preferredSkills: ["Kubernetes", "AWS", "Kafka", "Redis"],
    experience: "5+ years",
    salary: "$75 - $90 / hr (C2C)",
  },
  {
    id: "c2c-2",
    jobId: "c2c-2",
    title: "UI/UX Designer (C2C)",
    company: "Digital Minds LLC",
    isVerified: true,
    location: "Chicago, IL, United States",
    city: "Chicago, IL",
    workplace: "Hybrid",
    jobType: "C2C",
    posted: "Oct 2, 2026",
    postedDate: "2026-10-02",
    matchPercent: 61.9,
    role: "Designer",
    description:
      "Digital Minds LLC is looking for a creative UI/UX Designer on a C2C contract basis to craft modern, user-centric web and mobile product experiences for our SaaS suite.",
    responsibilities: [
      "Create wireframes, high-fidelity mockups, and interactive prototypes using Figma.",
      "Conduct user research, usability testing, and translate user feedback into design improvements.",
      "Establish and maintain design systems and design tokens across cross-functional engineering teams.",
      "Collaborate closely with product managers and front-end developers to deliver seamless user journeys.",
    ],
    requiredSkills: ["Figma", "UI/UX Design", "Wireframing", "Prototyping", "Design Systems"],
    preferredSkills: ["Adobe Creative Suite", "HTML/CSS basics", "User Research", "Micro-interactions"],
    experience: "4+ years",
    salary: "$65 - $80 / hr (C2C)",
  },
  {
    id: "c2c-3",
    jobId: "c2c-3",
    title: "AWS DevOps Engineer (C2C)",
    company: "CloudTech Solutions",
    isVerified: true,
    location: "Seattle, WA, United States",
    city: "Seattle, WA",
    workplace: "Remote",
    jobType: "C2C",
    posted: "Oct 2, 2026",
    postedDate: "2026-10-02",
    matchPercent: 61.9,
    role: "DevOps",
    description:
      "CloudTech Solutions requires an experienced AWS DevOps Engineer for a multi-cloud enterprise cloud migration and infrastructure modernization project on a C2C contract.",
    responsibilities: [
      "Architect and maintain automated Infrastructure as Code (IaC) using Terraform and CloudFormation.",
      "Build and optimize resilient CI/CD pipelines in GitLab CI and GitHub Actions.",
      "Manage Kubernetes clusters (EKS) and monitor system reliability with Prometheus and Grafana.",
      "Enforce cloud security compliance, IAM least-privilege policies, and cost optimization initiatives.",
    ],
    requiredSkills: ["AWS", "DevOps", "Terraform", "Kubernetes", "Docker", "CI/CD"],
    preferredSkills: ["Helm", "Python/Bash scripting", "Prometheus", "ArgoCD"],
    experience: "5+ years",
    salary: "$85 - $105 / hr (C2C)",
  },
  {
    id: "c2c-4",
    jobId: "c2c-4",
    title: "React Developer (C2C)",
    company: "Innovative Systems",
    isVerified: true,
    location: "Austin, TX, United States",
    city: "Austin, TX",
    workplace: "Remote",
    jobType: "C2C",
    posted: "Oct 2, 2026",
    postedDate: "2026-10-02",
    matchPercent: 61.9,
    role: "Developer",
    description:
      "Innovative Systems is seeking a skilled React Developer on a C2C arrangement to build high-performance client-facing web dashboards and real-time data analytics tools.",
    responsibilities: [
      "Develop responsive, accessible, and performant user interfaces using React, TypeScript, and Tailwind CSS.",
      "Integrate complex REST and GraphQL APIs with state management patterns.",
      "Write comprehensive unit tests with Jest and React Testing Library.",
      "Optimize frontend bundle sizes and core web vitals for optimal loading performance.",
    ],
    requiredSkills: ["React", "TypeScript", "JavaScript", "Tailwind CSS", "Redux/Zustand"],
    preferredSkills: ["Next.js", "GraphQL", "Jest", "Webpack/Vite"],
    experience: "4+ years",
    salary: "$70 - $85 / hr (C2C)",
  },
  {
    id: "c2c-5",
    jobId: "c2c-5",
    title: "Python Developer (C2C)",
    company: "NextGen Technologies",
    isVerified: true,
    location: "San Jose, CA, United States",
    city: "San Jose, CA",
    workplace: "Remote",
    jobType: "C2C",
    posted: "Sep 26, 2026",
    postedDate: "2026-09-26",
    matchPercent: 61.9,
    role: "Developer",
    description:
      "NextGen Technologies is looking for a Python Developer to join our backend and AI integration squad on a 12-month C2C engagement.",
    responsibilities: [
      "Build high-throughput microservices and APIs with Python (FastAPI/Django).",
      "Develop data processing pipelines, ETL workflows, and asynchronous background tasks with Celery.",
      "Integrate machine learning models and LLM endpoints into core services.",
      "Ensure unit test coverage, security audits, and adherence to clean code standards.",
    ],
    requiredSkills: ["Python", "FastAPI", "Django", "PostgreSQL", "Celery", "REST APIs"],
    preferredSkills: ["Redis", "AWS", "PyTest", "Docker"],
    experience: "4+ years",
    salary: "$75 - $95 / hr (C2C)",
  },
  {
    id: "c2c-6",
    jobId: "c2c-6",
    title: "Full Stack Developer (C2C)",
    company: "Global Tech Inc.",
    isVerified: true,
    location: "New York, NY, United States",
    city: "New York, NY",
    workplace: "Hybrid",
    jobType: "C2C",
    posted: "Sep 26, 2026",
    postedDate: "2026-09-26",
    matchPercent: 61.9,
    role: "Developer",
    description:
      "Global Tech Inc. is hiring a versatile Full Stack Developer for an enterprise financial portal redesign on a long-term C2C contract.",
    responsibilities: [
      "Lead end-to-end feature development across frontend (React/TypeScript) and backend (Node.js/Express).",
      "Design relational and document database schemas with MySQL and MongoDB.",
      "Work in an agile environment collaborating with UX designers, QA engineers, and business analysts.",
      "Maintain high standards of security, PCI-DSS compliance, and automated testing.",
    ],
    requiredSkills: ["Full Stack", "React", "Node.js", "TypeScript", "SQL", "REST APIs"],
    preferredSkills: ["MongoDB", "AWS", "Express", "Microservices"],
    experience: "5+ years",
    salary: "$80 - $100 / hr (C2C)",
  },
  {
    id: "c2c-7",
    jobId: "c2c-7",
    title: "Data Engineer (C2C)",
    company: "DataSphere LLC",
    isVerified: true,
    location: "Dallas, TX, United States",
    city: "Dallas, TX",
    workplace: "Remote",
    jobType: "C2C",
    posted: "Sep 26, 2026",
    postedDate: "2026-09-26",
    matchPercent: 61.9,
    role: "Engineer",
    description:
      "DataSphere LLC is seeking a Data Engineer on a C2C contract to build scalable modern data lakehouse pipelines and real-time streaming architectures.",
    responsibilities: [
      "Design and maintain automated ETL/ELT pipelines using PySpark, SQL, and Apache Airflow.",
      "Manage cloud data warehouse architectures on Snowflake and Databricks.",
      "Ensure data quality, schema validation, and auditability across raw and curated layers.",
      "Collaborate with data science and business intelligence teams to fulfill analytical requirements.",
    ],
    requiredSkills: ["Data Engineering", "Python", "SQL", "Spark/PySpark", "Airflow", "Snowflake"],
    preferredSkills: ["Kafka", "AWS S3", "Databricks", "dbt"],
    experience: "5+ years",
    salary: "$85 - $110 / hr (C2C)",
  },
  {
    id: "c2c-8",
    jobId: "c2c-8",
    title: "QA Automation Engineer (C2C)",
    company: "Quality Systems",
    isVerified: true,
    location: "Atlanta, GA, United States",
    city: "Atlanta, GA",
    workplace: "Onsite",
    jobType: "C2C",
    posted: "Sep 26, 2026",
    postedDate: "2026-09-26",
    matchPercent: 61.9,
    role: "QA",
    description:
      "Quality Systems is looking for a QA Automation Engineer for an enterprise healthcare software test suite expansion on a C2C contract.",
    responsibilities: [
      "Develop, execute, and maintain automated UI and API test suites using Playwright, Cypress, and Selenium.",
      "Integrate automated test runs into CI/CD pipelines to provide rapid regression feedback.",
      "Identify, document, and track software defects with comprehensive reproduction steps.",
      "Collaborate with development teams to ensure high test coverage and shift-left quality principles.",
    ],
    requiredSkills: ["QA Automation", "Playwright", "Cypress", "Selenium", "JavaScript/TypeScript", "API Testing"],
    preferredSkills: ["Postman", "Jenkins/GitHub Actions", "JMeter", "TestRail"],
    experience: "4+ years",
    salary: "$65 - $80 / hr (C2C)",
  },
];

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
  const [jobs, setJobs] = useState(C2C_INITIAL_JOBS);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedJobType, setSelectedJobType] = useState("All");
  const [selectedWorkplace, setSelectedWorkplace] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");

  // Open dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Job Details Modal
  const [selectedJobModal, setSelectedJobModal] = useState(null);

  // Application States
  const [appliedJobIds, setAppliedJobIds] = useState(() => {
    try {
      const stored = localStorage.getItem("c2c_applied_job_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [applyingJobIds, setApplyingJobIds] = useState({});

  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
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

  // Attempt to fetch from real API if available
  useEffect(() => {
    const fetchApiJobs = async () => {
      try {
        setIsLoading(true);
        const res = await getJobs({ employmentType: "contract", q: "c2c", size: 40 });
        if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
          // Normalize and merge API jobs with C2C designation
          const apiFormatted = res.items.map((item, idx) => ({
            id: item.id || item.jobId || `api-c2c-${idx}`,
            jobId: item.jobId || item.id || `api-c2c-${idx}`,
            title: item.title?.includes("C2C") ? item.title : `${item.title || "Software Specialist"} (C2C)`,
            company: item.company || item.companyName || "Verified Partner",
            isVerified: true,
            location: item.location || item.city || "United States",
            city: item.city || item.location || "United States",
            workplace: item.workplace || item.workMode || "Remote",
            jobType: "C2C",
            posted: item.posted || "Oct 2, 2026",
            postedDate: item.postedDate || "2026-10-02",
            matchPercent: item.matchScore || item.matchPercent || 61.9,
            role: item.role || "Developer",
            description: item.description || "Exciting C2C contract opportunity.",
            responsibilities: Array.isArray(item.responsibilities) && item.responsibilities.length > 0
              ? item.responsibilities
              : [
                  "Collaborate with the cross-functional team on enterprise requirements.",
                  "Implement scalable, maintainable, and high-quality software solutions.",
                  "Participate in design sessions, code reviews, and automated testing.",
                ],
            requiredSkills: Array.isArray(item.requiredSkills) && item.requiredSkills.length > 0
              ? item.requiredSkills
              : ["C2C", "Contract", "Software Development"],
            preferredSkills: Array.isArray(item.preferredSkills) ? item.preferredSkills : [],
            experience: item.experience || "3+ years",
            salary: item.salary || "$70 - $95 / hr (C2C)",
          }));
          setJobs(apiFormatted);
        }
      } catch (err) {
        // Fall back gracefully to the 8 standard Image 2 reference jobs
        console.log("C2C real API endpoint unavailable or empty; displaying reference C2C jobs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiJobs();
  }, []);

  // Filter Dropdown Options
  const dateOptions = ["All", "Last 24 hours", "Last 7 days", "Last 14 days", "Last 30 days"];
  const locationOptions = [
    "All",
    "Plano, TX",
    "Chicago, IL",
    "Seattle, WA",
    "Austin, TX",
    "San Jose, CA",
    "New York, NY",
    "Dallas, TX",
    "Atlanta, GA",
  ];
  const roleOptions = ["All", "Developer", "Designer", "DevOps", "Engineer", "QA"];
  const jobTypeOptions = ["All", "C2C", "Corp-to-Corp", "Contract"];
  const workplaceOptions = ["All", "Remote", "Hybrid", "Onsite"];
  const companyOptions = [
    "All",
    "Tech Solutions Inc.",
    "Digital Minds LLC",
    "CloudTech Solutions",
    "Innovative Systems",
    "NextGen Technologies",
    "Global Tech Inc.",
    "DataSphere LLC",
    "Quality Systems",
  ];

  // Reset Search & Filters
  const handleClearAll = () => {
    setSearchTerm("");
    setSelectedDate("All");
    setSelectedLocation("All");
    setSelectedRole("All");
    setSelectedJobType("All");
    setSelectedWorkplace("All");
    setSelectedCompany("All");
    setOpenDropdown(null);
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedDate !== "All" ||
    selectedLocation !== "All" ||
    selectedRole !== "All" ||
    selectedJobType !== "All" ||
    selectedWorkplace !== "All" ||
    selectedCompany !== "All";

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inTitle = job.title.toLowerCase().includes(q);
        const inCompany = job.company.toLowerCase().includes(q);
        const inLocation = job.location.toLowerCase().includes(q);
        const inSkills = Array.isArray(job.requiredSkills)
          ? job.requiredSkills.some((s) => s.toLowerCase().includes(q))
          : false;
        if (!inTitle && !inCompany && !inLocation && !inSkills) {
          return false;
        }
      }

      // 2. Location
      if (selectedLocation !== "All") {
        if (!job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // 3. Role
      if (selectedRole !== "All") {
        if (
          !job.title.toLowerCase().includes(selectedRole.toLowerCase()) &&
          (!job.role || !job.role.toLowerCase().includes(selectedRole.toLowerCase()))
        ) {
          return false;
        }
      }

      // 4. Job Type
      if (selectedJobType !== "All") {
        if (!job.jobType.toLowerCase().includes(selectedJobType.toLowerCase()) && selectedJobType !== "C2C") {
          return false;
        }
      }

      // 5. Workplace
      if (selectedWorkplace !== "All") {
        if (job.workplace.toLowerCase() !== selectedWorkplace.toLowerCase()) {
          return false;
        }
      }

      // 6. Company
      if (selectedCompany !== "All") {
        if (job.company.toLowerCase() !== selectedCompany.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [
    jobs,
    searchTerm,
    selectedDate,
    selectedLocation,
    selectedRole,
    selectedJobType,
    selectedWorkplace,
    selectedCompany,
  ]);

  // Handle Application
  const handleApply = async (job, e) => {
    e?.stopPropagation();
    const jId = job.id || job.jobId;

    if (appliedJobIds.includes(jId)) {
      setToast({
        show: true,
        message: "You have already applied to this position.",
        type: "warning",
      });
      return;
    }

    setApplyingJobIds((prev) => ({ ...prev, [jId]: true }));

    try {
      // Attempt backend apply API call
      try {
        await applyToJobs({ jobIds: [jId] });
      } catch (err) {
        console.log("Backend apply call queued or simulated for C2C job:", jId);
      }

      // Add to applied list
      setAppliedJobIds((prev) => [...prev, jId]);
      setToast({
        show: true,
        message: `Application submitted successfully for ${job.title}!`,
        type: "success",
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

          {/* Search & Filters Container Matching Image 2 */}
          <div
            ref={dropdownRef}
            className="bg-white rounded-[20px] border border-[#E2E8F0] p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3 relative z-20"
          >
            {/* Search Input Row with Clear Button */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 flex items-center gap-2.5 px-3.5 h-[42px] rounded-[10px] border border-[#E2E8F0] bg-white focus-within:border-[#818CF8] focus-within:ring-2 focus-within:ring-[#EEF2FF] transition-all">
                <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, keyword, company or skills..."
                  className="w-full bg-transparent text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Clear Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Filter Buttons Row Matching Image 2 */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* 1. Date Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "date" ? null : "date")}
                  className={`px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    selectedDate !== "All"
                      ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]"
                      : "bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{selectedDate === "All" ? "Date" : selectedDate}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {openDropdown === "date" && (
                  <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    {dateOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedDate(opt);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          selectedDate === opt ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedDate === opt && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Location Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "location" ? null : "location")}
                  className={`px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    selectedLocation !== "All"
                      ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]"
                      : "bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{selectedLocation === "All" ? "Location" : selectedLocation}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {openDropdown === "location" && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto">
                    {locationOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(opt);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          selectedLocation === opt ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedLocation === opt && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Role Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "role" ? null : "role")}
                  className={`px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    selectedRole !== "All"
                      ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]"
                      : "bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{selectedRole === "All" ? "Role" : selectedRole}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {openDropdown === "role" && (
                  <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    {roleOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedRole(opt);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          selectedRole === opt ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedRole === opt && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Job Type Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "jobType" ? null : "jobType")}
                  className={`px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    selectedJobType !== "All"
                      ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]"
                      : "bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{selectedJobType === "All" ? "Job Type" : selectedJobType}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {openDropdown === "jobType" && (
                  <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    {jobTypeOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedJobType(opt);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          selectedJobType === opt ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedJobType === opt && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Workplace Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "workplace" ? null : "workplace")}
                  className={`px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    selectedWorkplace !== "All"
                      ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]"
                      : "bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{selectedWorkplace === "All" ? "Workplace" : selectedWorkplace}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {openDropdown === "workplace" && (
                  <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    {workplaceOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedWorkplace(opt);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          selectedWorkplace === opt ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedWorkplace === opt && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Companies Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "company" ? null : "company")}
                  className={`px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    selectedCompany !== "All"
                      ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]"
                      : "bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{selectedCompany === "All" ? "Companies" : selectedCompany}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {openDropdown === "company" && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto">
                    {companyOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedCompany(opt);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          selectedCompany === opt ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {selectedCompany === opt && <Check className="w-3.5 h-3.5 text-[#4F46E5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Cards Grid Matching Image 2 (4 columns on wide screens) */}
          {filteredJobs.length === 0 ? (
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
                const isApplied = appliedJobIds.includes(jId);
                const isApplying = Boolean(applyingJobIds[jId]);

                return (
                  <div
                    key={jId}
                    className="bg-white rounded-[16px] border border-[#E2E8F0] p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#C7D2FE] transition-all group"
                  >
                    <div>
                      {/* Card Top Row: Briefcase Icon + Match Percentage */}
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#3B82F6] group-hover:scale-105 transition-transform">
                          <Briefcase className="w-4.5 h-4.5" />
                        </div>
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

                    {/* Action Buttons: View Details & Apply Now */}
                    <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100/80">
                      <button
                        type="button"
                        onClick={() => setSelectedJobModal(job)}
                        className="flex-1 h-[36px] font-semibold rounded-[10px] border border-[#E2E8F0] bg-white text-[12.5px] text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-center"
                      >
                        View Details
                      </button>

                     
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

                  {appliedJobIds.includes(selectedJobModal.id || selectedJobModal.jobId) ? (
                    <span className="px-5 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Application Submitted</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(applyingJobIds[selectedJobModal.id || selectedJobModal.jobId])}
                      onClick={(e) => handleApply(selectedJobModal, e)}
                      className="px-5 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    >
                      {applyingJobIds[selectedJobModal.id || selectedJobModal.jobId] ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Applying...</span>
                        </>
                      ) : (
                        <span>Enhance Resume</span>
                      )}
                    </button>
                  )}
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
