import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  getOnboardingProfile,
  getStoredUser,
  updatePersonalProfile,
  updateLocationProfile,
  updateWorkPreferencesProfile,
  getResumes,
  uploadResume,
  downloadResume,
  deleteResume,
  setPrimaryResume,
  validateResumeFile,
} from "../services/api";

const toCapitalizedYesNo = (val, defaultVal = "No") => {
  if (val === true || val === "yes" || val === "Yes" || val === "YES") return "Yes";
  if (val === false || val === "no" || val === "No" || val === "NO") return "No";
  if (val === "prefer-not-to-say" || val === "Prefer not to say" || val === "Prefer Not to say") return "Prefer Not to say";
  if (val === "hybrid" || val === "hybrid only" || val === "Hybrid only") return "Hybrid only";
  if (val === "2 weeks notice" || val === "2-weeks-notice") return "2 weeks notice";
  if (val === "1 month notice" || val === "1-month-notice") return "1 month notice";
  if (val === "public transit" || val === "public-transit") return "Public transit";
  return val ? String(val) : defaultVal;
};

const normalizeGender = (val) => {
  if (!val) return "Prefer not to say";
  const lower = String(val).toLowerCase();
  if (lower === "male") return "Male";
  if (lower === "female") return "Female";
  if (lower === "non-binary" || lower === "nonbinary") return "Non-binary";
  return "Prefer not to say";
};

const normalizeEthnicity = (val) => {
  if (!val) return "Prefer not to say";
  const lower = String(val).toLowerCase();
  if (lower.includes("asian")) return "Asian";
  if (lower.includes("black") || lower.includes("african")) return "Black / African American";
  if (lower.includes("hispanic") || lower.includes("latino")) return "Hispanic / Latino";
  if (lower.includes("white") || lower.includes("caucasian")) return "White / Caucasian";
  if (lower.includes("other")) return "Other";
  return val;
};

const Profile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isSavingWorkPrefs, setIsSavingWorkPrefs] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Raw Location details from server
  const [rawLocationDetails, setRawLocationDetails] = useState({
    addressLine1: "Hitech City Road",
    city: "Hyderabad",
    state: "Telangana",
    postcode: "500081",
    countyDistrict: "Rangareddy",
    country: "India",
  });

  // Edit Mode States
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingWorkPrefs, setIsEditingWorkPrefs] = useState(false);

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

  // Work Preferences State
  const [inPersonWork, setInPersonWork] = useState("Yes");
  const [startImmediately, setStartImmediately] = useState("Yes");
  const [reliableTransportation, setReliableTransportation] = useState("No");
  const [workplaceAccommodations, setWorkplaceAccommodations] = useState("Prefer Not to say");

  // Resume Management State
  const [resumes, setResumes] = useState([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [resumeLoadError, setResumeLoadError] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [deletingResumeId, setDeletingResumeId] = useState(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);
  const resumeFileInputRef = React.useRef(null);

  const formatResumeDate = (dateVal) => {
    if (!dateVal) return "Uploaded recently";
    try {
      const date = new Date(dateVal);
      if (isNaN(date.getTime())) return String(dateVal);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatResumeSize = (size) => {
    if (!size || isNaN(size)) return null;
    const bytes = Number(size);
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fetchUserResumes = async () => {
    try {
      setIsLoadingResumes(true);
      setResumeLoadError(null);
      const data = await getResumes();
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.resumes)) {
        list = data.resumes;
      } else if (data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data && (data.id || data.fileName || data.name || data.title)) {
        list = [data];
      }
      setResumes(list);
    } catch (err) {
      console.error("Failed to load resumes:", err);
      setResumeLoadError("Unable to load resumes.");
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleDownloadResume = async (resume) => {
    const targetId = resume?.id ?? resume?.resumeId ?? resume?._id ?? resume?.fileId ?? resume?.uuid;
    if (!targetId && targetId !== 0) {
      setDownloadError("Invalid resume identifier. Please refresh the page and try again.");
      return;
    }
    if (downloadingResumeId === targetId) return;
    try {
      setDownloadingResumeId(targetId);
      setDownloadError(null);
      const filename =
        resume.fileName ||
        resume.filename ||
        resume.name ||
        resume.title ||
        "resume.pdf";
      await downloadResume(targetId, filename);
    } catch (err) {
      console.error("Failed to download resume:", err);
      setDownloadError(err.message || "Failed to download resume.");
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const handleDeleteResume = async (resume) => {
    const targetId = resume?.id ?? resume?.resumeId ?? resume?._id ?? resume?.fileId ?? resume?.uuid;
    if (!targetId && targetId !== 0) {
      setDownloadError("Invalid resume identifier. Please refresh the page and try again.");
      return;
    }
    if (deletingResumeId === targetId) return;
    try {
      setDeletingResumeId(targetId);
      setDownloadError(null);
      await deleteResume(targetId);
      await fetchUserResumes();
      setToast({
        show: true,
        message: "Resume deleted successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to delete resume:", err);
      setDownloadError(err.message || "Failed to delete resume. Please try again.");
    } finally {
      setDeletingResumeId(null);
    }
  };

  const handleSetPrimary = async (resume) => {
    const targetId = resume?.id ?? resume?.resumeId ?? resume?._id ?? resume?.fileId ?? resume?.uuid;
    if (!targetId && targetId !== 0) {
      setDownloadError("Invalid resume identifier. Please refresh the page and try again.");
      return;
    }
    if (settingPrimaryId === targetId) return;
    try {
      setSettingPrimaryId(targetId);
      setDownloadError(null);
      await setPrimaryResume(targetId);
      await fetchUserResumes();
      setToast({
        show: true,
        message: "Default resume updated successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to set default resume:", err);
      setDownloadError(err.message || "Unable to set this resume as default.");
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleResumeFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so identical file can be re-selected if needed
    e.target.value = "";

    const validation = validateResumeFile(file);
    if (!validation.valid) {
      setResumeUploadError(validation.error);
      return;
    }

    try {
      setIsUploadingResume(true);
      setResumeUploadError(null);
      await uploadResume(file);
      await fetchUserResumes();
      setToast({
        show: true,
        message: "Resume uploaded successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("Resume upload error from profile:", err);
      setResumeUploadError(err.message || "Unable to upload resume. Please try again.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  useEffect(() => {
    fetchUserResumes();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getOnboardingProfile();
        if (data) {
          if (data.fullName || data.name) setFullName(data.fullName || data.name);
          if (data.email) setEmail(data.email);

          const prof = data.profile || {};

          if (prof.phone || prof.phoneNumber) setPhone(prof.phone || prof.phoneNumber);
          if (prof.linkedinUrl || prof.linkedin) setLinkedin(prof.linkedinUrl || prof.linkedin);

          setRawLocationDetails({
            addressLine1: prof.addressLine1 || prof.address || "Hitech City Road",
            city: prof.city || "Hyderabad",
            state: prof.state || "Telangana",
            postcode: prof.postcode || prof.postalCode || "500081",
            countyDistrict: prof.countyDistrict || prof.district || "Rangareddy",
            country: prof.country || "India",
          });

          const addrParts = [prof.addressLine1, prof.city, prof.state, prof.country].filter(Boolean);
          if (addrParts.length > 0) {
            setCurrentLocation(addrParts.join(", "));
          } else if (prof.addressLine1 || prof.address) {
            setCurrentLocation(prof.addressLine1 || prof.address);
          }

          if (prof.willingToRelocate !== undefined) {
            setOpenToRelocate(toCapitalizedYesNo(prof.willingToRelocate, "Yes"));
          }

          if (Array.isArray(data.citizenships) && data.citizenships.length > 0) {
            setCitizenship(data.citizenships);
          } else if (prof.citizenships && Array.isArray(prof.citizenships)) {
            setCitizenship(prof.citizenships);
          }

          if (Array.isArray(data.workEligibility) && data.workEligibility.length > 0) {
            const countries = data.workEligibility
              .map((w) => (typeof w === "string" ? w : w.country))
              .filter(Boolean);
            if (countries.length > 0) setTargetCountries(countries);
          }

          if (prof.gender) setGender(normalizeGender(prof.gender));
          if (prof.raceEthnicity || prof.ethnicity) {
            setEthnicity(normalizeEthnicity(prof.raceEthnicity || prof.ethnicity));
          }
          if (prof.veteranStatus !== undefined) setVeteran(toCapitalizedYesNo(prof.veteranStatus, "No"));
          if (prof.disabilityStatus !== undefined) setDisability(toCapitalizedYesNo(prof.disabilityStatus, "No"));

          if (prof.openToInPerson !== undefined) setInPersonWork(toCapitalizedYesNo(prof.openToInPerson, "Yes"));
          if (prof.canStartImmediately !== undefined) {
            setStartImmediately(toCapitalizedYesNo(prof.canStartImmediately, "Yes"));
          }
          if (prof.reliableTransportation !== undefined) {
            setReliableTransportation(toCapitalizedYesNo(prof.reliableTransportation, "No"));
          }
          if (prof.needAccommodations !== undefined || prof.workplaceAccommodations !== undefined) {
            setWorkplaceAccommodations(
              toCapitalizedYesNo(
                prof.needAccommodations ?? prof.workplaceAccommodations,
                "Prefer Not to say"
              )
            );
          }
        }
      } catch (err) {
        console.warn("Could not fetch onboarding profile API, using stored user details fallback:", err);
        const user = getStoredUser();
        if (user.email) setEmail(user.email);
        if (user.name || user.fullName) setFullName(user.name || user.fullName);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleSavePersonal = async () => {
    try {
      setIsSavingPersonal(true);
      const response = await updatePersonalProfile({
        fullName,
        phone,
        linkedinUrl: linkedin,
      });

      const message =
        response?.message ||
        (typeof response === "string" ? response : "Personal information updated.");

      // Sync stored user if available
      try {
        const storedUser = getStoredUser();
        if (storedUser && typeof storedUser === "object") {
          const updatedUser = { ...storedUser, fullName, name: fullName };
          localStorage.setItem("authUser", JSON.stringify(updatedUser));
          sessionStorage.setItem("authUser", JSON.stringify(updatedUser));
        }
      } catch (storageErr) {
        console.warn("Could not update local stored user:", storageErr);
      }

      setToast({
        show: true,
        message,
        type: "success",
      });

      setIsEditingPersonal(false);
    } catch (err) {
      console.error("Failed to save personal profile:", err);
      const errMsg =
        err?.message ||
        err?.data?.message ||
        "Failed to update personal information";
      setToast({
        show: true,
        message: errMsg,
        type: "error",
      });
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      setIsSavingLocation(true);

      const parts = (currentLocation || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const addressLine1 = parts[0] || rawLocationDetails.addressLine1 || currentLocation || "Hitech City Road";
      const city = parts[1] || rawLocationDetails.city || "Hyderabad";
      const state = parts[2] || rawLocationDetails.state || "Telangana";
      const country = parts[3] || parts[parts.length - 1] || rawLocationDetails.country || "India";

      const payload = {
        addressLine1,
        city,
        state,
        postcode: rawLocationDetails.postcode || "500081",
        countyDistrict: rawLocationDetails.countyDistrict || "Rangareddy",
        country,
        willingToRelocate: openToRelocate.toLowerCase() === "no" ? "no" : "yes",
      };

      const response = await updateLocationProfile(payload);
      const message =
        response?.message ||
        (typeof response === "string" ? response : "Location & work authorization updated.");

      setToast({
        show: true,
        message,
        type: "success",
      });

      setIsEditingLocation(false);
    } catch (err) {
      console.error("Failed to save location profile:", err);
      const errMsg =
        err?.message ||
        err?.data?.message ||
        "Failed to update location & work authorization";
      setToast({
        show: true,
        message: errMsg,
        type: "error",
      });
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleSaveWorkPrefs = async () => {
    try {
      setIsSavingWorkPrefs(true);

      const payload = {
        openToInPerson: inPersonWork,
        canStartImmediately: startImmediately,
        reliableTransportation: reliableTransportation,
        workplaceAccommodations: workplaceAccommodations,
      };

      const response = await updateWorkPreferencesProfile(payload);
      const message =
        response?.message ||
        (typeof response === "string" ? response : "Work preferences updated.");

      setToast({
        show: true,
        message,
        type: "success",
      });

      setIsEditingWorkPrefs(false);
    } catch (err) {
      console.error("Failed to save work preferences:", err);
      const errMsg =
        err?.message ||
        err?.data?.message ||
        "Failed to update work preferences";
      setToast({
        show: true,
        message: errMsg,
        type: "error",
      });
    } finally {
      setIsSavingWorkPrefs(false);
    }
  };

  const removeCountry = (cToRemove) => {
    if (!isEditingLocation) return;
    setTargetCountries(targetCountries.filter((c) => c !== cToRemove));
  };

  const removeCitizenship = (cToRemove) => {
    if (!isEditingLocation) return;
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
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
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
                    onClick={() => setIsEditingPersonal((prev) => !prev)}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>{isEditingPersonal ? "Cancel" : "Edit"}</span>
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
                      readOnly={!isEditingPersonal}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`h-[40px] px-3.5 rounded-[10px] border text-[13px] font-medium outline-none transition-all ${isEditingPersonal
                          ? "border-indigo-400 bg-white text-[#0F172A] ring-2 ring-indigo-500/10 focus:border-indigo-500"
                          : "border-[#E2E8F0] bg-slate-50/50 text-[#0F172A] cursor-default"
                        }`}
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
                      readOnly={!isEditingPersonal}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`h-[40px] px-3.5 rounded-[10px] border text-[13px] font-medium outline-none transition-all truncate ${isEditingPersonal
                          ? "border-indigo-400 bg-white text-[#0F172A] ring-2 ring-indigo-500/10 focus:border-indigo-500"
                          : "border-[#E2E8F0] bg-slate-50/50 text-[#0F172A] cursor-default"
                        }`}
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
                        readOnly={!isEditingPersonal}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`flex-1 h-[40px] px-3.5 rounded-[10px] border text-[13px] font-medium outline-none transition-all min-w-0 ${isEditingPersonal
                            ? "border-indigo-400 bg-white text-[#0F172A] ring-2 ring-indigo-500/10 focus:border-indigo-500"
                            : "border-[#E2E8F0] bg-slate-50/50 text-[#0F172A] cursor-default"
                          }`}
                      />
                    </div>
                  </div>

                  {/* LinkedIn Profile */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-[#64748B]">
                      LinkedIn Profile
                    </label>
                    <div
                      className={`flex items-center gap-2 h-[40px] px-3 rounded-[10px] border transition-all ${isEditingPersonal
                          ? "border-indigo-400 bg-white ring-2 ring-indigo-500/10"
                          : "border-[#E2E8F0] bg-slate-50/50"
                        }`}
                    >
                      <div className="w-4 h-4 rounded-[3px] bg-[#0A66C2] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        in
                      </div>
                      <input
                        type="text"
                        value={linkedin}
                        readOnly={!isEditingPersonal}
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

                {/* Save Button (Right side corner) */}
                {isEditingPersonal && (
                  <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                    <button
                      type="button"
                      disabled={isSavingPersonal}
                      onClick={handleSavePersonal}
                      className="px-6 h-[38px] rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold shadow-sm hover:shadow active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingPersonal ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Resume Management (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-[20px] border border-[#E2E8F0] p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col justify-between">
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

                {/* Upload or Download Errors */}
                {resumeUploadError && (
                  <div className="mt-3.5 p-3 rounded-[12px] bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
                    <span>{resumeUploadError}</span>
                    <button
                      type="button"
                      onClick={() => setResumeUploadError(null)}
                      className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}

                {downloadError && (
                  <div className="mt-3.5 p-3 rounded-[12px] bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
                    <span>{downloadError}</span>
                    <button
                      type="button"
                      onClick={() => setDownloadError(null)}
                      className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Content: Loading State */}
                {isLoadingResumes ? (
                  <div className="mt-5 p-6 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC]/70 flex flex-col items-center justify-center gap-2 text-center">
                    <svg className="w-5 h-5 text-[#4F46E5] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-[13px] font-medium text-[#64748B]">Loading resumes...</span>
                  </div>
                ) : resumeLoadError ? (
                  /* Error State */
                  <div className="mt-5 p-5 rounded-[14px] border border-red-200 bg-red-50/60 flex flex-col items-center justify-center gap-2 text-center">
                    <span className="text-[13px] font-medium text-red-700">Unable to load resumes.</span>
                    <button
                      type="button"
                      onClick={fetchUserResumes}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Retry
                    </button>
                  </div>
                ) : resumes.length === 0 ? (
                  /* Empty State */
                  <div className="mt-5 p-6 rounded-[14px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/50 flex flex-col items-center justify-center gap-1 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <span className="text-[13.5px] font-semibold text-[#0F172A]">No resumes uploaded yet</span>
                    <span className="text-[12px] text-[#64748B]">Upload your resume to get matched with opportunities.</span>
                  </div>
                ) : (
                  /* List of Resumes */
                  <div className="mt-4 flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-0.5">
                    {resumes.map((resume, idx) => {
                      const realResumeId = resume.id ?? resume.resumeId ?? resume.fileId ?? resume._id ?? resume.uuid;
                      const resumeId = realResumeId;
                      const itemKey = realResumeId ?? `resume-item-${idx}`;
                      const resumeName =
                        resume.fileName ||
                        resume.filename ||
                        resume.name ||
                        resume.title ||
                        `${(fullName || "User").replace(/\s+/g, "_")}_Resume.pdf`;
                      const uploadDate = formatResumeDate(
                        resume.uploadedAt ||
                          resume.createdAt ||
                          resume.uploadDate ||
                          resume.created_at
                      );
                      const sizeStr = formatResumeSize(resume.fileSize || resume.size);
                      const isDownloading = realResumeId !== undefined && downloadingResumeId === realResumeId;
                      const isDeleting = realResumeId !== undefined && deletingResumeId === realResumeId;
                      const isSettingPrimary = realResumeId !== undefined && settingPrimaryId === realResumeId;

                      const hasExplicitPrimary = resumes.some(
                        (r) =>
                          r.isPrimary === true ||
                          r.primary === true ||
                          r.isDefault === true ||
                          r.default === true
                      );
                      const isPrimary = Boolean(
                        resume.isPrimary === true ||
                          resume.primary === true ||
                          resume.isDefault === true ||
                          resume.default === true ||
                          (!hasExplicitPrimary && idx === 0)
                      );

                      return (
                        <div
                          key={itemKey}
                          className={`p-3 sm:p-3.5 rounded-[14px] border flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 transition-colors ${
                            isPrimary
                              ? "border-indigo-200/80 bg-indigo-50/30 hover:bg-indigo-50/50"
                              : "border-[#E2E8F0] bg-[#F8FAFC]/70 hover:bg-slate-50"
                          }`}
                        >
                          {/* File Icon + Info + Default Badge */}
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${
                              isPrimary ? "bg-[#EEF2FF] text-[#4F46E5]" : "bg-slate-100 text-slate-500"
                            }`}>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] font-bold text-[#0F172A] truncate" title={resumeName}>
                                  {resumeName}
                                </span>
                                {isPrimary && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200/80 shadow-2xs shrink-0">
                                    <svg className="w-2.5 h-2.5 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    Default
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
                                Uploaded: {uploadDate} {sizeStr ? `• ${sizeStr}` : ""}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons Toolbar */}
                          <div className="flex items-center gap-1.5 shrink-0 justify-end self-end md:self-center">
                            {/* Make Default Button (if not already default) */}
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetPrimary({
                                    ...resume,
                                    id: realResumeId,
                                    fileName: resumeName,
                                  })
                                }
                                disabled={isDownloading || isDeleting || isSettingPrimary}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-indigo-50 hover:border-indigo-200 hover:text-[#4F46E5] text-slate-600 text-[11.5px] sm:text-[12px] font-medium transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                                title="Set as default resume"
                              >
                                {isSettingPrimary ? (
                                  <>
                                    <svg className="w-3.5 h-3.5 text-[#4F46E5] animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Setting...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    <span>Make Default</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Download Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadResume({
                                  ...resume,
                                  id: realResumeId,
                                  fileName: resumeName,
                                })
                              }
                              disabled={isDownloading || isDeleting || isSettingPrimary}
                              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 hover:border-slate-300 text-[#4F46E5] text-[11.5px] sm:text-[12px] font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                              title="Download resume file"
                            >
                              {isDownloading ? (
                                <>
                                  <svg className="w-3.5 h-3.5 text-[#4F46E5] animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span className="hidden xs:inline">Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span>Download</span>
                                </>
                              )}
                            </button>

                            {/* Dustbin / Trash Delete Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteResume({
                                  ...resume,
                                  id: realResumeId,
                                  fileName: resumeName,
                                })
                              }
                              disabled={isDownloading || isDeleting || isSettingPrimary}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                              title="Delete resume"
                              aria-label={`Delete ${resumeName}`}
                            >
                              {isDeleting ? (
                                <svg className="w-3.5 h-3.5 text-red-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={resumeFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeFileSelect}
                  style={{ display: "none" }}
                />

                {/* Upload New Resume Button */}
                <button
                  type="button"
                  onClick={() => resumeFileInputRef.current?.click()}
                  disabled={isUploadingResume}
                  className="w-full mt-4 h-[40px] px-4 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUploadingResume ? (
                    <>
                      <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Uploading Resume...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base leading-none font-normal">+</span>
                      <span>Upload New Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Middle Row: Location & Work Authorization Card */}
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
                onClick={() => setIsEditingLocation((prev) => !prev)}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>{isEditingLocation ? "Cancel" : "Edit"}</span>
              </button>
            </div>

            {/* Current Location + Open to Relocate */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Current Location (10 Cols) */}
              <div className="lg:col-span-10 flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#64748B]">
                  Address
                </label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="h-[42px] px-3.5 rounded-[10px] border border-indigo-400 bg-white text-[13px] text-[#0F172A] font-medium outline-none ring-2 ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center justify-between h-[42px] px-3.5 rounded-[10px] border border-[#E2E8F0] bg-slate-50/50 text-[13px] text-[#0F172A] font-medium">
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
                )}
              </div>

              {/* Open to Relocate Toggle (2 Cols) */}
              <div className="lg:col-span-2 flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#64748B] whitespace-nowrap">
                  Open to Relocate
                </label>
                <div className="flex items-center h-[42px] p-1 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC]/60">
                  <button
                    type="button"
                    disabled={!isEditingLocation}
                    onClick={() => setOpenToRelocate("Yes")}
                    className={`flex-1 h-full rounded-[8px] text-[13px] font-semibold transition-all ${isEditingLocation ? "cursor-pointer" : "cursor-default"
                      } ${openToRelocate === "Yes"
                        ? "bg-white border border-[#E2E8F0] text-[#4F46E5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                        : "bg-transparent border border-transparent text-[#64748B] hover:text-[#0F172A]"
                      }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    disabled={!isEditingLocation}
                    onClick={() => setOpenToRelocate("No")}
                    className={`flex-1 h-full rounded-[8px] text-[13px] font-semibold transition-all ${isEditingLocation ? "cursor-pointer" : "cursor-default"
                      } ${openToRelocate === "No"
                        ? "bg-white border border-[#E2E8F0] text-[#4F46E5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                        : "bg-transparent border border-transparent text-[#64748B] hover:text-[#0F172A]"
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
                <div
                  className={`min-h-[42px] p-1.5 px-3 rounded-[10px] border flex items-center justify-between gap-2 flex-wrap ${isEditingLocation
                      ? "border-indigo-400 bg-white ring-2 ring-indigo-500/10"
                      : "border-[#E2E8F0] bg-slate-50/50"
                    }`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {citizenship.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F1F5F9] text-[#334155] text-[12.5px] font-medium"
                      >
                        <span>{c}</span>
                        {isEditingLocation && (
                          <button
                            type="button"
                            onClick={() => removeCitizenship(c)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
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
                <div
                  className={`min-h-[42px] p-1.5 px-3 rounded-[10px] border flex items-center justify-between gap-2 flex-wrap ${isEditingLocation
                      ? "border-indigo-400 bg-white ring-2 ring-indigo-500/10"
                      : "border-[#E2E8F0] bg-slate-50/50"
                    }`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {targetCountries.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F1F5F9] text-[#334155] text-[12.5px] font-medium"
                      >
                        <span>{c}</span>
                        {isEditingLocation && (
                          <button
                            type="button"
                            onClick={() => removeCountry(c)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Save Button (Right side corner) */}
            {isEditingLocation && (
              <div className="flex justify-end mt-1 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                <button
                  type="button"
                  disabled={isSavingLocation}
                  onClick={handleSaveLocation}
                  className="px-6 h-[38px] rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold shadow-sm hover:shadow active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingLocation ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Bottom Row: Diversity & Inclusion + Work Preferences */}
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
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none appearance-none transition-all cursor-pointer focus:border-slate-400"
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
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none appearance-none transition-all cursor-pointer focus:border-slate-400"
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
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none appearance-none transition-all cursor-pointer focus:border-slate-400"
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
                        className="w-full h-[40px] px-3.5 pr-8 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium outline-none appearance-none transition-all cursor-pointer focus:border-slate-400"
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

            {/* 2. Work Preferences */}
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
                    onClick={() => setIsEditingWorkPrefs((prev) => !prev)}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>{isEditingWorkPrefs ? "Cancel" : "Edit"}</span>
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
                        disabled={!isEditingWorkPrefs}
                        onChange={(e) => setInPersonWork(e.target.value)}
                        className={`w-full h-[40px] px-3.5 pr-8 rounded-[10px] border text-[13px] text-[#0F172A] font-medium outline-none appearance-none transition-all ${isEditingWorkPrefs
                            ? "border-indigo-400 bg-white ring-2 ring-indigo-500/10 cursor-pointer"
                            : "border-[#E2E8F0] bg-slate-50/50 cursor-default"
                          }`}
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
                        disabled={!isEditingWorkPrefs}
                        onChange={(e) => setStartImmediately(e.target.value)}
                        className={`w-full h-[40px] px-3.5 pr-8 rounded-[10px] border text-[13px] text-[#0F172A] font-medium outline-none appearance-none transition-all ${isEditingWorkPrefs
                            ? "border-indigo-400 bg-white ring-2 ring-indigo-500/10 cursor-pointer"
                            : "border-[#E2E8F0] bg-slate-50/50 cursor-default"
                          }`}
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
                        disabled={!isEditingWorkPrefs}
                        onChange={(e) => setReliableTransportation(e.target.value)}
                        className={`w-full h-[40px] px-3.5 pr-8 rounded-[10px] border text-[13px] text-[#0F172A] font-medium outline-none appearance-none transition-all ${isEditingWorkPrefs
                            ? "border-indigo-400 bg-white ring-2 ring-indigo-500/10 cursor-pointer"
                            : "border-[#E2E8F0] bg-slate-50/50 cursor-default"
                          }`}
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
                        disabled={!isEditingWorkPrefs}
                        onChange={(e) => setWorkplaceAccommodations(e.target.value)}
                        className={`w-full h-[40px] px-3.5 pr-8 rounded-[10px] border text-[13px] text-[#0F172A] font-medium outline-none appearance-none transition-all ${isEditingWorkPrefs
                            ? "border-indigo-400 bg-white ring-2 ring-indigo-500/10 cursor-pointer"
                            : "border-[#E2E8F0] bg-slate-50/50 cursor-default"
                          }`}
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

                {/* Save Button (Right side corner) */}
                {isEditingWorkPrefs && (
                  <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                    <button
                      type="button"
                      disabled={isSavingWorkPrefs}
                      onClick={handleSaveWorkPrefs}
                      className="px-6 h-[38px] rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold shadow-sm hover:shadow active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingWorkPrefs ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-6 md:right-8 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_4px_20px_-2px_rgba(79,70,229,0.12)] ${toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA]"
              }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toast.type === "error" ? "bg-red-100 text-red-600" : "bg-[#E0E7FF] text-[#4F46E5]"
                }`}
            >
              {toast.type === "error" ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <p className="text-[13px] font-semibold text-[#4338CA] tracking-wide">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className={`ml-2 cursor-pointer transition-colors ${toast.type === "error" ? "text-slate-400 hover:text-slate-600" : "text-[#6366F1] hover:text-[#4338CA]"
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
