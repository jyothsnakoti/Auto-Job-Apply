import React, { useState, useEffect, useRef } from "react";
import { Phone, X, AlertCircle, ShieldCheck } from "lucide-react";
import {
  formatPhoneWithCountryCode,
  verifyPhoneOtpApi,
  resendPhoneOtpApi,
} from "../services/phoneVerificationService";

/**
 * PhoneOtpModal Component
 *
 * Implements the 6-digit phone number OTP verification popup modal
 * matching Reference Image 2.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {string} phoneNumber - The user's phone number
 * @param {function} onClose - Closes the modal
 * @param {function} onSuccess - Callback when OTP verification succeeds
 * @param {function} onChangePhoneNumber - Opens the phone number editing flow
 * @param {function} [onShowToast] - Optional toast trigger callback
 */
const PhoneOtpModal = ({
  isOpen,
  phoneNumber,
  onClose,
  onSuccess,
  onChangePhoneNumber,
  onShowToast,
}) => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [activeInput, setActiveInput] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  const formattedPhoneNumber = formatPhoneWithCountryCode(phoneNumber);

  // Initialize and auto-focus first input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setActiveInput(0);
      setSecondsLeft(30);
      setError("");
      setIsVerifying(false);
      setIsResending(false);

      const focusTimer = setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 50);

      return () => clearTimeout(focusTimer);
    }
  }, [isOpen]);

  // Handle countdown timer (starting from 30 seconds)
  useEffect(() => {
    if (!isOpen || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, secondsLeft]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Single digit change handler
  const handleDigitChange = (e, index) => {
    const val = e.target.value;

    if (!val) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    // Only allow numeric digits 0-9
    const digitsOnly = val.replace(/\D/g, "");
    if (!digitsOnly) return;

    const lastDigit = digitsOnly.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = lastDigit;
    setDigits(nextDigits);
    if (error) setError("");

    // Auto-advance focus to the next input box
    if (index < 5) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Keyboard navigation and backspace handling
  const handleKeyDown = (e, index) => {
    // Backspace handling
    if (e.key === "Backspace") {
      e.preventDefault();
      const nextDigits = [...digits];

      if (nextDigits[index]) {
        nextDigits[index] = "";
        setDigits(nextDigits);
      } else if (index > 0) {
        nextDigits[index - 1] = "";
        setDigits(nextDigits);
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    // Left and Right arrow keys navigation
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      setActiveInput(index - 1);
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
      return;
    }

    // Allow standard control shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, Tab)
    if (
      e.key === "Tab" ||
      e.key === "Delete" ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) {
      return;
    }

    // Block non-numeric characters
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Paste 6-digit OTP handling
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const numeric = pasted.replace(/\D/g, "").slice(0, 6);

    if (numeric.length > 0) {
      const nextDigits = ["", "", "", "", "", ""];
      for (let i = 0; i < numeric.length; i++) {
        nextDigits[i] = numeric[i];
      }
      setDigits(nextDigits);
      if (error) setError("");

      const nextFocus = Math.min(numeric.length, 5);
      setActiveInput(nextFocus);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  // Verify OTP submission
  const handleVerify = async () => {
    const otpCode = digits.join("");
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const result = await verifyPhoneOtpApi({
        phoneNumber,
        otp: otpCode,
      });

      if (result.success) {
        if (typeof onSuccess === "function") {
          onSuccess(phoneNumber);
        }
      }
    } catch (err) {
      setError(
        err?.message ||
          "Verification failed. Please check the code and try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP handler
  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;

    setIsResending(true);
    setError("");

    try {
      const result = await resendPhoneOtpApi(phoneNumber);
      setSecondsLeft(30);
      setDigits(["", "", "", "", "", ""]);
      setActiveInput(0);
      inputRefs.current[0]?.focus();

      if (typeof onShowToast === "function") {
        onShowToast(result.message || "A new OTP has been sent.", "info");
      }
    } catch (err) {
      setError(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Change phone number clicked
  const handleChangePhone = () => {
    onClose();
    if (typeof onChangePhoneNumber === "function") {
      onChangePhoneNumber();
    }
  };

  const timerFormatted = `00:${String(secondsLeft).padStart(2, "0")}`;
  const isCodeComplete = digits.every((d) => d && /^\d$/.test(d));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-otp-heading"
    >
      {/* Modal Card Container */}
      <div
        className="bg-white rounded-[24px] sm:rounded-[26px] border border-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.12)] w-full max-w-[420px] p-6 sm:p-7 flex flex-col animate-in zoom-in-95 duration-200 select-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Section */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-center gap-3.5">
            {/* Phone Icon in light purple rounded square */}
            <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] shrink-0">
              <Phone className="w-5 h-5 text-[#4F46E5]" />
            </div>

            {/* Title and Subtitle */}
            <div>
              <h2
                id="phone-otp-heading"
                className="text-[17px] sm:text-[18px] font-bold text-slate-900 tracking-tight leading-tight"
              >
                Enter verification code
              </h2>
              <p className="text-[13px] text-slate-500 font-normal mt-1 leading-snug">
                We sent a 6-digit OTP to{" "}
                <span className="font-semibold text-slate-800">
                  {formattedPhoneNumber}
                </span>
              </p>
            </div>
          </div>

          {/* Close (X) Icon Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="text-slate-400 hover:text-slate-600 p-1.5 -mr-1.5 -mt-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 OTP Input Boxes Section */}
        <div
          className="grid grid-cols-6 gap-2 sm:gap-2.5 mb-5"
          onPaste={handlePaste}
        >
          {digits.map((digit, index) => {
            const isFocused = activeInput === index;
            const hasError = !!error;

            return (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={() => setActiveInput(index)}
                aria-label={`OTP digit ${index + 1}`}
                className={`w-full h-14 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-150 outline-none select-text ${
                  hasError
                    ? "border-rose-300 ring-2 ring-rose-100 bg-white text-slate-900"
                    : isFocused
                    ? "border-2 border-[#4F46E5] ring-4 ring-[#4F46E5]/15 bg-white text-slate-900"
                    : digit
                    ? "border-slate-300 bg-white text-slate-900"
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                }`}
              />
            );
          })}
        </div>

        {/* Error Alert Display */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="flex-1 min-w-0 leading-relaxed">{error}</span>
          </div>
        )}

        {/* Resend Countdown Timer Section */}
        <div className="text-center text-[13px] sm:text-[13.5px] font-medium mb-6">
          {secondsLeft > 0 ? (
            <span className="text-slate-500">
              Resend OTP in{" "}
              <span className="font-bold text-[#4F46E5]">{timerFormatted}</span>
            </span>
          ) : (
            <span className="text-slate-500">
              Didn&apos;t receive code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline cursor-pointer disabled:opacity-50"
              >
                {isResending ? "Resending..." : "Resend OTP"}
              </button>
            </span>
          )}
        </div>

        {/* Verify & Continue Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying || !isCodeComplete}
          className="w-full h-12 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white text-[14px] sm:text-[14.5px] font-semibold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify & Continue</span>
          )}
        </button>

        {/* Change Phone Number Text Link */}
        <div className="text-center mt-3.5 mb-5">
          <button
            type="button"
            onClick={handleChangePhone}
            className="text-[13px] sm:text-[13.5px] text-[#4F46E5] hover:text-[#4338CA] font-medium hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Change phone number
          </button>
        </div>

        {/* Divider & Security Footer Notice */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-[12px] sm:text-[12.5px]">
          <div className="w-5 h-5 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
          </div>
          <span className="text-slate-500">
            Your number is only used for account verification.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PhoneOtpModal;

