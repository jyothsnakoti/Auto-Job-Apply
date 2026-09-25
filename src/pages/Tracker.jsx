import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import googleLogo from "../assets/google.svg";
import microsoftLogo from "../assets/microsoft.svg";
import amazonLogo from "../assets/amazon.svg";
import aiLogo from "../assets/ai.svg";
import shopifyLogo from "../assets/shopify.svg";
import tickIcon from "../assets/tick.svg";

const DocumentIcon = ({ color = "#6366F1" }) => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const VerifiedTick = () => (
  <img
    src={tickIcon}
    alt="Verified"
    className="w-[14px] h-[14px] object-contain shrink-0"
  />
);

const applicationTabs = [
  { name: "All", count: 48 },
  { name: "Submitted", count: 32 },
  { name: "In Progress", count: 8 },
  { name: "Needs Action", count: 3 },
  { name: "Failed", count: 4 },
  { name: "Skipped", count: 1 },
];

const trackerApplications = [
  {
    id: 1,
    company: "Google",
    logo: googleLogo,
    jobTitle: "Product Designer",
    atsMatch: "96%",
    matchPercent: 96,
    atsColor: "text-[#059669]",
    resume: "Tailored",
    resumeColor: "text-[#6366F1]",
    resumeIconColor: "#6366F1",
    status: "Submitted",
    statusCategory: "Submitted",
    statusDotColor: "bg-[#059669]",
    statusTextColor: "text-[#059669]",
    applied: "2 hours ago",
    location: "Bengaluru, IN",
    fullLocation: "Bengaluru, Karnataka, IN",
    type: "Full-time",
    workMode: "On-site",
    department: "Product Design",
    description:
      "As a Product Designer at Google, you will lead end-to-end design initiatives that make complex technology simple and accessible for billions of people.",
    responsibilities: [
      "Create holistic design systems, user journeys, prototypes, and specifications",
      "Collaborate with engineering, product, and research teams to deliver intuitive interfaces",
      "Conduct user interviews and translate research insights into actionable designs",
      "Champion design quality and accessibility across multi-platform experiences",
    ],
    requiredSkills: ["Figma", "UI/UX Design", "Design Systems", "Prototyping", "User Research"],
    preferredSkills: ["Motion Design", "Design Tokens", "Accessibility (a11y)"],
    experience: "3 – 6 years",
  },
  {
    id: 2,
    company: "Microsoft",
    logo: microsoftLogo,
    jobTitle: "Frontend Engineer",
    atsMatch: "92%",
    matchPercent: 92,
    atsColor: "text-[#059669]",
    resume: "Tailored",
    resumeColor: "text-[#6366F1]",
    resumeIconColor: "#6366F1",
    status: "In Progress",
    statusCategory: "In Progress",
    statusDotColor: "bg-[#2563EB]",
    statusTextColor: "text-[#2563EB]",
    applied: "5 hours ago",
    location: "Hyderabad, IN",
    fullLocation: "Hyderabad, Telangana, IN",
    type: "Full-time",
    workMode: "Hybrid",
    department: "Frontend Engineering",
    description:
      "As a Frontend Engineer at Microsoft, you will architect and build highly responsive, accessible web applications that empower enterprise customers.",
    responsibilities: [
      "Develop scalable web apps using React, TypeScript, and modern browser APIs",
      "Ensure web performance, accessibility, and cross-browser reliability",
      "Write automated tests and collaborate in code reviews",
    ],
    requiredSkills: ["React", "TypeScript", "JavaScript", "HTML5/CSS3", "Redux"],
    preferredSkills: ["GraphQL", "Next.js", "Jest/Cypress"],
    experience: "3 – 5 years",
  },
  {
    id: 3,
    company: "Amazon",
    logo: amazonLogo,
    jobTitle: "Software Engineer",
    atsMatch: "89%",
    matchPercent: 89,
    atsColor: "text-[#D97706]",
    resume: "Original",
    resumeColor: "text-[#475569]",
    resumeIconColor: "#475569",
    status: "Submitted",
    statusCategory: "Submitted",
    statusDotColor: "bg-[#059669]",
    statusTextColor: "text-[#059669]",
    applied: "1 day ago",
    location: "Bengaluru, IN",
    fullLocation: "Bengaluru, Karnataka, IN",
    type: "Full-time",
    workMode: "On-site",
    department: "Backend Engineering",
    description:
      "Join Amazon to build and scale distributed backend services with ultra-low latency and five-nines availability.",
    responsibilities: [
      "Design and deploy high-throughput microservices on AWS infrastructure",
      "Participate in operational readiness and system architecture reviews",
      "Optimize performance and system reliability across services",
    ],
    requiredSkills: ["Java", "AWS", "Distributed Systems", "Microservices"],
    preferredSkills: ["DynamoDB", "Kafka", "Docker/K8s"],
    experience: "2 – 5 years",
  },
  {
    id: 4,
    company: "Atlassian",
    logo: aiLogo,
    jobTitle: "UI/UX Designer",
    atsMatch: "87%",
    matchPercent: 87,
    atsColor: "text-[#D97706]",
    resume: "Tailored",
    resumeColor: "text-[#6366F1]",
    resumeIconColor: "#6366F1",
    status: "Needs Action",
    statusCategory: "Needs Action",
    statusDotColor: "bg-[#D97706]",
    statusTextColor: "text-[#D97706]",
    applied: "1 day ago",
    location: "Remote",
    fullLocation: "Remote, Global",
    type: "Full-time",
    workMode: "Remote",
    department: "Product Design",
    description:
      "Craft seamless collaboration workflows for Jira and Confluence, empowering agile teams worldwide.",
    responsibilities: [
      "Create high-fidelity wireframes, interactive prototypes, and design specs",
      "Partner with engineers to ensure design precision in product implementation",
    ],
    requiredSkills: ["Figma", "UI Design", "User Research", "Prototyping"],
    preferredSkills: ["Design Systems", "Accessibility"],
    experience: "2 – 4 years",
  },
  {
    id: 5,
    company: "Shopify",
    logo: shopifyLogo,
    jobTitle: "Backend Engineer",
    atsMatch: "85%",
    matchPercent: 85,
    atsColor: "text-[#D97706]",
    resume: "Tailored",
    resumeColor: "text-[#6366F1]",
    resumeIconColor: "#6366F1",
    status: "Failed",
    statusCategory: "Failed",
    statusDotColor: "bg-[#DC2626]",
    statusTextColor: "text-[#DC2626]",
    applied: "2 days ago",
    location: "Remote",
    fullLocation: "Remote, Global",
    type: "Full-time",
    workMode: "Remote",
    department: "Infrastructure Engineering",
    description:
      "Build merchant-facing backend services that handle millions of requests during peak commerce events like Black Friday.",
    responsibilities: [
      "Design robust APIs and scalable database models in Ruby and Go",
      "Troubleshoot production incidents and optimize query performance",
    ],
    requiredSkills: ["Ruby", "Go", "PostgreSQL", "Kafka"],
    preferredSkills: ["Kubernetes", "Redis", "Elasticsearch"],
    experience: "3 – 5 years",
  },
];

const Tracker = () => {
  const [selectedAppTab, setSelectedAppTab] = useState("All");
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [isJobSaved, setIsJobSaved] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedJobModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredApplications = trackerApplications.filter((app) => {
    if (selectedAppTab === "All") return true;
    return app.statusCategory === selectedAppTab;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Application Tracker Main Content */}
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              Application Tracker
            </h1>
            <p className="text-[13px] text-[#64748B]">
              Track the status of all your job applications and manage any actions required.
            </p>
          </div>

          {/* Table Container Card */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-6 w-full">
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

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
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
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                      onClick={() => setSelectedJobModal(app)}
                    >
                      {/* Company */}
                      <td className="py-4.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[28px] h-[28px] rounded-[6px] bg-white flex items-center justify-center shrink-0">
                            <img
                              src={app.logo}
                              alt={app.company}
                              className="w-[20px] h-[20px] object-contain"
                            />
                          </div>
                          <span className="text-[14px] font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                            {app.company}
                          </span>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="py-4.5 px-3 text-[13.5px] font-medium text-[#334155]">
                        {app.jobTitle}
                      </td>

                      {/* ATS Match */}
                      <td className="py-4.5 px-3">
                        <span className={`text-[13px] font-bold ${app.atsColor}`}>
                          {app.atsMatch}
                        </span>
                      </td>

                      {/* Resume */}
                      <td className="py-4.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <DocumentIcon color={app.resumeIconColor} />
                          <span className={`text-[13px] font-medium ${app.resumeColor}`}>
                            {app.resume}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${app.statusDotColor}`} />
                          <span className={`text-[13px] font-medium ${app.statusTextColor}`}>
                            {app.status}
                          </span>
                        </div>
                      </td>

                      {/* Applied */}
                      <td className="py-4.5 px-3 text-[13px] text-[#64748B]">
                        {app.applied}
                      </td>

                      {/* Actions */}
                      <td className="py-4.5 pl-3 text-right pr-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobModal(app);
                          }}
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
                    {selectedJobModal.jobTitle || selectedJobModal.title}
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
                    <span>{selectedJobModal.department || "Engineering"}</span>
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

export default Tracker;
