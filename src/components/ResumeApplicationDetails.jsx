import React, { useState, useMemo } from "react";

const ResumeApplicationDetails = ({
  resumeApplications = [],
  onResumeChange,
}) => {
  const [selectedResume, setSelectedResume] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Keep the existing API response mapping
  const resumes = useMemo(
    () =>
      resumeApplications.map((resume, index) => ({
        id: String(resume.resumeId),
        name: resume.resumeName || `Resume ${index + 1}`,
        count: Number(resume.submittedCount) || 0,
      })),
    [resumeApplications]
  );

  // Keep existing filtering functionality
  const selectedResumeData =
    selectedResume === "all"
      ? null
      : resumes.find((resume) => resume.id === selectedResume);

  const totalApplications =
    selectedResume === "all"
      ? resumes.reduce((total, resume) => total + resume.count, 0)
      : selectedResumeData?.count ?? 0;

  const selectedResumeName =
    selectedResumeData?.name || "All resumes";

  return (
    <div className="relative w-full min-w-0 self-start rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
      {/* Header and compact dropdown */}
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="truncate text-sm font-regular text-[#0F172A] sm:text-base">
            Application submitted  Count
          </h2>

          
        </div>

        {/* Dropdown stays inside the card */}
        <div className="relative shrink-0">
          <button
            type="button"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            onClick={() => setIsDropdownOpen((open) => !open)}
            className="flex h-10 max-w-[155px] items-center gap-2 rounded-xl border border-[#C7C5FF] bg-white px-2.5 text-sm text-[#0F172A] transition hover:bg-[#F8F7FF] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE] sm:max-w-[190px] sm:px-3"
          >
            <svg
              className="h-5 w-5 shrink-0 text-[#4F46E5]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
            </svg>

            <span className="min-w-0 flex-1 truncate text-left">
              {selectedResumeName}
            </span>

            <svg
              className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {isDropdownOpen && (
            <>
              <button
                type="button"
                aria-label="Close resume filter"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div
  role="listbox"
  aria-label="Filter applications by resume"
  className="resume-dropdown-scroll absolute right-0 top-full z-20 mt-2 max-h-[150px] w-[240px] max-w-[calc(100vw-48px)] overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-lg" 
>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedResume === "all"}
                 onClick={() => {
  setSelectedResume("all");
  onResumeChange?.(null);
  setIsDropdownOpen(false);
}}
                  className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                    selectedResume === "all"
                      ? "bg-[#F0EDFF] font-medium text-[#4F46E5]"
                      : "text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  All resumes
                </button>

                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    type="button"
                    role="option"
                    aria-selected={selectedResume === resume.id}
                    title={resume.name}
                    onClick={() => {
  setSelectedResume(resume.id);
  onResumeChange?.(resume.id);
  setIsDropdownOpen(false);
}}
                    className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                      selectedResume === resume.id
                        ? "bg-[#F0EDFF] font-medium text-[#4F46E5]"
                        : "text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {resume.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compact application count */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F0EDFF]">
          <svg
            className="h-5 w-5 text-[#4F46E5]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold leading-tight tracking-tight text-[#0F172A]">
            {totalApplications}
          </p>
          <p
            className="mt-1 max-w-[180px] truncate text-sm text-[#64748B]"
            title={selectedResumeName}
          >
            {selectedResumeName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumeApplicationDetails;
