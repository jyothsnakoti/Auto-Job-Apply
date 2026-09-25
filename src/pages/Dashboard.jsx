import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

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

const topJobs = [
  {
    id: 1,
    title: "Software Engineer II",
    company: "Google",
    location: "Bengaluru, IN",
    fullLocation: "Bengaluru, Karnataka, IN",
    type: "Full-time",
    workMode: "On-site",
    department: "Software Engineering",
    posted: "Posted 2 days ago",
    match: "96% match",
    matchPercent: 96,
    matchColor: "bg-[#ECFDF5] text-[#059669]",
    logo: googleLogo,
    description:
      "As a Software Engineer, you will design, develop, test, deploy and maintain software solutions that solve complex problems at scale. You will work with cross-functional teams to build products and services used by millions of users worldwide.",
    responsibilities: [
      "Design and develop scalable, reliable and efficient software systems",
      "Collaborate with product, design and engineering teams",
      "Write clean, maintainable and well-tested code",
      "Participate in code reviews and technical discussions",
      "Contribute to system design and architecture decisions",
      "Improve existing systems for performance, scalability and reliability",
    ],
    requiredSkills: [
      "Java",
      "Python",
      "C++",
      "Data Structures",
      "Algorithms",
      "Software Development",
    ],
    preferredSkills: ["Distributed Systems", "Cloud", "SQL"],
    experience: "2 – 6 years",
  },
  {
    id: 2,
    title: "Frontend Engineer",
    company: "Microsoft",
    location: "Hyderabad, IN",
    fullLocation: "Hyderabad, Telangana, IN",
    type: "Full-time",
    workMode: "Hybrid",
    department: "Frontend Engineering",
    posted: "Posted 2 days ago",
    match: "92% match",
    matchPercent: 92,
    matchColor: "bg-[#ECFDF5] text-[#059669]",
    logo: microsoftLogo,
    description:
      "As a Frontend Engineer at Microsoft, you will architect and build highly intuitive, accessible, and responsive user interfaces that delight millions of enterprise and consumer users daily.",
    responsibilities: [
      "Develop responsive and accessible web applications using React, TypeScript, and modern web APIs",
      "Partner with UX designers and product managers to iterate on product specs and wireframes",
      "Ensure high performance, accessibility (a11y), and cross-browser compatibility across devices",
      "Write comprehensive automated unit and integration tests",
      "Champion code quality, review pull requests, and mentor junior engineers",
    ],
    requiredSkills: [
      "React",
      "TypeScript",
      "JavaScript",
      "HTML5/CSS3",
      "Redux",
      "Web Performance",
    ],
    preferredSkills: ["GraphQL", "Next.js", "Jest/Cypress"],
    experience: "3 – 5 years",
  },
  {
    id: 3,
    title: "Software Development Engineer",
    company: "Amazon",
    location: "Bengaluru, IN",
    fullLocation: "Bengaluru, Karnataka, IN",
    type: "Full-time",
    workMode: "On-site",
    department: "Backend Engineering",
    posted: "Posted 2 days ago",
    match: "89% match",
    matchPercent: 89,
    matchColor: "bg-[#FFFBEB] text-[#D97706]",
    logo: amazonLogo,
    description:
      "Join Amazon as an SDE to build and scale distributed web services that handle millions of transactions per second with ultra-low latency and high reliability.",
    responsibilities: [
      "Design and implement high-scale backend services using Java and AWS technologies",
      "Own end-to-end service architecture, deployment pipelines, and operational readiness",
      "Participate in design reviews, threat modeling, and reliability engineering",
      "Collaborate with principal engineers to solve complex architectural challenges",
    ],
    requiredSkills: [
      "Java",
      "AWS",
      "Distributed Systems",
      "Microservices",
      "Data Structures",
    ],
    preferredSkills: ["DynamoDB", "Kafka", "Docker/K8s"],
    experience: "2 – 5 years",
  },
  {
    id: 4,
    title: "UI/UX Designer",
    company: "Atlassian",
    location: "Remote",
    fullLocation: "Remote, Global",
    type: "Full-time",
    workMode: "Remote",
    department: "Product Design",
    posted: "Posted 2 days ago",
    match: "87% match",
    matchPercent: 87,
    matchColor: "bg-[#FFFBEB] text-[#D97706]",
    logo: aiLogo,
    description:
      "As a UI/UX Designer at Atlassian, you will craft seamless and intuitive collaboration workflows for Jira and Confluence, empowering agile teams across the globe.",
    responsibilities: [
      "Create high-fidelity wireframes, user journeys, prototypes, and UI specifications in Figma",
      "Conduct qualitative and quantitative user research, usability tests, and design sprints",
      "Collaborate with design system teams to maintain consistency with Atlassian Design Guidelines",
      "Work closely with engineers during implementation to ensure design accuracy and polish",
    ],
    requiredSkills: [
      "Figma",
      "UI Design",
      "User Research",
      "Prototyping",
      "Design Systems",
    ],
    preferredSkills: ["Design Tokens", "Accessibility", "Micro-interactions"],
    experience: "2 – 4 years",
  },
];

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

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedAppTab, setSelectedAppTab] = useState("All");
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isJobSaved, setIsJobSaved] = useState(false);

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

        {/* Dashboard Main Content */}
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          
          {/* Welcome Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              Welcome back, Jyothsna!
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
                  className="h-[38px] px-4 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-medium flex items-center gap-1.5 shadow-xs active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Auto Apply to all 5</span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="h-[38px] px-4 rounded-[10px] bg-white border border-[#E2E8F0] text-[#4F46E5] hover:bg-slate-50 text-[13px] font-medium flex items-center gap-1.5 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Browse Jobs</span>
                  <span className="text-[#4F46E5]">→</span>
                </button>
              </div>
            </div>

            {/* 4 Job Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4.5 w-full">
              {topJobs.map((job) => (
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
      {selectedJobModal && (
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
                <div className="flex items-start gap-3.5">
                  <div className="w-[44px] h-[44px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2 mt-0.5">
                    <img
                      src={selectedJobModal.logo}
                      alt={selectedJobModal.company}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex flex-col">
                    <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight leading-tight">
                      {selectedJobModal.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-[13.5px] text-[#475569] font-medium mt-0.5">
                      <span>{selectedJobModal.company}</span>
                      <VerifiedTick />
                    </div>

                    <div className="flex items-center gap-3 text-[12px] text-[#64748B] mt-2 flex-wrap">
                      <span>{selectedJobModal.fullLocation || selectedJobModal.location}</span>
                      <span>{selectedJobModal.type || "Full-time"}</span>
                      <span>{selectedJobModal.workMode || "On-site"}</span>
                    </div>
                    <div className="text-[12px] text-[#64748B] mt-0.5">
                      {selectedJobModal.department || "Software Engineering"}
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedJobModal(null)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* ATS Match Box */}
                <div className="rounded-[16px] border border-slate-200/80 bg-[#F8FAFC]/70 p-4.5 flex items-center gap-4">
                  <div className="relative w-[68px] h-[68px] shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#0D9488]"
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
                    <h3 className="text-[14.5px] font-bold text-[#0F172A]">ATS Match</h3>
                    <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Strong match based on your profile, skills, experience and preferences.
                    </p>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <h3 className="text-[14px] font-bold text-[#0F172A]">Job description</h3>
                  <p className="text-[12.5px] text-[#475569] leading-relaxed mt-1.5">
                    {selectedJobModal.description}
                  </p>
                </div>

                {/* Key Responsibilities */}
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

                {/* Required Skills */}
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

                {/* Preferred Skills */}
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
                      ? "border-blue-300 bg-blue-50 text-[#2563EB]"
                      : "border-[#BFDBFE] bg-white text-[#2563EB] hover:bg-blue-50/50"
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
      )}
    </div>
  );
};

export default Dashboard;