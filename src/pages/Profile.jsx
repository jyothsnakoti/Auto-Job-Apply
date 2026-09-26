import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Profile = () => {
  // Personal Info State
  const [fullName, setFullName] = useState("Naresh P");
  const [email, setEmail] = useState("nareshpulluri79@gmail.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [linkedin, setLinkedin] = useState("https://www.linkedin.com/in/nareshp");

  // Location & Work Auth State
  const [currentLocation, setCurrentLocation] = useState("Bengaluru, Karnataka, India");
  const [openToRelocate, setOpenToRelocate] = useState("Yes");
  const [citizenship, setCitizenship] = useState(["India"]);
  const [targetCountries, setTargetCountries] = useState([
    "India",
    "United States",
    "Canada",
    "United Kingdom",
  ]);

  // Diversity & Inclusion State
  const [gender, setGender] = useState("Male");
  const [ethnicity, setEthnicity] = useState("Prefer not to say");
  const [veteran, setVeteran] = useState("No");
  const [disability, setDisability] = useState("No");

  // Work Preferences State (replacing Skills & Experience as shown in Image 2)
  const [inPersonWork, setInPersonWork] = useState("Yes");
  const [startImmediately, setStartImmediately] = useState("Yes");
  const [reliableTransportation, setReliableTransportation] = useState("No");
  const [workplaceAccommodations, setWorkplaceAccommodations] = useState("Prefer Not to say");

  const removeCountry = (cToRemove) => {
    setTargetCountries(targetCountries.filter((c) => c !== cToRemove));
  };

  const removeCitizenship = (cToRemove) => {
    setCitizenship(citizenship.filter((c) => c !== cToRemove));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Profile Main Content */}
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              Profile
            </h1>
            <p className="text-[13px] text-[#64748B]">
              Manage your profile, resume, job preferences and application settings. This information is used to find the best job matches and fill applications for you.
            </p>
          </div>

          {/* Top Row: Personal Information + Resume Management */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
            {/* 1. Personal Information (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-[16px] font-bold text-[#0F172A]">
                      Personal Information
                    </h2>
                    <p className="text-[12.5px] text-[#64748B] mt-0.5">
                      Basic information used for job matching and applications.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-[40px] px-3.5 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-[40px] px-3.5 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 transition-colors truncate"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Phone Number
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 h-[40px] px-2.5 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-slate-700 shrink-0">
                        <span className="text-base leading-none">🇮🇳</span>
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 h-[40px] px-3.5 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 transition-colors min-w-0"
                      />
                    </div>
                  </div>

                  {/* LinkedIn Profile */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      LinkedIn Profile
                    </label>
                    <div className="flex items-center gap-2 h-[40px] px-3 rounded-[10px] border border-[#E2E8F0] bg-white focus-within:border-slate-400 transition-colors">
                      <div className="w-4 h-4 rounded-[3px] bg-[#0A66C2] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        in
                      </div>
                      <input
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="flex-1 bg-transparent border-0 text-[13px] text-[#0F172A] font-medium outline-none truncate min-w-0"
                      />
                      <a
                        href={linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-[#0A66C2] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Resume Management (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <h2 className="text-[16px] font-bold text-[#0F172A]">
                      Resume Management
                    </h2>
                    <p className="text-[12.5px] text-[#64748B] mt-0.5">
                      Upload and manage your resumes.
                    </p>
                  </div>
                </div>

                {/* Uploaded Resume Card */}
                <div className="mt-5 p-3.5 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC]/70 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[42px] h-[42px] rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-[13.5px] font-bold text-[#0F172A] truncate">
                        Naresh_P_Resume.pdf
                      </span>
                      <span className="text-[11.5px] text-[#94A3B8] mt-0.5">
                        Uploaded on Oct 20, 2024 • 1.2 MB
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                </div>

                {/* Upload Resume Button (Below file box as in Image 2) */}
                <button
                  type="button"
                  className="w-full mt-4 h-[40px] px-4 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span className="text-base leading-none font-normal">+</span>
                  <span>Upload Resume</span>
                </button>
              </div>
            </div>
          </div>

          {/* Middle Row: Location & Work Authorization Card (Full Width - Work Mode Removed) */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-5 w-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col">
                <h2 className="text-[16px] font-bold text-[#0F172A]">
                  Location & Work Authorization
                </h2>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">
                  Tell us where you can work so we can find the right opportunities.
                </p>
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
            </div>

            {/* Current Location + Open to Relocate */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Current Location (10 Cols) */}
              <div className="lg:col-span-10 flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#64748B]">
                  Address
                </label>
                <div className="flex items-center justify-between h-[42px] px-3.5 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="truncate">{currentLocation}</span>
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Open to Relocate Toggle (2 Cols) */}
              <div className="lg:col-span-2 flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#64748B] whitespace-nowrap">
                  Open to Relocate
                </label>
                <div className="flex items-center h-[42px] p-1 rounded-[10px] border border-[#E2E8F0] bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenToRelocate("Yes")}
                    className={`flex-1 h-full rounded-[7px] text-[12.5px] font-semibold transition-all cursor-pointer ${
                      openToRelocate === "Yes"
                        ? "bg-[#2563EB] text-white shadow-2xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenToRelocate("No")}
                    className={`flex-1 h-full rounded-[7px] text-[12.5px] font-semibold transition-all cursor-pointer ${
                      openToRelocate === "No"
                        ? "bg-[#2563EB] text-white shadow-2xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* Countries: Citizenship & Target Countries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Countries of Citizenship */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#64748B]">
                  Countries of Citizenship
                </label>
                <div className="min-h-[42px] p-1.5 px-3 rounded-[10px] border border-[#E2E8F0] bg-white flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {citizenship.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F1F5F9] text-[#334155] text-[12.5px] font-medium"
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => removeCitizenship(c)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Countries where you want to work */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#64748B]">
                  Countries where you want to work
                </label>
                <div className="min-h-[42px] p-1.5 px-3 rounded-[10px] border border-[#E2E8F0] bg-white flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {targetCountries.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F1F5F9] text-[#334155] text-[12.5px] font-medium"
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => removeCountry(c)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Diversity & Inclusion + Work Preferences (Replacing Skills & Experience) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch">
            {/* 1. Diversity & Inclusion (Optional) */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-[16px] font-bold text-[#0F172A]">
                      Diversity & Inclusion <span className="font-normal text-[#64748B] text-[13px]">(Optional)</span>
                    </h2>
                    <p className="text-[12.5px] text-[#64748B] mt-0.5">
                      Help us match you with inclusive employers.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </div>

                {/* 2x2 Dropdowns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  {/* Gender */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Non-binary</option>
                        <option>Prefer not to say</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Race / Ethnicity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Race / Ethnicity
                    </label>
                    <div className="relative">
                      <select
                        value={ethnicity}
                        onChange={(e) => setEthnicity(e.target.value)}
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Prefer not to say</option>
                        <option>Asian</option>
                        <option>Black / African American</option>
                        <option>Hispanic / Latino</option>
                        <option>White / Caucasian</option>
                        <option>Other</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Veteran Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Veteran Status
                    </label>
                    <div className="relative">
                      <select
                        value={veteran}
                        onChange={(e) => setVeteran(e.target.value)}
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>No</option>
                        <option>Yes</option>
                        <option>Prefer not to say</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Disability Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Disability Status
                    </label>
                    <div className="relative">
                      <select
                        value={disability}
                        onChange={(e) => setDisability(e.target.value)}
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>No</option>
                        <option>Yes</option>
                        <option>Prefer not to say</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Work Preferences (Replacing Skills & Experience as shown in Image 2) */}
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-[16px] font-bold text-[#0F172A]">
                      Work Preferences
                    </h2>
                    <p className="text-[12.5px] text-[#64748B] mt-0.5">
                      Help us match you with inclusive employers.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </div>

                {/* 2x2 Dropdowns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  {/* Open to in-person work? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Open to in-person work?
                    </label>
                    <div className="relative">
                      <select
                        value={inPersonWork}
                        onChange={(e) => setInPersonWork(e.target.value)}
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Yes</option>
                        <option>No</option>
                        <option>Hybrid only</option>
                        <option>Prefer not to say</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Can start immediately? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Can start immediately?
                    </label>
                    <div className="relative">
                      <select
                        value={startImmediately}
                        onChange={(e) => setStartImmediately(e.target.value)}
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Yes</option>
                        <option>No</option>
                        <option>2 weeks notice</option>
                        <option>1 month notice</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Reliable transportation? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Reliable transportation?
                    </label>
                    <div className="relative">
                      <select
                        value={reliableTransportation}
                        onChange={(e) => setReliableTransportation(e.target.value)}
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>No</option>
                        <option>Yes</option>
                        <option>Public transit</option>
                        <option>Prefer not to say</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Need workplace accommodations? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      Need workplace accommodations?
                    </label>
                    <div className="relative">
                      <select
                        value={workplaceAccommodations}
                        onChange={(e) => setWorkplaceAccommodations(e.target.value)}
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none focus:border-slate-400 appearance-none cursor-pointer"
                      >
                        <option>Prefer Not to say</option>
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
