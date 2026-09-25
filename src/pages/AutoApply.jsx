import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import googleLogo from "../assets/google.svg";
import microsoftLogo from "../assets/microsoft.svg";
import amazonLogo from "../assets/amazon.svg";
import aiLogo from "../assets/ai.svg";
import mapIcon from "../assets/map.svg";
import tickIcon from "../assets/tick.svg";

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

const autoApplyJobs = [
  {
    id: 1,
    title: "Sr. Software Engineer II",
    company: "Google",
    location: "Bengaluru, IN",
    fullLocation: "Bengaluru, Karnataka, IN",
    type: "Full-time",
    workMode: "On-site",
    department: "Software Engineering",
    posted: "Posted 2 days ago",
    matchPercent: 96,
    matchCircleColor: "#0D9488",
    logo: googleLogo,
    defaultSelected: true,
    description:
      "As a Senior Software Engineer, you will design, develop, test, deploy and maintain software solutions that solve complex problems at scale. You will work with cross-functional teams to build products and services used by millions of users worldwide.",
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
    location: "Bengaluru, IN",
    fullLocation: "Bengaluru, Karnataka, IN",
    type: "Full-time",
    workMode: "On-site",
    department: "Frontend Engineering",
    posted: "Posted 2 days ago",
    matchPercent: 92,
    matchCircleColor: "#0D9488",
    logo: microsoftLogo,
    defaultSelected: true,
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
    workMode: "Remote",
    department: "Backend Engineering",
    posted: "Posted 1 day ago",
    matchPercent: 89,
    matchCircleColor: "#D97706",
    logo: amazonLogo,
    defaultSelected: true,
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
    posted: "Posted 1 day ago",
    matchPercent: 87,
    matchCircleColor: "#D97706",
    logo: aiLogo,
    defaultSelected: false,
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
  {
    id: 5,
    title: "UI/UX Designer",
    company: "Atlassian",
    location: "Remote",
    fullLocation: "Remote, Global",
    type: "Full-time",
    workMode: "Remote",
    department: "Product Design",
    posted: "Posted 1 day ago",
    matchPercent: 87,
    matchCircleColor: "#D97706",
    logo: aiLogo,
    defaultSelected: false,
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
  {
    id: 6,
    title: "UI/UX Designer",
    company: "Atlassian",
    location: "Remote",
    fullLocation: "Remote, Global",
    type: "Full-time",
    workMode: "Remote",
    department: "Product Design",
    posted: "Posted 1 day ago",
    matchPercent: 87,
    matchCircleColor: "#D97706",
    logo: aiLogo,
    defaultSelected: false,
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

const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-[14px] h-[14px] object-contain shrink-0"
  />
);

const AutoApply = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isJobSaved, setIsJobSaved] = useState(false);

  // Selected Jobs for Auto Apply (Default: Google, Microsoft, Amazon => IDs 1, 2, 3)
  const [selectedJobIds, setSelectedJobIds] = useState([1, 2, 3]);

  // Settings State
  const [resumeVersion, setResumeVersion] = useState("Use job-specific tailored resume (Recommended)");
  const [coverLetter, setCoverLetter] = useState("Auto-generate using job details");
  const [appQuestions, setAppQuestions] = useState("Auto-answer using profile");
  const [appPace, setAppPace] = useState("Apply sequentially (Recommended)");

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

  const toggleJobSelection = (id) => {
    if (selectedJobIds.includes(id)) {
      setSelectedJobIds(selectedJobIds.filter((jId) => jId !== id));
    } else {
      setSelectedJobIds([...selectedJobIds, id]);
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

        {/* Auto Apply Main Content */}
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              Auto Apply
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
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${
                            isSelected
                              ? "font-semibold text-[#0F172A] bg-slate-50"
                              : "text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
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

              {/* 4. Job Type Dropdown */}
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

              {/* 5. Workplace Dropdown */}
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
                className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  sponsorsVisa
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
                  className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDropdown === "employmentType" || selectedEmploymentTypes.length > 0
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
                            toggleCheckbox(selectedDegrees, setSelectedDegrees, deg)
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

              {/* 10. Max Experience Dropdown */}
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
                          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${
                            isSelected
                              ? "font-semibold text-[#0F172A] bg-slate-50"
                              : "text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
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

          {/* Main 2-Column Content: Left Jobs Selection List + Right Plan & Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
            
            {/* Left Column (8 cols): Select Jobs to Auto Apply Card */}
            <div className="lg:col-span-8 bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-4">
              
              {/* Card Header */}
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight">
                  Select Jobs to Auto Apply
                </h2>
                <p className="text-[13px] text-[#64748B]">
                  Choose from your matched jobs or use filters to find more opportunities.
                </p>
              </div>

              {/* Status Header: Selected count badge */}
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#475569] pt-1">
                <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>{selectedJobIds.length} of 247 jobs selected</span>
              </div>

              {/* Job List Container */}
              <div className="flex flex-col divide-y divide-slate-100 mt-1">
                {autoApplyJobs.map((job) => {
                  const isSelected = selectedJobIds.includes(job.id);
                  return (
                    <div
                      key={job.id}
                      className="py-4.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 -mx-6 px-6 transition-colors group cursor-pointer"
                      onClick={() => toggleJobSelection(job.id)}
                    >
                      {/* Left: Checkbox + Logo + Title & Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Circle Checkbox */}
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

                        {/* Company Logo */}
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2">
                          <img
                            src={job.logo}
                            alt={job.company}
                            className="w-full h-full object-contain"
                          />
                        </div>

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

                      {/* Right: ATS Match Donut + Bookmark + Posted Date */}
                      <div className="flex items-center gap-4 shrink-0">
                        {/* Circular Donut Match Score */}
                        <div className="relative w-[38px] h-[38px] shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-slate-100"
                              strokeWidth="3.2"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={job.matchPercent >= 90 ? "text-[#0D9488]" : "text-[#D97706]"}
                              strokeDasharray={`${job.matchPercent}, 100`}
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-[10.5px] font-bold text-[#0F172A]">
                            {job.matchPercent}%
                          </span>
                        </div>

                        {/* Bookmark Icon */}
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>

                        {/* Posted Date */}
                        <span className="text-[12px] text-[#94A3B8] w-[95px] text-right hidden sm:inline-block">
                          {job.posted}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
                    className="text-[12.5px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                  >
                    Manage Plan
                  </button>
                </div>

                <div className="flex flex-col mt-0.5">
                  <span className="text-[14px] font-bold text-[#0F172A]">Pro Plan</span>
                  <span className="text-[12px] text-[#64748B] mt-0.5">100 applications per month</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#E2E8F0] h-[6px] rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#2563EB] h-full rounded-full" style={{ width: "48%" }} />
                </div>

                {/* Usage Footnote */}
                <div className="flex items-center justify-between text-[11.5px] text-[#64748B]">
                  <span>48 used</span>
                  <span>52 remaining</span>
                </div>
              </div>

              {/* 2. Auto Apply Settings Card */}
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-5">
                
                {/* Header with Gear Icon */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-[8px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-[14.5px] font-bold text-[#0F172A]">
                      Auto Apply Settings
                    </h3>
                    <p className="text-[12px] text-[#64748B] mt-0.5">
                      Configure how applications will be processed.
                    </p>
                  </div>
                </div>

                {/* Settings Fields */}
                <div className="flex flex-col gap-4">
                  
                  {/* Setting 1: Resume Version */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-semibold text-[#0F172A]">
                      Resume Version
                    </label>
                    <div className="relative">
                      <select
                        value={resumeVersion}
                        onChange={(e) => setResumeVersion(e.target.value)}
                        className="w-full h-[38px] px-3 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[12.5px] text-[#334155] outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Use job-specific tailored resume (Recommended)</option>
                        <option>Use master default resume</option>
                        <option>Always ask before tailoring</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <span className="text-[11.5px] text-[#94A3B8]">
                      A tailored resume will be generated for each job.
                    </span>
                  </div>

                  {/* Setting 2: Cover Letter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-semibold text-[#0F172A]">
                      Cover Letter
                    </label>
                    <div className="relative">
                      <select
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="w-full h-[38px] px-3 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[12.5px] text-[#334155] outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Auto-generate using job details</option>
                        <option>Use standard default template</option>
                        <option>Do not attach cover letter</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <span className="text-[11.5px] text-[#94A3B8]">
                      A personalized cover letter will be created for each application.
                    </span>
                  </div>

                  {/* Setting 3: Application Questions */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-semibold text-[#0F172A]">
                      Application Questions
                    </label>
                    <div className="relative">
                      <select
                        value={appQuestions}
                        onChange={(e) => setAppQuestions(e.target.value)}
                        className="w-full h-[38px] px-3 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[12.5px] text-[#334155] outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Auto-answer using profile</option>
                        <option>Flag unknown questions for review</option>
                        <option>Manual confirmation for all questions</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <span className="text-[11.5px] text-[#94A3B8]">
                      We'll use your profile information to answer application questions.
                    </span>
                  </div>

                  {/* Setting 4: Application Pace */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-semibold text-[#0F172A]">
                      Application Pace
                    </label>
                    <div className="relative">
                      <select
                        value={appPace}
                        onChange={(e) => setAppPace(e.target.value)}
                        className="w-full h-[38px] px-3 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[12.5px] text-[#334155] outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Apply sequentially (Recommended)</option>
                        <option>Apply with randomized human delay</option>
                        <option>Fast parallel submission</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <span className="text-[11.5px] text-[#94A3B8]">
                      More stable and reduces detection risk.
                    </span>
                  </div>
                </div>

                {/* Start Auto Apply Action Button */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    className="h-[46px] w-full rounded-[12px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-medium flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Start Auto Apply ({selectedJobIds.length} jobs)</span>
                  </button>

                  <span className="text-[11.5px] text-[#94A3B8] text-center">
                    This will use {selectedJobIds.length.toString().padStart(2, "0")} applications from your quota.
                  </span>
                </div>

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
              <div className="flex items-start gap-3.5">
                <div className="w-[46px] h-[46px] rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2.5 mt-0.5">
                  <img
                    src={selectedJobModal.logo}
                    alt={selectedJobModal.company}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex flex-col">
                  <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight leading-tight">
                    {selectedJobModal.title}
                  </h2>

                  <div className="flex items-center gap-1.5 text-[14px] text-[#475569] font-medium mt-1">
                    <span>{selectedJobModal.company}</span>
                    <VerifiedTick />
                  </div>

                  <div className="flex items-center gap-2.5 text-[12.5px] text-[#64748B] mt-2 flex-wrap">
                    <span>{selectedJobModal.fullLocation || selectedJobModal.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedJobModal.type || "Full-time"}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedJobModal.workMode || "On-site"}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedJobModal.department || "Software Engineering"}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedJobModal(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
                  {selectedJobModal.description}
                </p>
              </div>

              {/* Key Responsibilities */}
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A]">Key responsibilities:</h3>
                <ul className="space-y-2 mt-2">
                  {selectedJobModal.responsibilities.map((resp, idx) => (
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
                  {selectedJobModal.requiredSkills.map((skill) => (
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
                  {selectedJobModal.preferredSkills.map((skill) => (
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
                    <span className="font-semibold text-[#0F172A]">{selectedJobModal.experience}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-[#64748B]">Work mode</span>
                    <span className="font-semibold text-[#0F172A]">{selectedJobModal.workMode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-[#64748B]">Employment type</span>
                    <span className="font-semibold text-[#0F172A]">{selectedJobModal.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-[#64748B]">Location</span>
                    <span className="font-semibold text-[#0F172A]">{selectedJobModal.fullLocation}</span>
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
                  className={`flex-1 h-[44px] rounded-[12px] border text-[13.5px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
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
      )}
    </div>
  );
};

export default AutoApply;
