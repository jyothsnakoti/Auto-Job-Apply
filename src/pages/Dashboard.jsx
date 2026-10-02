// import { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
// import Header from "../components/Header";
// import {
//   getStoredUser,
//   getOnboardingProfile,
//   getStoredJobMatches,
//   getOnboardingState,
//   checkUserHasResume,
//   getPrimaryResumeId,
// } from "../services/api";

// import dashboard1Icon from "../assets/dashboard1.svg";
// import dashboard2Icon from "../assets/dashboard2.svg";
// import dashboard3Icon from "../assets/dashboard3.svg";
// import dashboard4Icon from "../assets/dashboard4.svg";

// import googleLogo from "../assets/google.svg";
// import microsoftLogo from "../assets/microsoft.svg";
// import amazonLogo from "../assets/amazon.svg";
// import aiLogo from "../assets/ai.svg";
// import mapIcon from "../assets/map.svg";
// import shopifyLogo from "../assets/shopify.svg";
// import tickIcon from "../assets/tick.svg";

// const statsCards = [
//   {
//     id: "jobs-found",
//     title: "Jobs Found",
//     value: "1,142",
//     supportingText: "New jobs in the last 7 days",
//     iconBg: "#EFF6FF",
//     icon: dashboard1Icon,
//   },
//   {
//     id: "qualified-matches",
//     title: "Qualified Matches",
//     value: "247",
//     supportingText: "Jobs with good ATS match",
//     iconBg: "#ECFEFF",
//     icon: dashboard2Icon,
//   },
//   {
//     id: "applications-submitted",
//     title: "Applications Submitted",
//     value: "48",
//     supportingText: "Out of 100 monthly limit",
//     iconBg: "#FAF5FF",
//     icon: dashboard3Icon,
//   },
//   {
//     id: "applications-remaining",
//     title: "Applications Remaining",
//     value: "52",
//     supportingText: "This month",
//     iconBg: "#F0FDFA",
//     icon: dashboard4Icon,
//   },
// ];

// const dateOptions = [
//   "Last 6 hours",
//   "Last 24 hours",
//   "Last 7 days",
//   "Last 14 days",
//   "Last 30 days",
//   "All time",
// ];

// const locationOptions = [
//   { name: "United States", badge: "Country" },
//   { name: "India", badge: "Country" },
//   { name: "Canada", badge: "Country" },
// ];

// const workplaceOptions = ["Remote", "On-site", "Hybrid"];

// const companyOptions = [
//   "Domino's Pizza LLC",
//   "CVS Health",
//   "Hindco Recruitment Consultants",
//   "AutoZone",
//   "Everglades Equity",
// ];

// const degreeOptions = [
//   "Bachelor's Degree",
//   "Master's Degree",
//   "Doctorate (PhD)",
// ];

// const experienceOptions = [
//   "No experience required",
//   "Up to 1 year",
//   "Up to 2 years",
//   "Up to 3 years",
//   "Up to 5 years",
//   "Up to 7 years",
// ];

// const roleOptions = [
//   "Software Engineer",
//   "Frontend Developer",
//   "Backend Developer",
//   "Full Stack Developer",
//   "Data Scientist",
//   "Product Manager",
// ];

// const jobTypeOptions = ["Full-time", "Part-time", "Contract", "Internship"];
// const employmentTypeOptions = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];

// // Verified tick icon
// const VerifiedTick = () => (
//   <img src={tickIcon} alt="verified" className="w-3.5 h-3.5 object-contain inline-block shrink-0" />
// );

// // Document / Resume Icon
// const DocumentIcon = ({ color = "#6366F1" }) => (
//   <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
//     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//     <polyline points="14 2 14 8 20 8" />
//     <line x1="16" y1="13" x2="8" y2="13" />
//     <line x1="16" y1="17" x2="8" y2="17" />
//   </svg>
// );

// const transformMatchToJob = (match, index = 0) => {
//   if (!match) return null;

//   if (match.title && match.company && match.matchPercent !== undefined && match.logo) {
//     return {
//       ...match,
//       id: match.id || match.job_id || index + 1,
//     };
//   }

//   const overallScore =
//     typeof match.overall_score === "number"
//       ? match.overall_score
//       : typeof match.score_data?.overall_score === "number"
//       ? match.score_data.overall_score
//       : typeof match.score === "number"
//       ? match.score
//       : 85;

//   const matchPercent = Math.min(100, Math.max(1, Math.round(overallScore)));

//   const text = match.full_jd_text || match.preview || match.description || "";

//   // Title extraction
//   let title = match.title || match.job_title || match.role || "";
//   if (!title && text) {
//     const titleMatch = text.match(/(?:title|role|position|job title)\s*[:-]\s*([^\n\r,]+)/i);
//     if (titleMatch && titleMatch[1]) {
//       title = titleMatch[1].trim();
//     } else {
//       const firstLine = text.split("\n")[0].replace(/^#+\s*/, "").trim();
//       if (firstLine && firstLine.length < 60 && !firstLine.toLowerCase().includes("http")) {
//         title = firstLine;
//       }
//     }
//   }
//   if (!title) {
//     title = `Position #${index + 1}`;
//   }

//   // Company extraction
//   let company = match.company || match.company_name || "";
//   if (!company && text) {
//     const companyMatch = text.match(/(?:company|organization|employer)\s*[:-]\s*([^\n\r,]+)/i);
//     if (companyMatch && companyMatch[1]) {
//       company = companyMatch[1].trim();
//     }
//   }
//   if (!company) {
//     company = "Hiring Organization";
//   }

//   // Pick logo based on company
//   let logo = aiLogo;
//   const compLower = company.toLowerCase();
//   if (compLower.includes("google")) logo = googleLogo;
//   else if (compLower.includes("microsoft")) logo = microsoftLogo;
//   else if (compLower.includes("amazon")) logo = amazonLogo;
//   else if (compLower.includes("shopify")) logo = shopifyLogo;

//   // Location
//   let location = match.location || match.city || "";
//   if (!location && text) {
//     const locMatch = text.match(/(?:location|place|city)\s*[:-]\s*([^\n\r]+)/i);
//     if (locMatch && locMatch[1]) {
//       location = locMatch[1].trim();
//     }
//   }
//   if (!location) {
//     location = "Remote / Flexible";
//   }

//   // Skills
//   const requiredSkills =
//     Array.isArray(match.requiredSkills) && match.requiredSkills.length > 0
//       ? match.requiredSkills
//       : Array.isArray(match.skills) && match.skills.length > 0
//       ? match.skills
//       : Array.isArray(match.extracted_skills) && match.extracted_skills.length > 0
//       ? match.extracted_skills
//       : Array.isArray(match.score_data?.missing_required_skills) && match.score_data.missing_required_skills.length > 0
//       ? match.score_data.missing_required_skills
//       : [];

//   const preferredSkills =
//     Array.isArray(match.preferredSkills) && match.preferredSkills.length > 0
//       ? match.preferredSkills
//       : Array.isArray(match.score_data?.missing_preferred_skills) && match.score_data.missing_preferred_skills.length > 0
//       ? match.score_data.missing_preferred_skills
//       : [];

//   let matchColor = "bg-[#ECFDF5] text-[#059669]";
//   if (matchPercent < 80) {
//     matchColor = "bg-slate-100 text-slate-700";
//   } else if (matchPercent < 90) {
//     matchColor = "bg-[#FFFBEB] text-[#D97706]";
//   }

//   const description =
//     match.description ||
//     match.preview ||
//     (match.full_jd_text ? match.full_jd_text.slice(0, 300) + "..." : "") ||
//     "Job description available upon viewing details.";

//   const responsibilities =
//     Array.isArray(match.responsibilities) && match.responsibilities.length > 0
//       ? match.responsibilities
//       : [];

//   return {
//     id: match.job_id || match.id || `match-${index + 1}`,
//     job_id: match.job_id || match.id || `match-${index + 1}`,
//     title,
//     company,
//     location,
//     fullLocation: match.fullLocation || location,
//     type: match.type || match.employment_type || "Full-time",
//     workMode: match.workMode || match.work_mode || (location.toLowerCase().includes("remote") ? "Remote" : "On-site"),
//     department: match.department || "Engineering",
//     posted: match.posted || "Recent match",
//     match: `${matchPercent}% match`,
//     matchPercent,
//     matchColor,
//     logo,
//     description,
//     responsibilities,
//     requiredSkills,
//     preferredSkills,
//     experience: match.experience || "Not specified",
//     scoreData: match.score_data || null,
//     fullJdText: match.full_jd_text || "",
//     rawMatch: match,
//   };
// };

// const applicationTabs = [
//   { name: "All", count: 48 },
//   { name: "Submitted", count: 32 },
//   { name: "In Progress", count: 8 },
//   { name: "Needs Action", count: 3 },
//   { name: "Failed", count: 4 },
//   { name: "Skipped", count: 1 },
// ];

// const recentApplications = [
//   {
//     id: 1,
//     company: "Google",
//     logo: googleLogo,
//     jobTitle: "Product Designer",
//     atsMatch: "96%",
//     atsColor: "text-[#059669]",
//     resume: "Tailored",
//     resumeColor: "text-[#6366F1]",
//     resumeIconColor: "#6366F1",
//     status: "Submitted",
//     statusDotColor: "bg-[#059669]",
//     statusTextColor: "text-[#059669]",
//     applied: "2 hours ago",
//   },
//   {
//     id: 2,
//     company: "Microsoft",
//     logo: microsoftLogo,
//     jobTitle: "Frontend Engineer",
//     atsMatch: "92%",
//     atsColor: "text-[#059669]",
//     resume: "Tailored",
//     resumeColor: "text-[#6366F1]",
//     resumeIconColor: "#6366F1",
//     status: "In Progress",
//     statusDotColor: "bg-[#2563EB]",
//     statusTextColor: "text-[#2563EB]",
//     applied: "5 hours ago",
//   },
//   {
//     id: 3,
//     company: "Amazon",
//     logo: amazonLogo,
//     jobTitle: "Software Engineer",
//     atsMatch: "89%",
//     atsColor: "text-[#D97706]",
//     resume: "Original",
//     resumeColor: "text-[#475569]",
//     resumeIconColor: "#475569",
//     status: "Submitted",
//     statusDotColor: "bg-[#059669]",
//     statusTextColor: "text-[#059669]",
//     applied: "1 day ago",
//   },
//   {
//     id: 4,
//     company: "Atlassian",
//     logo: aiLogo,
//     jobTitle: "UI/UX Designer",
//     atsMatch: "87%",
//     atsColor: "text-[#D97706]",
//     resume: "Tailored",
//     resumeColor: "text-[#6366F1]",
//     resumeIconColor: "#6366F1",
//     status: "Needs Action",
//     statusDotColor: "bg-[#D97706]",
//     statusTextColor: "text-[#D97706]",
//     applied: "1 day ago",
//   },
//   {
//     id: 5,
//     company: "Shopify",
//     logo: shopifyLogo,
//     jobTitle: "Backend Engineer",
//     atsMatch: "85%",
//     atsColor: "text-[#D97706]",
//     resume: "Tailored",
//     resumeColor: "text-[#6366F1]",
//     resumeIconColor: "#6366F1",
//     status: "Failed",
//     statusDotColor: "bg-[#DC2626]",
//     statusTextColor: "text-[#DC2626]",
//     applied: "2 days ago",
//   },
// ];

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [userName, setUserName] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeDropdown, setActiveDropdown] = useState(null);
//   const [selectedAppTab, setSelectedAppTab] = useState("All");
//   const [selectedJobModal, setSelectedJobModal] = useState(null);
//   const [isJobSaved, setIsJobSaved] = useState(false);

//   // Jobs State (Fetched from resume match endpoint / storage)
//   const [jobs, setJobs] = useState([]);
//   const [isLoadingJobs, setIsLoadingJobs] = useState(true);
//   const [resumeError, setResumeError] = useState(null);
//   const [hasResume, setHasResume] = useState(null);

//   // Filter States
//   const [selectedDate, setSelectedDate] = useState("Last 7 days");
//   const [selectedLocations, setSelectedLocations] = useState([]);
//   const [locationSearch, setLocationSearch] = useState("");
//   const [selectedWorkplace, setSelectedWorkplace] = useState([]);
//   const [selectedCompanies, setSelectedCompanies] = useState([]);
//   const [companySearch, setCompanySearch] = useState("");
//   const [selectedDegrees, setSelectedDegrees] = useState([]);
//   const [selectedExperience, setSelectedExperience] = useState("");
//   const [selectedRoles, setSelectedRoles] = useState([]);
//   const [selectedJobTypes, setSelectedJobTypes] = useState([]);
//   const [sponsorsVisa, setSponsorsVisa] = useState(false);
//   const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState([]);

//   const dropdownRef = useRef(null);

//   // Fetch / Load Matched Jobs from resume matching source of truth
//   useEffect(() => {
//     const loadMatchedJobs = async () => {
//       try {
//         setIsLoadingJobs(true);
//         setResumeError(null);

//         // 1. Check whether active user has an uploaded resume
//         let activeResumeId = null;
//         try {
//           activeResumeId = await getPrimaryResumeId();
//         } catch {
//           // fallback
//         }

//         const onboardingState = getOnboardingState();
//         if (!activeResumeId && onboardingState?.resumeId) {
//           activeResumeId = String(onboardingState.resumeId);
//         }

//         const userHasResume = Boolean(activeResumeId) || (await checkUserHasResume().catch(() => false));
//         setHasResume(userHasResume);

//         if (!userHasResume) {
//           // Clear any stale job matches from storage
//           try {
//             localStorage.removeItem("jobMatches");
//             sessionStorage.removeItem("jobMatches");
//           } catch {
//             // ignore
//           }
//           setJobs([]);
//           setResumeError("Resume is not uploaded. Please upload your resume in Resume Setup to view top job matches.");
//           return;
//         }

//         // 2. If resume exists, load stored/onboarding job matches
//         const storedMatches = getStoredJobMatches();
//         console.log("[Dashboard] Loaded stored job matches:", storedMatches);

//         if (Array.isArray(storedMatches) && storedMatches.length > 0) {
//           const transformed = storedMatches.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
//           if (transformed.length > 0) {
//             setJobs(transformed);
//             return;
//           }
//         }

//         if (Array.isArray(onboardingState?.matches) && onboardingState.matches.length > 0) {
//           const transformed = onboardingState.matches.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
//           if (transformed.length > 0) {
//             setJobs(transformed);
//             return;
//           }
//         }

//         // No matched jobs stored
//         setJobs([]);
//       } catch (err) {
//         console.warn("[Dashboard] Error loading job matches:", err);
//         setJobs([]);
//         setResumeError(err?.message || "Failed to load job matches.");
//       } finally {
//         setIsLoadingJobs(false);
//       }
//     };

//     loadMatchedJobs();

//     const handleMatchesUpdated = (e) => {
//       if (Array.isArray(e?.detail) && e.detail.length > 0) {
//         const transformed = e.detail.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
//         setJobs(transformed);
//         setResumeError(null);
//         setHasResume(true);
//       } else {
//         loadMatchedJobs();
//       }
//     };

//     window.addEventListener("jobMatchesUpdated", handleMatchesUpdated);
//     window.addEventListener("storage", handleMatchesUpdated);
//     return () => {
//       window.removeEventListener("jobMatchesUpdated", handleMatchesUpdated);
//       window.removeEventListener("storage", handleMatchesUpdated);
//     };
//   }, []);

//   useEffect(() => {
//     const loadUserData = async () => {
//       try {
//         const user = getStoredUser();
//         const storedFullName =
//           localStorage.getItem("userFullName") ||
//           sessionStorage.getItem("userFullName") ||
//           localStorage.getItem("userName") ||
//           sessionStorage.getItem("userName") ||
//           sessionStorage.getItem("pendingFullName") ||
//           "";

//         let currentEmail =
//           user?.email ||
//           localStorage.getItem("userEmail") ||
//           sessionStorage.getItem("userEmail") ||
//           sessionStorage.getItem("pendingVerificationEmail") ||
//           "";

//         let currentName =
//           user?.fullName ||
//           user?.name ||
//           storedFullName ||
//           "";

//         if (currentName && currentName !== currentEmail) {
//           setUserName(currentName);
//         } else if (currentEmail) {
//           const emailPrefix = currentEmail.split("@")[0];
//           setUserName(emailPrefix);
//         }

//         try {
//           const profileData = await getOnboardingProfile();
//           if (profileData) {
//             const resolvedName =
//               profileData.fullName ||
//               profileData.name ||
//               profileData.profile?.fullName ||
//               profileData.profile?.name;

//             if (resolvedName) {
//               setUserName(resolvedName);
//               localStorage.setItem("userFullName", resolvedName);
//               sessionStorage.setItem("userFullName", resolvedName);
//             }
//           }
//         } catch {
//           // Fallback gracefully to stored credentials
//         }
//       } catch (err) {
//         console.warn("Could not load user data in Dashboard:", err);
//       }
//     };

//     loadUserData();
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setActiveDropdown(null);
//       }
//     };

//     const handleKeyDown = (event) => {
//       if (event.key === "Escape") {
//         setSelectedJobModal(null);
//         setActiveDropdown(null);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     window.addEventListener("keydown", handleKeyDown);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, []);

//   const handleClear = () => {
//     setSearchQuery("");
//     setSelectedDate("Last 7 days");
//     setSelectedLocations([]);
//     setLocationSearch("");
//     setSelectedWorkplace([]);
//     setSelectedCompanies([]);
//     setCompanySearch("");
//     setSelectedDegrees([]);
//     setSelectedExperience("");
//     setSelectedRoles([]);
//     setSelectedJobTypes([]);
//     setSponsorsVisa(false);
//     setSelectedEmploymentTypes([]);
//   };

//   const toggleDropdown = (name) => {
//     setActiveDropdown((prev) => (prev === name ? null : name));
//   };

//   const toggleCheckbox = (list, setList, item) => {
//     if (list.includes(item)) {
//       setList(list.filter((i) => i !== item));
//     } else {
//       setList([...list, item]);
//     }
//   };

//   // Filter jobs based on active search and filter options
//   const filteredJobs = jobs.filter((job) => {
//     if (searchQuery.trim()) {
//       const q = searchQuery.toLowerCase().trim();
//       const matchTitle = job.title?.toLowerCase().includes(q);
//       const matchComp = job.company?.toLowerCase().includes(q);
//       const matchLoc = job.location?.toLowerCase().includes(q);
//       const matchDesc = job.description?.toLowerCase().includes(q);
//       const matchSkills = Array.isArray(job.requiredSkills) && job.requiredSkills.some((s) => s.toLowerCase().includes(q));
//       if (!matchTitle && !matchComp && !matchLoc && !matchDesc && !matchSkills) {
//         return false;
//       }
//     }

//     if (selectedWorkplace.length > 0) {
//       if (!selectedWorkplace.some((w) => job.workMode?.toLowerCase().includes(w.toLowerCase()))) {
//         return false;
//       }
//     }

//     if (selectedCompanies.length > 0) {
//       if (!selectedCompanies.some((c) => job.company?.toLowerCase().includes(c.toLowerCase()))) {
//         return false;
//       }
//     }

//     if (selectedLocations.length > 0) {
//       if (!selectedLocations.some((l) => job.location?.toLowerCase().includes(l.toLowerCase()))) {
//         return false;
//       }
//     }

//     if (selectedRoles.length > 0) {
//       if (!selectedRoles.some((r) => job.title?.toLowerCase().includes(r.toLowerCase()))) {
//         return false;
//       }
//     }

//     if (selectedJobTypes.length > 0) {
//       if (!selectedJobTypes.some((t) => job.type?.toLowerCase().includes(t.toLowerCase()))) {
//         return false;
//       }
//     }

//     return true;
//   });

//   const dynamicStatsCards = [
//     {
//       id: "jobs-found",
//       title: "Jobs Found",
//       value: hasResume && jobs.length > 0 ? jobs.length.toLocaleString() : "0",
//       supportingText: hasResume && jobs.length > 0 ? `${jobs.length} matched jobs ready` : "Upload resume to find matches",
//       iconBg: "#EFF6FF",
//       icon: dashboard1Icon,
//     },
//     {
//       id: "qualified-matches",
//       title: "Qualified Matches",
//       value: hasResume && jobs.length > 0 ? jobs.filter((j) => (j.matchPercent || 0) >= 80).length.toLocaleString() : "0",
//       supportingText: "Jobs with ≥80% match",
//       iconBg: "#ECFEFF",
//       icon: dashboard2Icon,
//     },
//     {
//       id: "applications-submitted",
//       title: "Applications Submitted",
//       value: "48",
//       supportingText: "Out of 100 monthly limit",
//       iconBg: "#FAF5FF",
//       icon: dashboard3Icon,
//     },
//     {
//       id: "applications-remaining",
//       title: "Applications Remaining",
//       value: "52",
//       supportingText: "This month",
//       iconBg: "#F0FDFA",
//       icon: dashboard4Icon,
//     },
//   ];

//   return (
//     <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
//       {/* Left Sidebar */}
//       <Sidebar />

//       {/* Main Content Area (Scrollable) */}
//       <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
//         {/* Top Header */}
//         <Header />

//         {/* Dashboard Main Content */}
//         <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          
//           {/* Welcome Header */}
//           <div className="flex flex-col gap-1">
//             <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
//               Welcome back, {userName || "User"}!
//             </h1>
//             <p className="text-[13px] text-[#64748B]">
//               Your job search is running. We're finding, matching and applying to the best opportunities for you.
//             </p>
//           </div>

//           {/* 1. Dashboard Statistics Cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
//             {dynamicStatsCards.map((card) => (
//               <div
//                 key={card.id}
//                 className="p-5 rounded-[20px] bg-white border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex items-center gap-4 transition-all duration-200 hover:shadow-md"
//               >
//                 {/* Icon Box */}
//                 <div
//                   className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center shrink-0"
//                   style={{ backgroundColor: card.iconBg }}
//                 >
//                   <img
//                     src={card.icon}
//                     alt={card.title}
//                     className="w-[24px] h-[24px] object-contain"
//                   />
//                 </div>

//                 {/* Text Content */}
//                 <div className="flex flex-col min-w-0">
//                   <span className="text-[13px] font-medium text-[#64748B] truncate">
//                     {card.title}
//                   </span>
//                   <span className="text-[26px] font-bold text-[#0F172A] tracking-tight leading-tight my-0.5">
//                     {card.value}
//                   </span>
//                   <span className="text-[12px] text-[#94A3B8] truncate">
//                     {card.supportingText}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* 2. Search & Filter Panel */}
//           <div
//             ref={dropdownRef}
//             className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col gap-4 shadow-[0_1px_3px_rgba(15,23,42,0.02)]"
//           >
//             {/* First Row: Search Input + Clear + Apply */}
//             <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
//               <div className="flex-1 min-w-[240px] flex items-center gap-3 h-[44px] px-4 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#0F172A] focus-within:bg-white transition-all">
//                 <svg
//                   className="w-4 h-4 text-[#94A3B8] shrink-0"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <circle cx="11" cy="11" r="7" />
//                   <path d="m20 20-3.5-3.5" />
//                 </svg>
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder="Search by title or keyword..."
//                   className="w-full bg-transparent border-none text-[13.5px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
//                 />
//               </div>

//               <button
//                 type="button"
//                 onClick={handleClear}
//                 className="h-[42px] px-3 flex items-center gap-1 text-[13.5px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
//               >
//                 <span className="text-base leading-none">✕</span>
//                 <span>Clear</span>
//               </button>

//               <button
//                 type="button"
//                 className="h-[40px] px-5 text-[13.5px] font-semibold text-[#1E293B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[10px] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
//               >
//                 Apply
//               </button>
//             </div>

//             {/* Second Row: Filter Buttons */}
//             <div className="flex items-center gap-2 flex-wrap pt-0.5 relative">
              
//               {/* 1. Date Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("date")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "date" || selectedDate !== "All time"
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Date</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "date" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "date" && (
//                   <div className="absolute top-full left-0 mt-2 w-[180px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2 z-50 flex flex-col gap-0.5">
//                     {dateOptions.map((opt) => {
//                       const isSelected = selectedDate === opt;
//                       return (
//                         <div
//                           key={opt}
//                           onClick={() => {
//                             setSelectedDate(opt);
//                             setActiveDropdown(null);
//                           }}
//                           className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] cursor-pointer text-[13px] transition-colors ${
//                             isSelected
//                               ? "bg-slate-50 text-[#0F172A] font-medium"
//                               : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
//                           }`}
//                         >
//                           <div
//                             className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
//                               isSelected
//                                 ? "bg-[#0F4C3A] text-white"
//                                 : "border border-slate-300"
//                             }`}
//                           >
//                             {isSelected && (
//                               <svg
//                                 className="w-2.5 h-2.5"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 strokeWidth="3.5"
//                               >
//                                 <polyline points="20 6 9 17 4 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <span>{opt}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {/* 2. Location Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("location")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "location" || selectedLocations.length > 0
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Location</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "location" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "location" && (
//                   <div className="absolute top-full left-0 mt-2 w-[240px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-3 z-50 flex flex-col gap-2">
//                     {/* Search Input */}
//                     <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border border-slate-200 bg-white">
//                       <svg
//                         className="w-3.5 h-3.5 text-slate-400 shrink-0"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                       >
//                         <circle cx="11" cy="11" r="7" />
//                         <path d="m20 20-3.5-3.5" />
//                       </svg>
//                       <input
//                         type="text"
//                         value={locationSearch}
//                         onChange={(e) => setLocationSearch(e.target.value)}
//                         placeholder="Search locations..."
//                         className="w-full text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
//                       />
//                     </div>

//                     <div className="text-[11px] font-semibold text-slate-400 tracking-wider px-1 pt-1">
//                       POPULAR
//                     </div>

//                     <div className="flex flex-col gap-1">
//                       {locationOptions
//                         .filter((loc) =>
//                           loc.name
//                             .toLowerCase()
//                             .includes(locationSearch.toLowerCase())
//                         )
//                         .map((loc) => {
//                           const isChecked = selectedLocations.includes(loc.name);
//                           return (
//                             <div
//                               key={loc.name}
//                               onClick={() =>
//                                 toggleCheckbox(
//                                   selectedLocations,
//                                   setSelectedLocations,
//                                   loc.name
//                                 )
//                               }
//                               className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
//                             >
//                               <div
//                                 className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
//                                   isChecked
//                                     ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
//                                     : "border-slate-300 bg-white"
//                                 }`}
//                               >
//                                 {isChecked && (
//                                   <svg
//                                     className="w-2.5 h-2.5"
//                                     viewBox="0 0 24 24"
//                                     fill="none"
//                                     stroke="currentColor"
//                                     strokeWidth="3.5"
//                                   >
//                                     <polyline points="20 6 9 17 4 12" />
//                                   </svg>
//                                 )}
//                               </div>
//                               <span className="flex-1">{loc.name}</span>
//                               <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-[4px]">
//                                 {loc.badge}
//                               </span>
//                             </div>
//                           );
//                         })}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Role Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("role")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "role" || selectedRoles.length > 0
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Role</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "role" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "role" && (
//                   <div className="absolute top-full left-0 mt-2 w-[210px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
//                     {roleOptions.map((role) => {
//                       const isChecked = selectedRoles.includes(role);
//                       return (
//                         <div
//                           key={role}
//                           onClick={() =>
//                             toggleCheckbox(selectedRoles, setSelectedRoles, role)
//                           }
//                           className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
//                         >
//                           <div
//                             className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
//                               isChecked
//                                 ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
//                                 : "border-slate-300 bg-white"
//                             }`}
//                           >
//                             {isChecked && (
//                               <svg
//                                 className="w-2.5 h-2.5"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 strokeWidth="3.5"
//                               >
//                                 <polyline points="20 6 9 17 4 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <span>{role}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {/* Job Type Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("jobType")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "jobType" || selectedJobTypes.length > 0
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Job Type</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "jobType" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "jobType" && (
//                   <div className="absolute top-full left-0 mt-2 w-[170px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
//                     {jobTypeOptions.map((type) => {
//                       const isChecked = selectedJobTypes.includes(type);
//                       return (
//                         <div
//                           key={type}
//                           onClick={() =>
//                             toggleCheckbox(
//                               selectedJobTypes,
//                               setSelectedJobTypes,
//                               type
//                             )
//                           }
//                           className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
//                         >
//                           <div
//                             className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
//                               isChecked
//                                 ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
//                                 : "border-slate-300 bg-white"
//                             }`}
//                           >
//                             {isChecked && (
//                               <svg
//                                 className="w-2.5 h-2.5"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 strokeWidth="3.5"
//                               >
//                                 <polyline points="20 6 9 17 4 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <span>{type}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {/* 3. Workplace Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("workplace")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "workplace" || selectedWorkplace.length > 0
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Workplace</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "workplace" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "workplace" && (
//                   <div className="absolute top-full left-0 mt-2 w-[160px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
//                     {workplaceOptions.map((opt) => {
//                       const isChecked = selectedWorkplace.includes(opt);
//                       return (
//                         <div
//                           key={opt}
//                           onClick={() =>
//                             toggleCheckbox(
//                               selectedWorkplace,
//                               setSelectedWorkplace,
//                               opt
//                             )
//                           }
//                           className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
//                         >
//                           <div
//                             className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
//                               isChecked
//                                 ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
//                                 : "border-slate-300 bg-white"
//                             }`}
//                           >
//                             {isChecked && (
//                               <svg
//                                 className="w-2.5 h-2.5"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 strokeWidth="3.5"
//                               >
//                                 <polyline points="20 6 9 17 4 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <span>{opt}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {/* Sponsors Visa Button */}
//               <button
//                 type="button"
//                 onClick={() => setSponsorsVisa(!sponsorsVisa)}
//                 className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                   sponsorsVisa
//                     ? "border-slate-400 bg-slate-100 text-[#0F172A] font-medium"
//                     : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                 }`}
//               >
//                 <span>Sponsors Visa</span>
//               </button>

//               {/* Employment Type Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("employmentType")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "employmentType" ||
//                     selectedEmploymentTypes.length > 0
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Employment Type</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "employmentType" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "employmentType" && (
//                   <div className="absolute top-full left-0 mt-2 w-[170px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
//                     {employmentTypeOptions.map((type) => {
//                       const isChecked = selectedEmploymentTypes.includes(type);
//                       return (
//                         <div
//                           key={type}
//                           onClick={() =>
//                             toggleCheckbox(
//                               selectedEmploymentTypes,
//                               setSelectedEmploymentTypes,
//                               type
//                             )
//                           }
//                           className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
//                         >
//                           <div
//                             className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
//                               isChecked
//                                 ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
//                                 : "border-slate-300 bg-white"
//                             }`}
//                           >
//                             {isChecked && (
//                               <svg
//                                 className="w-2.5 h-2.5"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 strokeWidth="3.5"
//                               >
//                                 <polyline points="20 6 9 17 4 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <span>{type}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {/* 4. Companies Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("companies")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "companies" || selectedCompanies.length > 0
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Companies</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "companies" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "companies" && (
//                   <div className="absolute top-full left-0 mt-2 w-[270px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-3 z-50 flex flex-col gap-2">
//                     {/* Search Input */}
//                     <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border border-slate-200 bg-white">
//                       <svg
//                         className="w-3.5 h-3.5 text-slate-400 shrink-0"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                       >
//                         <circle cx="11" cy="11" r="7" />
//                         <path d="m20 20-3.5-3.5" />
//                       </svg>
//                       <input
//                         type="text"
//                         value={companySearch}
//                         onChange={(e) => setCompanySearch(e.target.value)}
//                         placeholder="Search companies to show..."
//                         className="w-full text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
//                       />
//                     </div>

//                     <div className="text-[11px] font-semibold text-slate-400 tracking-wider px-1 pt-1">
//                       POPULAR
//                     </div>

//                     <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
//                       {companyOptions
//                         .filter((c) =>
//                           c.toLowerCase().includes(companySearch.toLowerCase())
//                         )
//                         .map((comp) => {
//                           const isChecked = selectedCompanies.includes(comp);
//                           return (
//                             <div
//                               key={comp}
//                               onClick={() =>
//                                 toggleCheckbox(
//                                   selectedCompanies,
//                                   setSelectedCompanies,
//                                   comp
//                                 )
//                               }
//                               className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
//                             >
//                               <div
//                                 className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
//                                   isChecked
//                                     ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
//                                     : "border-slate-300 bg-white"
//                                 }`}
//                               >
//                                 {isChecked && (
//                                   <svg
//                                     className="w-2.5 h-2.5"
//                                     viewBox="0 0 24 24"
//                                     fill="none"
//                                     stroke="currentColor"
//                                     strokeWidth="3.5"
//                                   >
//                                     <polyline points="20 6 9 17 4 12" />
//                                   </svg>
//                                 )}
//                               </div>
//                               <span className="truncate">{comp}</span>
//                             </div>
//                           );
//                         })}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* 5. Degree Level Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("degree")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "degree" || selectedDegrees.length > 0
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Degree Level</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "degree" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "degree" && (
//                   <div className="absolute top-full left-0 mt-2 w-[210px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
//                     {degreeOptions.map((deg) => {
//                       const isChecked = selectedDegrees.includes(deg);
//                       return (
//                         <div
//                           key={deg}
//                           onClick={() =>
//                             toggleCheckbox(
//                               selectedDegrees,
//                               setSelectedDegrees,
//                               deg
//                             )
//                           }
//                           className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700"
//                         >
//                           <div
//                             className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
//                               isChecked
//                                 ? "bg-[#0F4C3A] border-[#0F4C3A] text-white"
//                                 : "border-slate-300 bg-white"
//                             }`}
//                           >
//                             {isChecked && (
//                               <svg
//                                 className="w-2.5 h-2.5"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 strokeWidth="3.5"
//                               >
//                                 <polyline points="20 6 9 17 4 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <span>{deg}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {/* Max Experience Dropdown */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => toggleDropdown("experience")}
//                   className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
//                     activeDropdown === "experience" || selectedExperience !== ""
//                       ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
//                       : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
//                   }`}
//                 >
//                   <span>Max Experience</span>
//                   <svg
//                     className={`w-3 h-3 text-[#94A3B8] transition-transform ${
//                       activeDropdown === "experience" ? "rotate-180" : ""
//                     }`}
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                   >
//                     <path d="m6 9 6 6 6-6" />
//                   </svg>
//                 </button>

//                 {activeDropdown === "experience" && (
//                   <div className="absolute top-full left-0 mt-2 w-[210px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-0.5">
//                     {experienceOptions.map((exp) => {
//                       const isSelected = selectedExperience === exp;
//                       return (
//                         <div
//                           key={exp}
//                           onClick={() => {
//                             setSelectedExperience(exp === selectedExperience ? "" : exp);
//                             setActiveDropdown(null);
//                           }}
//                           className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] cursor-pointer text-[13px] transition-colors ${
//                             isSelected
//                               ? "bg-slate-50 text-[#0F172A] font-medium"
//                               : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
//                           }`}
//                         >
//                           <div
//                             className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
//                               isSelected
//                                 ? "bg-[#0F4C3A] text-white"
//                                 : "border border-slate-300"
//                             }`}
//                           >
//                             {isSelected && (
//                               <svg
//                                 className="w-2.5 h-2.5"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 strokeWidth="3.5"
//                               >
//                                 <polyline points="20 6 9 17 4 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <span>{exp}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//             </div>

//           </div>

//           {/* 3. Top Job Matches for You Section */}
//           <div className="flex flex-col gap-4 w-full mt-1">
//             {/* Section Header */}
//             <div className="flex items-center justify-between flex-wrap gap-3">
//               <div className="flex flex-col">
//                 <h2 className="text-[20px] md:text-[22px] font-bold text-[#0F172A] tracking-tight">
//                   Top Job Matches for You
//                 </h2>
//                 <p className="text-[13px] text-[#64748B] mt-0.5">
//                   AI matched jobs based on your profile, skills and preferences.
//                 </p>
//               </div>

//               <div className="flex items-center gap-3">
//                 <button
//                   type="button"
//                   onClick={() => filteredJobs.length > 0 && navigate("/auto-apply")}
//                   disabled={filteredJobs.length === 0}
//                   className={`h-[38px] px-4 rounded-[10px] text-[13px] font-medium flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap ${
//                     filteredJobs.length > 0
//                       ? "bg-[#4F46E5] hover:bg-[#4338CA] text-white active:scale-[0.99] cursor-pointer"
//                       : "bg-slate-200 text-slate-400 cursor-not-allowed"
//                   }`}
//                 >
//                   <span>Auto Apply to all ({filteredJobs.length})</span>
//                   <span>→</span>
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => navigate("/browse-jobs")}
//                   className="h-[38px] px-4 rounded-[10px] bg-white border border-[#E2E8F0] text-[#4F46E5] hover:bg-slate-50 text-[13px] font-medium flex items-center gap-1.5 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
//                 >
//                   <span>Browse Jobs</span>
//                   <span className="text-[#4F46E5]">→</span>
//                 </button>
//               </div>
//             </div>

//             {/* Dynamic Job Cards Grid with Loading, Error, and Empty States */}
//             {isLoadingJobs ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
//                 {[1, 2, 3, 4].map((n) => (
//                   <div
//                     key={n}
//                     className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col justify-between min-h-[230px] animate-pulse"
//                   >
//                     <div>
//                       <div className="flex items-center justify-between">
//                         <div className="w-[40px] h-[40px] rounded-[10px] bg-slate-100" />
//                         <div className="w-16 h-5 rounded-full bg-slate-100" />
//                       </div>
//                       <div className="mt-3.5 space-y-2">
//                         <div className="w-3/4 h-5 rounded bg-slate-100" />
//                         <div className="w-1/2 h-4 rounded bg-slate-100" />
//                       </div>
//                       <div className="mt-3 space-y-1">
//                         <div className="w-2/3 h-3.5 rounded bg-slate-100" />
//                         <div className="w-1/3 h-3 rounded bg-slate-100" />
//                       </div>
//                     </div>
//                     <div className="flex gap-2 pt-4">
//                       <div className="flex-1 h-9 rounded-[10px] bg-slate-100" />
//                       <div className="flex-1 h-9 rounded-[10px] bg-slate-100" />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : resumeError || hasResume === false ? (
//               <div className="bg-[#FEF2F2] rounded-[20px] border border-[#FCA5A5] p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3.5 shadow-sm">
//                 <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
//                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//                   </svg>
//                 </div>
//                 <div className="flex flex-col gap-1 max-w-md">
//                   <h3 className="text-base sm:text-[17px] font-bold text-red-900">
//                     Resume Not Found
//                   </h3>
//                   <p className="text-xs sm:text-[13px] text-red-700 leading-relaxed">
//                     {resumeError || "No resume uploaded. Job matching requires an active resume to extract skills and find matching opportunities."}
//                   </p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => navigate("/resume-setup")}
//                   className="mt-1 px-5 py-2.5 text-xs sm:text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-[10px] shadow-sm transition-colors cursor-pointer flex items-center gap-2"
//                 >
//                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
//                   </svg>
//                   <span>Upload Resume Now</span>
//                 </button>
//               </div>
//             ) : jobs.length === 0 ? (
//               <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-10 text-center flex flex-col items-center justify-center gap-3">
//                 <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
//                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-base font-bold text-[#0F172A]">No Job Matches Found</h3>
//                 <p className="text-xs text-[#64748B] max-w-md">
//                   No matching jobs were returned for your resume yet. Upload an updated resume or try searching again.
//                 </p>
//                 <button
//                   type="button"
//                   onClick={() => navigate("/resume-setup")}
//                   className="mt-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-[10px] shadow-xs transition-colors cursor-pointer"
//                 >
//                   Update Resume
//                 </button>
//               </div>
//             ) : filteredJobs.length === 0 ? (
//               <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-8 text-center flex flex-col items-center justify-center gap-3">
//                 <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
//                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-base font-bold text-[#0F172A]">No Matching Jobs Found</h3>
//                 <p className="text-xs text-[#64748B] max-w-sm">No jobs match your current search filters. Try clearing or relaxing your filters.</p>
//                 <button
//                   type="button"
//                   onClick={handleClear}
//                   className="mt-1 px-4 py-2 text-xs font-semibold text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-[10px] transition-colors cursor-pointer"
//                 >
//                   Clear Filters
//                 </button>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
//                 {filteredJobs.map((job) => (
//                   <div
//                     key={job.id}
//                     onClick={() => setSelectedJobModal(job)}
//                     className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(15,23,42,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-200 min-h-[230px] cursor-pointer group"
//                   >
//                     <div>
//                       {/* Top Header: Logo + Match Badge */}
//                       <div className="flex items-center justify-between gap-2">
//                         <div className="w-[40px] h-[40px] rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2">
//                           <img
//                             src={job.logo}
//                             alt={job.company}
//                             className="w-full h-full object-contain"
//                           />
//                         </div>
//                         <span
//                           className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${job.matchColor}`}
//                         >
//                           {job.match}
//                         </span>
//                       </div>

//                       {/* Job Title & Company */}
//                       <div className="mt-3.5">
//                         <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight leading-snug group-hover:text-[#4F46E5] transition-colors line-clamp-2">
//                           {job.title}
//                         </h3>
//                         <div className="flex items-center gap-1 text-[13px] text-[#64748B] font-normal mt-1">
//                           <span className="truncate">{job.company}</span>
//                           <VerifiedTick />
//                         </div>
//                       </div>

//                       {/* Location & Posted Date */}
//                       <div className="mt-3 flex flex-col gap-1">
//                         <div className="flex items-center gap-1.5 text-[12.5px] text-[#64748B]">
//                           <img
//                             src={mapIcon}
//                             alt=""
//                             className="w-[10px] h-[12px] object-contain shrink-0"
//                           />
//                           <span className="truncate">{job.location}</span>
//                         </div>
//                         <div className="text-[12px] text-[#94A3B8]">
//                           {job.posted}
//                         </div>
//                       </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex items-center gap-2.5 pt-4 mt-auto">
//                       <button
//                         type="button"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setSelectedJobModal(job);
//                         }}
//                         className="flex-1 h-[36px] rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#334155] hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center"
//                       >
//                         View Details
//                       </button>
//                       <button
//                         type="button"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setSelectedJobModal(job);
//                         }}
//                         className="flex-1 h-[36px] rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-[13px] font-medium text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center active:scale-[0.99]"
//                       >
//                         Apply Now
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* 4. Recent Applications Section */}
//           <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-5 w-full mt-2">
            
//             {/* Header: Title + View all applications */}
//             <div className="flex items-center justify-between flex-wrap gap-2">
//               <h2 className="text-[18px] md:text-[20px] font-bold text-[#0F172A] tracking-tight">
//                 Recent Applications
//               </h2>

//               <button
//                 type="button"
//                 onClick={() => navigate("/tracker")}
//                 className="text-[13px] font-medium text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 transition-colors cursor-pointer"
//               >
//                 <span>View all applications</span>
//                 <span>→</span>
//               </button>
//             </div>

//             {/* Filter Tabs */}
//             <div className="flex items-center gap-2 flex-wrap">
//               {applicationTabs.map((tab) => {
//                 const isActive = selectedAppTab === tab.name;
//                 return (
//                   <button
//                     key={tab.name}
//                     type="button"
//                     onClick={() => setSelectedAppTab(tab.name)}
//                     className={`h-[34px] px-3.5 rounded-full text-[12.5px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
//                       isActive
//                         ? "bg-[#0F172A] text-white shadow-xs"
//                         : "bg-[#F1F5F9] text-[#64748B] hover:bg-slate-200"
//                     }`}
//                   >
//                     <span>{tab.name}</span>
//                     <span className={isActive ? "text-slate-300" : "text-[#94A3B8]"}>
//                       {tab.count}
//                     </span>
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Table Container */}
//             <div className="overflow-x-auto w-full">
//               <table className="w-full text-left border-collapse min-w-[750px]">
//                 <thead>
//                   <tr className="border-b border-slate-100">
//                     <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
//                       Company
//                     </th>
//                     <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
//                       Job Title
//                     </th>
//                     <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
//                       ATS Match
//                     </th>
//                     <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
//                       Resume
//                     </th>
//                     <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
//                       Applied
//                     </th>
//                     <th className="pb-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider text-right pr-2">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {recentApplications.map((app) => (
//                     <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
//                       {/* Company */}
//                       <td className="py-4 pr-3">
//                         <div className="flex items-center gap-2.5">
//                           <div className="w-[28px] h-[28px] rounded-[6px] bg-white flex items-center justify-center shrink-0">
//                             <img
//                               src={app.logo}
//                               alt={app.company}
//                               className="w-[20px] h-[20px] object-contain"
//                             />
//                           </div>
//                           <span className="text-[14px] font-bold text-[#0F172A]">
//                             {app.company}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Job Title */}
//                       <td className="py-4 px-3 text-[13.5px] font-medium text-[#334155]">
//                         {app.jobTitle}
//                       </td>

//                       {/* ATS Match */}
//                       <td className="py-4 px-3">
//                         <span className={`text-[13px] font-bold ${app.atsColor}`}>
//                           {app.atsMatch}
//                         </span>
//                       </td>

//                       {/* Resume */}
//                       <td className="py-4 px-3">
//                         <div className="flex items-center gap-1.5">
//                           <DocumentIcon color={app.resumeIconColor} />
//                           <span className={`text-[13px] font-medium ${app.resumeColor}`}>
//                             {app.resume}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Status */}
//                       <td className="py-4 px-3">
//                         <div className="flex items-center gap-2">
//                           <span className={`w-2 h-2 rounded-full ${app.statusDotColor}`} />
//                           <span className={`text-[13px] font-medium ${app.statusTextColor}`}>
//                             {app.status}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Applied */}
//                       <td className="py-4 px-3 text-[13px] text-[#64748B]">
//                         {app.applied}
//                       </td>

//                       {/* Actions */}
//                       <td className="py-4 pl-3 text-right pr-2">
//                         <button
//                           type="button"
//                           className="h-[30px] px-3.5 rounded-[8px] border border-[#E2E8F0] bg-white text-[12.5px] font-medium text-[#334155] hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
//                         >
//                           View
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//           </div>

//         </main>
//       </div>

//       {/* Job Details Right Side Drawer Popup */}
//       {selectedJobModal && (
//         <div className="fixed inset-0 z-50 overflow-hidden">
//           {/* Backdrop Overlay */}
//           <div
//             className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
//             onClick={() => setSelectedJobModal(null)}
//           />

//           {/* Side Drawer Container */}
//           <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
//             <div className="w-screen max-w-[490px] bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
              
//               {/* Drawer Header */}
//               <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-white">
//                 <div className="flex items-start gap-3.5">
//                   <div className="w-[44px] h-[44px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2 mt-0.5">
//                     <img
//                       src={selectedJobModal.logo}
//                       alt={selectedJobModal.company}
//                       className="w-full h-full object-contain"
//                     />
//                   </div>

//                   <div className="flex flex-col">
//                     <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight leading-tight">
//                       {selectedJobModal.title}
//                     </h2>

//                     <div className="flex items-center gap-1.5 text-[13.5px] text-[#475569] font-medium mt-0.5">
//                       <span>{selectedJobModal.company}</span>
//                       <VerifiedTick />
//                     </div>

//                     <div className="flex items-center gap-3 text-[12px] text-[#64748B] mt-2 flex-wrap">
//                       <span>{selectedJobModal.fullLocation || selectedJobModal.location}</span>
//                       <span>{selectedJobModal.type || "Full-time"}</span>
//                       <span>{selectedJobModal.workMode || "On-site"}</span>
//                     </div>
//                     <div className="text-[12px] text-[#64748B] mt-0.5">
//                       {selectedJobModal.department || "Software Engineering"}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Close Button */}
//                 <button
//                   type="button"
//                   onClick={() => setSelectedJobModal(null)}
//                   className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
//                 >
//                   <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>

//               {/* Drawer Scrollable Body */}
//               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
//                 {/* ATS Match Box */}
//                 <div className="rounded-[16px] border border-slate-200/80 bg-[#F8FAFC]/70 p-4.5 flex items-center gap-4">
//                   <div className="relative w-[68px] h-[68px] shrink-0 flex items-center justify-center">
//                     <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
//                       <path
//                         className="text-slate-200"
//                         strokeWidth="3.2"
//                         stroke="currentColor"
//                         fill="none"
//                         d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
//                       />
//                       <path
//                         className="text-[#0D9488]"
//                         strokeDasharray={`${selectedJobModal.matchPercent || 96}, 100`}
//                         strokeWidth="3.2"
//                         strokeLinecap="round"
//                         stroke="currentColor"
//                         fill="none"
//                         d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
//                       />
//                     </svg>
//                     <div className="absolute inset-0 flex flex-col items-center justify-center">
//                       <span className="text-[14px] font-bold text-[#0F172A] leading-none">
//                         {selectedJobModal.matchPercent || 96}%
//                       </span>
//                       <span className="text-[9px] text-[#64748B] font-medium leading-none mt-0.5">
//                         Match
//                       </span>
//                     </div>
//                   </div>

//                   <div className="flex flex-col">
//                     <h3 className="text-[14.5px] font-bold text-[#0F172A]">ATS Match</h3>
//                     <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
//                       Strong match based on your profile, skills, experience and preferences.
//                     </p>
//                   </div>
//                 </div>

//                 {/* Job Description */}
//                 <div>
//                   <h3 className="text-[14px] font-bold text-[#0F172A]">Job description</h3>
//                   <p className="text-[12.5px] text-[#475569] leading-relaxed mt-1.5">
//                     {selectedJobModal.description}
//                   </p>
//                 </div>

//                 {/* Key Responsibilities */}
//                 <div>
//                   <h3 className="text-[14px] font-bold text-[#0F172A]">Key responsibilities:</h3>
//                   <ul className="space-y-2 mt-2">
//                     {(selectedJobModal.responsibilities || []).map((resp, idx) => (
//                       <li key={idx} className="text-[12.5px] text-[#475569] flex items-start gap-2 leading-snug">
//                         <span className="text-[#94A3B8] shrink-0">•</span>
//                         <span>{resp}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {/* Required Skills */}
//                 <div>
//                   <h3 className="text-[14px] font-bold text-[#0F172A]">Required skills</h3>
//                   <div className="flex flex-wrap gap-2 mt-2">
//                     {(selectedJobModal.requiredSkills || []).map((skill) => (
//                       <span
//                         key={skill}
//                         className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
//                       >
//                         {skill}
//                       </span>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Preferred Skills */}
//                 <div>
//                   <h3 className="text-[14px] font-bold text-[#0F172A]">Preferred skills</h3>
//                   <div className="flex flex-wrap gap-2 mt-2">
//                     {(selectedJobModal.preferredSkills || []).map((skill) => (
//                       <span
//                         key={skill}
//                         className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
//                       >
//                         {skill}
//                       </span>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Job Details */}
//                 <div>
//                   <h3 className="text-[14px] font-bold text-[#0F172A] mb-2.5">Job details</h3>
//                   <div className="grid grid-cols-2 gap-y-3 gap-x-4">
//                     <div className="flex flex-col text-[12.5px]">
//                       <span className="text-[#64748B]">Experience</span>
//                       <span className="font-semibold text-[#0F172A] mt-0.5">{selectedJobModal.experience}</span>
//                     </div>
//                     <div className="flex flex-col text-[12.5px]">
//                       <span className="text-[#64748B]">Work mode</span>
//                       <span className="font-semibold text-[#0F172A] mt-0.5">{selectedJobModal.workMode}</span>
//                     </div>
//                     <div className="flex flex-col text-[12.5px]">
//                       <span className="text-[#64748B]">Employment type</span>
//                       <span className="font-semibold text-[#0F172A] mt-0.5">{selectedJobModal.type}</span>
//                     </div>
//                     <div className="flex flex-col text-[12.5px]">
//                       <span className="text-[#64748B]">Location</span>
//                       <span className="font-semibold text-[#0F172A] mt-0.5">{selectedJobModal.fullLocation}</span>
//                     </div>
//                   </div>
//                 </div>

//               </div>

//               {/* Drawer Footer */}
//               <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex items-center gap-3">
//                 <button
//                   type="button"
//                   onClick={() => setIsJobSaved(!isJobSaved)}
//                   className={`flex-1 h-[42px] rounded-[10px] border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
//                     isJobSaved
//                       ? "border-blue-300 bg-blue-50 text-[#2563EB]"
//                       : "border-[#BFDBFE] bg-white text-[#2563EB] hover:bg-blue-50/50"
//                   }`}
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill={isJobSaved ? "currentColor" : "none"}
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
//                   </svg>
//                   <span>{isJobSaved ? "Saved" : "Save job"}</span>
//                 </button>

//                 <button
//                   type="button"
//                   className="flex-1 h-[42px] rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
//                 >
//                   <span>Apply now</span>
//                   <span>→</span>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;




import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
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
  getPrimaryResumeId
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

const statsCards = [
  {
    id: "jobs-found",
    title: "Jobs Found",
    value: "1,142",
    supportingText: "New jobs in the last 7 days",
    iconBg: "#EFF6FF",
    icon: dashboard1Icon,
  },
  {
    id: "qualified-matches",
    title: "Qualified Matches",
    value: "247",
    supportingText: "Jobs with good ATS match",
    iconBg: "#ECFEFF",
    icon: dashboard2Icon,
  },
  {
    id: "applications-submitted",
    title: "Applications Submitted",
    value: "48",
    supportingText: "Out of 100 monthly limit",
    iconBg: "#FAF5FF",
    icon: dashboard3Icon,
  },
  {
    id: "applications-remaining",
    title: "Applications Remaining",
    value: "52",
    supportingText: "This month",
    iconBg: "#F0FDFA",
    icon: dashboard4Icon,
  },
];

const dateOptions = [
  "Last 6 hours",
  "Last 24 hours",
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
  "All time",
];

const locationOptions = [
  { name: "United States", badge: "Country" },
  { name: "India", badge: "Country" },
  { name: "Canada", badge: "Country" },
];

const workplaceOptions = ["Remote", "On-site", "Hybrid"];

const companyOptions = [
  "Domino's Pizza LLC",
  "CVS Health",
  "Hindco Recruitment Consultants",
  "AutoZone",
  "Everglades Equity",
];

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

const roleOptions = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Product Manager",
];

const jobTypeOptions = ["Full-time", "Part-time", "Contract", "Internship"];
const employmentTypeOptions = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];

// Verified tick icon
const VerifiedTick = () => (
  <img src={tickIcon} alt="verified" className="w-3.5 h-3.5 object-contain inline-block shrink-0" />
);

// Document / Resume Icon
const DocumentIcon = ({ color = "#6366F1" }) => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

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

  // If title is already clean, concise (<= 55 chars) and doesn't look like a long unparsed sentence
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
    // 1. Check for "is looking for a / an [Role Title] to / who / in"
    const lookingMatch = candidateText.match(
      /(?:is\s+looking\s+for\s+(?:a|an)?|we\s+are\s+looking\s+for\s+(?:a|an)?|seeking\s+(?:a|an)?|hiring\s+(?:a|an)?)\s+([A-Z][A-Za-z0-9\s\-/+(),&]+?)(?:\s+to|\s+who|\s+in|\s+at|\s+with|[.,;\n\r]|$)/i
    );
    if (lookingMatch && lookingMatch[1] && lookingMatch[1].trim().length >= 3 && lookingMatch[1].trim().length <= 60) {
      return lookingMatch[1].trim();
    }

    // 2. Check for explicit "Title:" or "Role:" or "Position:"
    const explicitMatch = candidateText.match(
      /(?:job\s+title|title|role|position)\s*[:-]\s*([^\n\r,;.]+)/i
    );
    if (explicitMatch && explicitMatch[1] && explicitMatch[1].trim().length >= 3 && explicitMatch[1].trim().length <= 60) {
      return explicitMatch[1].trim();
    }

    // 3. Known industry role matches in candidateText
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

    // 4. First line fallback
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

const applicationTabs = [
  { name: "All", count: 48 },
  { name: "Submitted", count: 32 },
  { name: "In Progress", count: 8 },
  { name: "Needs Action", count: 3 },
  { name: "Failed", count: 4 },
  { name: "Skipped", count: 1 },
];

const recentApplications = [
  {
    id: 1,
    company: "Google",
    logo: googleLogo,
    jobTitle: "Product Designer",
    atsMatch: "96%",
    atsColor: "text-[#059669]",
    resume: "Tailored",
    resumeColor: "text-[#6366F1]",
    resumeIconColor: "#6366F1",
    status: "Submitted",
    statusDotColor: "bg-[#059669]",
    statusTextColor: "text-[#059669]",
    applied: "2 hours ago",
  },
  {
    id: 2,
    company: "Microsoft",
    logo: microsoftLogo,
    jobTitle: "Frontend Engineer",
    atsMatch: "92%",
    atsColor: "text-[#059669]",
    resume: "Tailored",
    resumeColor: "text-[#6366F1]",
    resumeIconColor: "#6366F1",
    status: "In Progress",
    statusDotColor: "bg-[#2563EB]",
    statusTextColor: "text-[#2563EB]",
    applied: "5 hours ago",
  },
  {
    id: 3,
    company: "Amazon",
    logo: amazonLogo,
    jobTitle: "Software Engineer",
    atsMatch: "89%",
    atsColor: "text-[#D97706]",
    resume: "Original",
    resumeColor: "text-[#475569]",
    resumeIconColor: "#475569",
    status: "Submitted",
    statusDotColor: "bg-[#059669]",
    statusTextColor: "text-[#059669]",
    applied: "1 day ago",
  },
  {
    id: 4,
    company: "Atlassian",
    logo: aiLogo,
    jobTitle: "UI/UX Designer",
    atsMatch: "87%",
    atsColor: "text-[#D97706]",
    resume: "Tailored",
    resumeColor: "text-[#6366F1]",
    resumeIconColor: "#6366F1",
    status: "Needs Action",
    statusDotColor: "bg-[#D97706]",
    statusTextColor: "text-[#D97706]",
    applied: "1 day ago",
  },
  {
    id: 5,
    company: "Shopify",
    logo: shopifyLogo,
    jobTitle: "Backend Engineer",
    atsMatch: "85%",
    atsColor: "text-[#D97706]",
    resume: "Tailored",
    resumeColor: "text-[#6366F1]",
    resumeIconColor: "#6366F1",
    status: "Failed",
    statusDotColor: "bg-[#DC2626]",
    statusTextColor: "text-[#DC2626]",
    applied: "2 days ago",
  },
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedAppTab, setSelectedAppTab] = useState("All");
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isJobSaved, setIsJobSaved] = useState(false);

  // Dynamic Jobs & Browse Jobs Pagination State
  const [jobs, setJobs] = useState([]);
  const [lastJobId, setLastJobId] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobError, setJobError] = useState(null);
  const [jobFeedbackMessage, setJobFeedbackMessage] = useState(null);
  const [hasLoadedInitialJobs, setHasLoadedInitialJobs] = useState(false);

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

  // Initialize Resume ID and any previously matched jobs from onboarding/profile state
  useEffect(() => {
    const initResumeAndJobs = async () => {
      try {
        const onboarding = getOnboardingState();
        let activeResumeId = onboarding?.resumeId || null;

        if (!activeResumeId) {
          activeResumeId = await getPrimaryResumeId();
        }

        if (activeResumeId) {
          setResumeId(activeResumeId);
        }

        if (Array.isArray(onboarding?.matches) && onboarding.matches.length > 0) {
          setJobs(onboarding.matches);
          const last = onboarding.matches[onboarding.matches.length - 1];
          const cursor = last?.job_id || last?.id;
          if (cursor) {
            setLastJobId(cursor);
          }
          setHasLoadedInitialJobs(true);
        }
      } catch (err) {
        console.warn("Could not initialize resume/jobs on Dashboard:", err);
      }
    };

    initResumeAndJobs();
  }, []);

  const handleBrowseJobs = async () => {
    if (isLoadingJobs) return;
    setIsLoadingJobs(true);
    setJobError(null);
    setJobFeedbackMessage(null);

    try {
      let activeResumeId = resumeId;
      if (!activeResumeId) {
        activeResumeId = await getPrimaryResumeId();
        if (activeResumeId) {
          setResumeId(activeResumeId);
        }
      }

      if (!activeResumeId) {
        setJobError("No resume found. Please upload your resume to browse matching jobs.");
        setIsLoadingJobs(false);
        return;
      }

      // Determine dynamic last job ID cursor
      let currentCursor = lastJobId;
      if (!currentCursor && jobs.length > 0) {
        const lastExisting = jobs[jobs.length - 1];
        currentCursor = lastExisting?.job_id || lastExisting?.id || null;
      }

      console.log("[Dashboard] Calling getMoreJobsForResume with:", {
        N: 10,
        LastJDid: currentCursor || "",
        top_k: 1000,
        ResumeID: activeResumeId,
      });

      const result = await getMoreJobsForResume({
        N: 10,
        LastJDid: currentCursor || "",
        top_k: 1000,
        ResumeID: activeResumeId,
      });

      const newMatches = Array.isArray(result?.matches) ? result.matches : [];

      if (newMatches.length === 0) {
        if (jobs.length > 0) {
          setJobFeedbackMessage("No more matching jobs found.");
        } else {
          setJobFeedbackMessage("No matching jobs found for your resume.");
        }
      } else {
        setJobs((prevJobs) => {
          // If previous jobs were static preview cards and not real API matches, replace them
          const isPrevStatic = prevJobs.length > 0 && !prevJobs[0].job_id;
          const baseJobs = isPrevStatic ? [] : prevJobs;
          const existingIds = new Set(baseJobs.map((j) => j.job_id || j.id));
          const filteredNew = newMatches.filter((m) => {
            const id = m.job_id || m.id;
            return id && !existingIds.has(id);
          });
          return [...baseJobs, ...filteredNew];
        });

        const lastMatch = newMatches[newMatches.length - 1];
        const newCursor = lastMatch?.job_id || lastMatch?.id;
        if (newCursor) {
          setLastJobId(newCursor);
        }
        setHasLoadedInitialJobs(true);
      }
    } catch (err) {
      console.error("Browse jobs error:", err);
      setJobError("Unable to load more jobs. Please try again.");
    } finally {
      setIsLoadingJobs(false);
    }
  };


  // Fetch / Load Matched Jobs from resume matching source of truth
  useEffect(() => {
    const loadMatchedJobs = () => {
      try {
        setIsLoadingJobs(true);
        const storedMatches = getStoredJobMatches();
        console.log("[Dashboard] Loaded stored job matches:", storedMatches);

        if (Array.isArray(storedMatches) && storedMatches.length > 0) {
          const transformed = storedMatches.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
          if (transformed.length > 0) {
            setJobs(transformed);
            return;
          }
        }

        const onboardingState = getOnboardingState();
        if (Array.isArray(onboardingState?.matches) && onboardingState.matches.length > 0) {
          const transformed = onboardingState.matches.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
          if (transformed.length > 0) {
            setJobs(transformed);
            return;
          }
        }

        // No matched jobs stored
        setJobs([]);
      } catch (err) {
        console.warn("[Dashboard] Error loading job matches:", err);
        setJobs([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadMatchedJobs();

    const handleMatchesUpdated = (e) => {
      if (Array.isArray(e?.detail) && e.detail.length > 0) {
        const transformed = e.detail.map((m, idx) => transformMatchToJob(m, idx)).filter(Boolean);
        setJobs(transformed);
      } else {
        loadMatchedJobs();
      }
    };

    window.addEventListener("jobMatchesUpdated", handleMatchesUpdated);
    window.addEventListener("storage", handleMatchesUpdated);
    return () => {
      window.removeEventListener("jobMatchesUpdated", handleMatchesUpdated);
      window.removeEventListener("storage", handleMatchesUpdated);
    };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = getStoredUser();
        const storedFullName =
          localStorage.getItem("userFullName") ||
          sessionStorage.getItem("userFullName") ||
          localStorage.getItem("userName") ||
          sessionStorage.getItem("userName") ||
          sessionStorage.getItem("pendingFullName") ||
          "";

        let currentEmail =
          user?.email ||
          localStorage.getItem("userEmail") ||
          sessionStorage.getItem("userEmail") ||
          sessionStorage.getItem("pendingVerificationEmail") ||
          "";

        let currentName =
          user?.fullName ||
          user?.name ||
          storedFullName ||
          "";

        if (currentName && currentName !== currentEmail) {
          setUserName(currentName);
        } else if (currentEmail) {
          const emailPrefix = currentEmail.split("@")[0];
          setUserName(emailPrefix);
        }

        try {
          const profileData = await getOnboardingProfile();
          if (profileData) {
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
          }
        } catch {
          // Fallback gracefully to stored credentials
        }
      } catch (err) {
        console.warn("Could not load user data in Dashboard:", err);
      }
    };

    loadUserData();
  }, []);

  // Enhance Resume Action Handler
  const handleEnhanceResume = async () => {
    if (isEnhancing || !selectedJobModal) return;
    setEnhanceError(null);
    setEnhanceSuccess(null);

    const candidateId = getCandidateId();
    const resumeId = getStoredResumeId();
    const selectedJobId = getJobId(selectedJobModal);

    console.log("[Dashboard] Triggering Enhance Resume with dynamic IDs:", {
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
      console.log("[Dashboard] Enhance Resume API Response:", result);

      setEnhancedResultsMap((prev) => ({
        ...prev,
        [selectedJobId]: result,
      }));
      setEnhanceSuccess("Resume successfully enhanced for this role!");
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

      console.log("[Dashboard] Requesting updated ATS score with payload:", payload);
      const response = await getScoreForEnhancedResume(payload);
      console.log("[Dashboard] Updated ATS API response:", response);

      const rawScore = response?.EnhATS ?? response?.score_data?.overall_score ?? response?.score;
      if (rawScore !== undefined && rawScore !== null && !isNaN(Number(rawScore))) {
        const parsedScore = Math.min(100, Math.max(1, Math.round(Number(rawScore))));
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

  // Filter jobs based on active search and filter options
  const filteredJobs = jobs.filter((job) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = job.title?.toLowerCase().includes(q);
      const matchComp = job.company?.toLowerCase().includes(q);
      const matchLoc = job.location?.toLowerCase().includes(q);
      const matchDesc = job.description?.toLowerCase().includes(q);
      const matchSkills = Array.isArray(job.requiredSkills) && job.requiredSkills.some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchComp && !matchLoc && !matchDesc && !matchSkills) {
        return false;
      }
    }

    if (selectedWorkplace.length > 0) {
      if (!selectedWorkplace.some((w) => job.workMode?.toLowerCase().includes(w.toLowerCase()))) {
        return false;
      }
    }

    if (selectedCompanies.length > 0) {
      if (!selectedCompanies.some((c) => job.company?.toLowerCase().includes(c.toLowerCase()))) {
        return false;
      }
    }

    if (selectedLocations.length > 0) {
      if (!selectedLocations.some((l) => job.location?.toLowerCase().includes(l.toLowerCase()))) {
        return false;
      }
    }

    if (selectedRoles.length > 0) {
      if (!selectedRoles.some((r) => job.title?.toLowerCase().includes(r.toLowerCase()))) {
        return false;
      }
    }

    if (selectedJobTypes.length > 0) {
      if (!selectedJobTypes.some((t) => job.type?.toLowerCase().includes(t.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });

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
          
          {/* Welcome Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              Welcome back, {userName || "User"}!
            </h1>
            <p className="text-[13px] text-[#64748B]">
              Your job search is running. We're finding, matching and applying to the best opportunities for you.
            </p>
          </div>

          {/* 1. Dashboard Statistics Cards */}
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

          {/* 2. Search & Filter Panel */}
          <div
            ref={dropdownRef}
            className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col gap-4 shadow-[0_1px_3px_rgba(15,23,42,0.02)]"
          >
            {/* First Row: Search Input + Clear + Apply */}
            <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-[240px] flex items-center gap-3 h-[44px] px-4 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#0F172A] focus-within:bg-white transition-all">
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
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] cursor-pointer text-[13px] transition-colors ${
                            isSelected
                              ? "bg-slate-50 text-[#0F172A] font-medium"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
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
                    {/* Search Input */}
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
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="Search locations..."
                        className="w-full text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                      />
                    </div>

                    <div className="text-[11px] font-semibold text-slate-400 tracking-wider px-1 pt-1">
                      POPULAR
                    </div>

                    <div className="flex flex-col gap-1">
                      {locationOptions
                        .filter((loc) =>
                          loc.name
                            .toLowerCase()
                            .includes(locationSearch.toLowerCase())
                        )
                        .map((loc) => {
                          const isChecked = selectedLocations.includes(loc.name);
                          return (
                            <div
                              key={loc.name}
                              onClick={() =>
                                toggleCheckbox(
                                  selectedLocations,
                                  setSelectedLocations,
                                  loc.name
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
                              <span className="flex-1">{loc.name}</span>
                              <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-[4px]">
                                {loc.badge}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Dropdown */}
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

              {/* Job Type Dropdown */}
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
                  <div className="absolute top-full left-0 mt-2 w-[170px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {jobTypeOptions.map((type) => {
                      const isChecked = selectedJobTypes.includes(type);
                      return (
                        <div
                          key={type}
                          onClick={() =>
                            toggleCheckbox(
                              selectedJobTypes,
                              setSelectedJobTypes,
                              type
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
                          <span>{type}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Workplace Dropdown */}
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
                  <div className="absolute top-full left-0 mt-2 w-[160px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {workplaceOptions.map((opt) => {
                      const isChecked = selectedWorkplace.includes(opt);
                      return (
                        <div
                          key={opt}
                          onClick={() =>
                            toggleCheckbox(
                              selectedWorkplace,
                              setSelectedWorkplace,
                              opt
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
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sponsors Visa Button */}
              <button
                type="button"
                onClick={() => setSponsorsVisa(!sponsorsVisa)}
                className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  sponsorsVisa
                    ? "border-slate-400 bg-slate-100 text-[#0F172A] font-medium"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                }`}
              >
                <span>Sponsors Visa</span>
              </button>

              {/* Employment Type Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("employmentType")}
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "employmentType" ||
                    selectedEmploymentTypes.length > 0
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
                  <div className="absolute top-full left-0 mt-2 w-[170px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1">
                    {employmentTypeOptions.map((type) => {
                      const isChecked = selectedEmploymentTypes.includes(type);
                      return (
                        <div
                          key={type}
                          onClick={() =>
                            toggleCheckbox(
                              selectedEmploymentTypes,
                              setSelectedEmploymentTypes,
                              type
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
                          <span>{type}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Companies Dropdown */}
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
                  <div className="absolute top-full left-0 mt-2 w-[270px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-3 z-50 flex flex-col gap-2">
                    {/* Search Input */}
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
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        placeholder="Search companies to show..."
                        className="w-full text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                      />
                    </div>

                    <div className="text-[11px] font-semibold text-slate-400 tracking-wider px-1 pt-1">
                      POPULAR
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
                              <span className="truncate">{comp}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Degree Level Dropdown */}
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
                            toggleCheckbox(
                              selectedDegrees,
                              setSelectedDegrees,
                              deg
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
                          <span>{deg}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Max Experience Dropdown */}
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
                  <div className="absolute top-full left-0 mt-2 w-[210px] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-0.5">
                    {experienceOptions.map((exp) => {
                      const isSelected = selectedExperience === exp;
                      return (
                        <div
                          key={exp}
                          onClick={() => {
                            setSelectedExperience(exp === selectedExperience ? "" : exp);
                            setActiveDropdown(null);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] cursor-pointer text-[13px] transition-colors ${
                            isSelected
                              ? "bg-slate-50 text-[#0F172A] font-medium"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
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

          {/* 3. Top Job Matches for You Section */}
          <div className="flex flex-col gap-4 w-full mt-1">
            {/* Section Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-col">
                <h2 className="text-[20px] md:text-[22px] font-bold text-[#0F172A] tracking-tight">
                  Top Job Matches for You
                </h2>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  AI matched jobs based on your profile, skills and preferences.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => filteredJobs.length > 0 && navigate("/auto-apply")}
                  disabled={filteredJobs.length === 0}
                  className={`h-[38px] px-4 rounded-[10px] text-[13px] font-medium flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap ${
                    filteredJobs.length > 0
                      ? "bg-[#4F46E5] hover:bg-[#4338CA] text-white active:scale-[0.99] cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <span>Auto Apply to all ({filteredJobs.length})</span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/browse-jobs")}
                  className="h-[38px] px-4 rounded-[10px] bg-white border border-[#E2E8F0] text-[#4F46E5] hover:bg-slate-50 text-[13px] font-medium flex items-center gap-1.5 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Browse Jobs</span>
                  <span className="text-[#4F46E5]">→</span>
                </button>
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

            {/* Feedback Message (e.g. No more matching jobs found) */}
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

            {/* Job Cards Grid */}
            {(() => {
              const displayJobs = filteredJobs;

              if (displayJobs.length === 0) {
                return (
                  <div className="p-8 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-[14px] font-semibold text-[#0F172A]">No more matching jobs found.</p>
                    <p className="text-[12.5px] text-[#64748B]">Click &ldquo;Browse Jobs&rdquo; to find opportunities matched with your resume.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
                  {displayJobs.map((job, idx) => {
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
                        key={job.job_id || job.id || `job-card-${idx}`}
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
                            /* Fallback Location & Posted Date */
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
              );
            })()}
            {/* Dynamic Job Cards Grid with Loading and Empty States */}
            {isLoadingJobs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col justify-between min-h-[230px] animate-pulse"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="w-[40px] h-[40px] rounded-[10px] bg-slate-100" />
                        <div className="w-16 h-5 rounded-full bg-slate-100" />
                      </div>
                      <div className="mt-3.5 space-y-2">
                        <div className="w-3/4 h-5 rounded bg-slate-100" />
                        <div className="w-1/2 h-4 rounded bg-slate-100" />
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="w-2/3 h-3.5 rounded bg-slate-100" />
                        <div className="w-1/3 h-3 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <div className="flex-1 h-9 rounded-[10px] bg-slate-100" />
                      <div className="flex-1 h-9 rounded-[10px] bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">No Job Matches Yet</h3>
                <p className="text-xs text-[#64748B] max-w-md">
                  Upload your resume in Resume Setup to automatically discover top job matches tailored specifically to your skills and experience.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/resume-setup")}
                  className="mt-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-[10px] shadow-xs transition-colors cursor-pointer"
                >
                  Upload Resume
                </button>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-8 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">No Matching Jobs Found</h3>
                <p className="text-xs text-[#64748B] max-w-sm">No jobs match your current search filters. Try clearing or relaxing your filters.</p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="mt-1 px-4 py-2 text-xs font-semibold text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-[10px] transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobModal(job)}
                    className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(15,23,42,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-200 min-h-[230px] cursor-pointer group"
                  >
                    <div>
                      {/* Top Header: Logo + Match Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-[40px] h-[40px] rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2">
                          <img
                            src={job.logo}
                            alt={job.company}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span
                          className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${job.matchColor}`}
                        >
                          {job.match}
                        </span>
                      </div>

                      {/* Job Title & Company */}
                      <div className="mt-3.5">
                        <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight leading-snug group-hover:text-[#4F46E5] transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[13px] text-[#64748B] font-normal mt-1">
                          <span className="truncate">{job.company}</span>
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
                          <span className="truncate">{job.location}</span>
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
                ))}
              </div>
            )}
          </div>

          {/* 4. Recent Applications Section */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-5 w-full mt-2">
            
            {/* Header: Title + View all applications */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-[18px] md:text-[20px] font-bold text-[#0F172A] tracking-tight">
                Recent Applications
              </h2>

              <button
                type="button"
                onClick={() => navigate("/tracker")}
                className="text-[13px] font-medium text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all applications</span>
                <span>→</span>
              </button>
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
                    className={`h-[34px] px-3.5 rounded-full text-[12.5px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#0F172A] text-white shadow-xs"
                        : "bg-[#F1F5F9] text-[#64748B] hover:bg-slate-200"
                    }`}
                  >
                    <span>{tab.name}</span>
                    <span className={isActive ? "text-slate-300" : "text-[#94A3B8]"}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table Container */}
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
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Company */}
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[28px] h-[28px] rounded-[6px] bg-white flex items-center justify-center shrink-0">
                            <img
                              src={app.logo}
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
                        {app.jobTitle}
                      </td>

                      {/* ATS Match */}
                      <td className="py-4 px-3">
                        <span className={`text-[13px] font-bold ${app.atsColor}`}>
                          {app.atsMatch}
                        </span>
                      </td>

                      {/* Resume */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1.5">
                          <DocumentIcon color={app.resumeIconColor} />
                          <span className={`text-[13px] font-medium ${app.resumeColor}`}>
                            {app.resume}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${app.statusDotColor}`} />
                          <span className={`text-[13px] font-medium ${app.statusTextColor}`}>
                            {app.status}
                          </span>
                        </div>
                      </td>

                      {/* Applied */}
                      <td className="py-4 px-3 text-[13px] text-[#64748B]">
                        {app.applied}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 text-right pr-2">
                        <button
                          type="button"
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

          </div>

        </main>
      </div>

      {/* Job Details Right Side Drawer Popup */}
      {selectedJobModal && (() => {
        const selectedJobId = getJobId(selectedJobModal);
        const currentMatch = selectedJobModal.rawMatch || jobs.find((j) => getJobId(j) === selectedJobId)?.rawMatch || null;

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

        const scoreData = currentMatch?.score_data || selectedJobModal.scoreData || null;
        const missingKeywords = Array.isArray(scoreData?.missing_keywords) ? scoreData.missing_keywords.filter(Boolean) : [];
        const missingRequiredSkills = Array.isArray(scoreData?.missing_required_skills) ? scoreData.missing_required_skills.filter(Boolean) : [];
        const missingPreferredSkills = Array.isArray(scoreData?.missing_preferred_skills) ? scoreData.missing_preferred_skills.filter(Boolean) : [];

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
                        src={selectedJobModal.logo}
                        alt={extractCleanCompany(selectedJobModal.company, selectedJobModal.description || selectedJobModal.fullJdText)}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight leading-snug break-words">
                        {extractCleanJobTitle(selectedJobModal.title, selectedJobModal.description || selectedJobModal.fullJdText)}
                      </h2>

                      <div className="flex items-center gap-1.5 text-[13.5px] text-[#475569] font-medium mt-1">
                        <span className="truncate">{extractCleanCompany(selectedJobModal.company, selectedJobModal.description || selectedJobModal.fullJdText)}</span>
                        <VerifiedTick />
                      </div>

                      <div className="flex items-center gap-2.5 text-[12px] text-[#64748B] mt-2 flex-wrap">
                        <span>{cleanHtmlText(selectedJobModal.fullLocation || selectedJobModal.location)}</span>
                        <span className="text-slate-300">•</span>
                        <span>{cleanHtmlText(selectedJobModal.type || "Full-time")}</span>
                        <span className="text-slate-300">•</span>
                        <span>{cleanHtmlText(selectedJobModal.workMode || "On-site")}</span>
                      </div>
                      <div className="text-[12px] text-[#64748B] mt-1">
                        {cleanHtmlText(selectedJobModal.department || "Software Engineering")}
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
                      <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={handleEnhanceResume}
                      disabled={isEnhancing}
                      className={`mt-2 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                        isEnhancing
                          ? "bg-indigo-300 cursor-not-allowed"
                          : "bg-[#4F46E5] hover:bg-[#4338CA]"
                      }`}
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
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                        <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                        <svg className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <p className="font-semibold text-[#3730A3]">{enhanceSuccess}</p>
                          <p className="text-[11.5px] text-[#4F46E5] mt-0.5">Resume tailored to bridge skill and keyword gaps for this role.</p>
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

                  {/* AI Enhanced Resume Card (When API Response is available) */}
                  {enhancedResultsMap[selectedJobId] && (
                    <div className="rounded-[16px] border border-[#C7D2FE] bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-slate-50 p-4.5 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#4F46E5] text-white flex items-center justify-center text-xs font-bold">
                            AI
                          </div>
                          <h4 className="text-[14px] font-bold text-[#0F172A]">AI Enhanced Resume</h4>
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
                            {Array.isArray(enhancedResultsMap[selectedJobId].bridgeable_gaps) && (
                              <span className="text-[11px] font-semibold text-[#4F46E5] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-full">
                                {enhancedResultsMap[selectedJobId].bridgeable_gaps.length} Skills Optimized
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {Array.isArray(enhancedResultsMap[selectedJobId].bridgeable_gaps) ? (
                              enhancedResultsMap[selectedJobId].bridgeable_gaps.map((gap, i) => {
                                if (typeof gap === "string") {
                                  return (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 bg-white text-slate-800 border border-[#E0E7FF] rounded-lg p-2.5 shadow-2xs"
                                    >
                                      <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">✓</span>
                                      <span className="text-[12px] font-semibold text-slate-900">{gap}</span>
                                    </div>
                                  );
                                }

                                const skill = gap?.skill || gap?.name || gap?.title || "";
                                const severity = gap?.severity || (gap?.source ? String(gap.source).toUpperCase() : "");
                                const rationale = gap?.rationale || gap?.description || gap?.reason || "";

                                return (
                                  <div
                                    key={i}
                                    className="bg-white text-slate-800 border border-[#E0E7FF] rounded-xl p-2.5 shadow-2xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">✓</span>
                                        <span className="text-[12px] font-bold text-slate-900 truncate">
                                          {skill || "Optimized Skill"}
                                        </span>
                                      </div>
                                      {severity && (
                                        <span
                                          className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                                            severity === "CRITICAL"
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
                            ) : typeof enhancedResultsMap[selectedJobId].bridgeable_gaps === "object" ? (
                              Object.entries(enhancedResultsMap[selectedJobId].bridgeable_gaps).map(([k, v], i) => (
                                <div
                                  key={i}
                                  className="bg-white text-slate-800 border border-[#E0E7FF] rounded-xl p-2.5 shadow-2xs space-y-1"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">✓</span>
                                    <span className="text-[12px] font-bold text-slate-900">{k}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-snug pl-5.5 font-normal">
                                    {String(v)}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-[12px] text-slate-600">{String(enhancedResultsMap[selectedJobId].bridgeable_gaps)}</p>
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
                          <div className="bg-white rounded-lg border border-slate-200 p-3 max-h-[160px] overflow-y-auto text-[11.5px] text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                            {enhancedResultsMap[selectedJobId]?.EnhResume ||
                              enhancedResultsMap[selectedJobId]?.enhResume ||
                              enhancedResultsMap[selectedJobId]?.enhanced_resume}
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
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
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
                            {activeAtsScore !== null ? `${activeAtsScore}%` : "N/A"}
                          </span>
                          <span className="text-[9px] text-[#64748B] font-medium leading-none mt-0.5">
                            Match
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <h3 className="text-[14.5px] font-bold text-[#0F172A]">ATS Match</h3>
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

                    {/* Get Updated ATS Button (Appears when resume has been enhanced) */}
                    {enhancedResultsMap[selectedJobId] && (
                      <button
                        type="button"
                        onClick={handleGetUpdatedAts}
                        disabled={isUpdatingAts}
                        className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold rounded-xl shadow-xs shrink-0 whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
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

                  {/* ATS Identified Gaps & Missing Skills from Resume Upload Response */}
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
                    <div className="text-[12.5px] text-[#475569] leading-relaxed mt-1.5 whitespace-pre-line">
                      {cleanHtmlText(selectedJobModal.description || selectedJobModal.fullJdText || selectedJobModal.preview)}
                    </div>
                  </div>

                  {/* Key Responsibilities */}
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A]">Key responsibilities:</h3>
                    <ul className="space-y-2 mt-2">
                      {(selectedJobModal.responsibilities || []).map((resp, idx) => (
                        <li key={idx} className="text-[12.5px] text-[#475569] flex items-start gap-2 leading-snug">
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
                          className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
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
                          className="bg-[#F1F5F9] text-[#334155] rounded-[8px] px-3 py-1.5 text-[12px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0F172A] mb-2.5">Job details</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      <div className="flex flex-col text-[12.5px]">
                        <span className="text-[#64748B]">Experience</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5">{selectedJobModal.experience}</span>
                      </div>
                      <div className="flex flex-col text-[12.5px]">
                        <span className="text-[#64748B]">Work mode</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5">{selectedJobModal.workMode}</span>
                      </div>
                      <div className="flex flex-col text-[12.5px]">
                        <span className="text-[#64748B]">Employment type</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5">{selectedJobModal.type}</span>
                      </div>
                      <div className="flex flex-col text-[12.5px]">
                        <span className="text-[#64748B]">Location</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5">{selectedJobModal.fullLocation}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Drawer Footer */}
                <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsJobSaved(!isJobSaved)}
                    className={`flex-1 h-[42px] rounded-[10px] border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isJobSaved
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
                                  className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    severity === "CRITICAL"
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

export default Dashboard;