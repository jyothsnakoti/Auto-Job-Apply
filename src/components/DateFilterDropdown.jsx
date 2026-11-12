import { JOB_DATE_OPTIONS } from "../utils/jobHelpers";

export const FilterCheckboxOption = ({
  label,
  isChecked,
  onClick,
  truncateLabel = false,
}) => (
  <button
    type="button"
    role="menuitemcheckbox"
    aria-checked={isChecked}
    onClick={onClick}
    className={`w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] cursor-pointer text-[13px] transition-colors ${
      isChecked
        ? "bg-[#EEF2FF]/70 text-[#0F172A] font-medium hover:bg-[#EEF2FF]"
        : "text-slate-700 hover:bg-slate-50"
    }`}
  >
    <span
      aria-hidden="true"
      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
        isChecked
          ? "bg-[#4F46E5] border-[#4F46E5] text-white"
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
    </span>
    <span className={truncateLabel ? "truncate" : ""}>{label}</span>
  </button>
);

const DateFilterDropdown = ({
  isOpen,
  onToggle,
  selectedDate = "All time",
  onSelectDate,
  options = JOB_DATE_OPTIONS,
}) => {
  const hasSelection =
    Boolean(selectedDate) && selectedDate !== "All time" && selectedDate !== "All";
  const isActive = Boolean(isOpen || hasSelection);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`h-[34px] px-3.5 rounded-[10px] border text-[13px] font-normal flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
          isActive
            ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] font-semibold"
            : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
        }`}
      >
        <span>{hasSelection ? `Date: ${selectedDate}` : "Date"}</span>
        <svg
          className={`w-3 h-3 transition-transform ${
            hasSelection ? "text-[#4F46E5]" : "text-[#94A3B8]"
          } ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[190px] max-w-[calc(100vw-3rem)] bg-white rounded-[14px] border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2.5 z-50 flex flex-col gap-1 max-h-[260px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = selectedDate === opt;
            return (
              <FilterCheckboxOption
                key={opt}
                label={opt}
                isChecked={isSelected}
                onClick={() =>
                  onSelectDate(isSelected && opt !== "All time" ? "All time" : opt)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DateFilterDropdown;

