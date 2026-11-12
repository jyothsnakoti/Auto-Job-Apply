import DateFilterDropdown, { FilterCheckboxOption } from "./DateFilterDropdown";
import { JOB_SORT_OPTIONS } from "../utils/jobHelpers";

const JobFilterBar = ({
  dropdownRef,
  searchQuery,
  onSearchChange,
  onSearchEnter,
  onClear,
  extraSearchAction = null,
  activeDropdown,
  onToggleDropdown,
  selectedDate,
  onSelectDate,
  selectedLocations,
  locationSearch,
  onLocationSearchChange,
  locationOptions = [],
  onToggleLocation,
  selectedRoles,
  roleOptions = [],
  onToggleRole,
  selectedWorkplace,
  workplaceOptions = [],
  onToggleWorkplace,
  selectedCompanies,
  companySearch,
  onCompanySearchChange,
  companyOptions = [],
  onToggleCompany,
  sortOption = "best_match",
  onSelectSort,
  showSort = true,
}) => {
  const filteredLocationOptions = locationOptions.filter((loc) =>
    loc.toLowerCase().includes((locationSearch || "").toLowerCase())
  );

  const filteredCompanyOptions = companyOptions.filter((comp) =>
    comp.toLowerCase().includes((companySearch || "").toLowerCase())
  );

  const activeSortLabel =
    JOB_SORT_OPTIONS.find((opt) => opt.value === sortOption)?.label ||
    "Best ATS Match";

  return (
    <div
      ref={dropdownRef}
      className="bg-white rounded-[20px] border border-[#E2E8F0] p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3.5 relative z-20"
    >
      {/* First Row: Search Input + Clear (+ optional Apply action for Bulk Apply) */}
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
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && onSearchEnter) {
                onSearchEnter();
              }
            }}
            placeholder="Search by title, keyword, company or skills..."
            className="w-full bg-transparent border-none text-[13.5px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onClear}
          className="h-[42px] px-3 flex items-center gap-1 text-[13.5px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <span className="text-base leading-none">✕</span>
          <span>Clear</span>
        </button>

        {extraSearchAction}
      </div>

      {/* Second Row: Filter Buttons & Sorting */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5 relative">
        {/* Date Dropdown */}
        <DateFilterDropdown
          isOpen={activeDropdown === "date"}
          onToggle={() => onToggleDropdown("date")}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />

        {/* Location Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => onToggleDropdown("location")}
            className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeDropdown === "location" || selectedLocations.length > 0
                ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
            }`}
          >
            <span>
              {selectedLocations.length > 0
                ? `Location (${selectedLocations.length})`
                : "Location"}
            </span>
            <svg
              className={`w-3 h-3 transition-transform ${
                selectedLocations.length > 0 ? "text-[#4F46E5]" : "text-[#94A3B8]"
              } ${activeDropdown === "location" ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {activeDropdown === "location" && (
            <div className="absolute top-full left-0 mt-2 w-[240px] max-w-[calc(100vw-3rem)] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border border-slate-200 bg-white focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#EEF2FF] transition-all">
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
                  onChange={(e) => onLocationSearchChange(e.target.value)}
                  className="w-full text-[12px] bg-transparent outline-none placeholder:text-slate-400 text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
                {locationOptions.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2.5 py-1.5">
                    No locations available yet
                  </div>
                ) : filteredLocationOptions.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2.5 py-1.5">
                    No matching locations
                  </div>
                ) : (
                  filteredLocationOptions.map((loc) => (
                    <FilterCheckboxOption
                      key={loc}
                      label={loc}
                      isChecked={selectedLocations.includes(loc)}
                      onClick={() => onToggleLocation(loc)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => onToggleDropdown("role")}
            className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeDropdown === "role" || selectedRoles.length > 0
                ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
            }`}
          >
            <span>
              {selectedRoles.length > 0 ? `Role (${selectedRoles.length})` : "Role"}
            </span>
            <svg
              className={`w-3 h-3 transition-transform ${
                selectedRoles.length > 0 ? "text-[#4F46E5]" : "text-[#94A3B8]"
              } ${activeDropdown === "role" ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {activeDropdown === "role" && (
            <div className="absolute top-full left-0 mt-2 w-[220px] max-w-[calc(100vw-3rem)] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1 max-h-[220px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              {roleOptions.length === 0 ? (
                <div className="text-xs text-slate-400 px-2.5 py-1.5">
                  No roles available yet
                </div>
              ) : (
                roleOptions.map((role) => (
                  <FilterCheckboxOption
                    key={role}
                    label={role}
                    isChecked={selectedRoles.includes(role)}
                    onClick={() => onToggleRole(role)}
                    truncateLabel
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Workplace Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => onToggleDropdown("workplace")}
            className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeDropdown === "workplace" || selectedWorkplace.length > 0
                ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
            }`}
          >
            <span>
              {selectedWorkplace.length > 0
                ? `Workplace (${selectedWorkplace.length})`
                : "Workplace"}
            </span>
            <svg
              className={`w-3 h-3 transition-transform ${
                selectedWorkplace.length > 0 ? "text-[#4F46E5]" : "text-[#94A3B8]"
              } ${activeDropdown === "workplace" ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {activeDropdown === "workplace" && (
            <div className="absolute top-full left-0 mt-2 w-[190px] max-w-[calc(100vw-3rem)] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1 max-h-[220px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              {workplaceOptions.length === 0 ? (
                <div className="text-xs text-slate-400 px-2.5 py-1.5">
                  No workplace options available yet
                </div>
              ) : (
                workplaceOptions.map((wp) => (
                  <FilterCheckboxOption
                    key={wp}
                    label={wp}
                    isChecked={selectedWorkplace.includes(wp)}
                    onClick={() => onToggleWorkplace(wp)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Companies Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => onToggleDropdown("companies")}
            className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeDropdown === "companies" || selectedCompanies.length > 0
                ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
            }`}
          >
            <span>
              {selectedCompanies.length > 0
                ? `Companies (${selectedCompanies.length})`
                : "Companies"}
            </span>
            <svg
              className={`w-3 h-3 transition-transform ${
                selectedCompanies.length > 0 ? "text-[#4F46E5]" : "text-[#94A3B8]"
              } ${activeDropdown === "companies" ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {activeDropdown === "companies" && (
            <div className="absolute top-full left-0 mt-2 w-[240px] max-w-[calc(100vw-3rem)] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border border-slate-200 bg-white focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#EEF2FF] transition-all">
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
                  onChange={(e) => onCompanySearchChange(e.target.value)}
                  className="w-full text-[12px] bg-transparent outline-none placeholder:text-slate-400 text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
                {companyOptions.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2.5 py-1.5">
                    No companies available yet
                  </div>
                ) : filteredCompanyOptions.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2.5 py-1.5">
                    No matching companies
                  </div>
                ) : (
                  filteredCompanyOptions.map((comp) => (
                    <FilterCheckboxOption
                      key={comp}
                      label={comp}
                      isChecked={selectedCompanies.includes(comp)}
                      onClick={() => onToggleCompany(comp)}
                      truncateLabel
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort Dropdown (Right Aligned) */}
        {showSort && (
          <div className="relative sm:ml-auto flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <button
                type="button"
                onClick={() => onToggleDropdown("sort")}
                className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeDropdown === "sort" || sortOption !== "best_match"
                    ? "border-slate-300 bg-[#F8FAFC] text-[#0F172A]"
                    : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="text-[#64748B]">Sort:</span>
                <span className="font-semibold text-[#0F172A]">
                  {activeSortLabel}
                </span>
                <svg
                  className={`w-3 h-3 text-[#94A3B8] transition-transform ${
                    activeDropdown === "sort" ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {activeDropdown === "sort" && (
                <div className="absolute top-full right-0 mt-2 w-[190px] max-w-[calc(100vw-3rem)] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {JOB_SORT_OPTIONS.map((opt) => {
                    const isActive = sortOption === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => onSelectSort(opt.value)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-[6px] hover:bg-slate-50 cursor-pointer text-[13px] ${
                          isActive
                            ? "font-semibold text-[#0F172A] bg-slate-50"
                            : "text-slate-700"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isActive && (
                          <span className="text-[#4F46E5] text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFilterBar;

