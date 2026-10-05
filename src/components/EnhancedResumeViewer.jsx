import React, { useMemo } from 'react';
import { parseEnhancedResume } from '../utils/resumeParser';

/**
 * EnhancedResumeViewer
 * Dynamically formats and renders raw enhancedResume text into a structured, professional resume layout.
 *
 * @param {Object} props
 * @param {string} props.resumeText - Raw plain text / markdown from GET /api/jobs/{jobId}/enhance
 * @param {boolean} [props.compact=false] - When true, renders a compact layout suitable for sidebar previews
 * @param {string} [props.className=""] - Additional class names
 */
const EnhancedResumeViewer = ({ resumeText, compact = false, className = '' }) => {
  const parsed = useMemo(() => {
    return parseEnhancedResume(resumeText || '');
  }, [resumeText]);

  if (!resumeText || !parsed.hasContent) {
    return (
      <div className={`text-slate-400 text-xs italic p-4 text-center ${className}`}>
        No enhanced resume text content available.
      </div>
    );
  }

  // Check if at least some structured fields were parsed
  const hasStructuredFields =
    parsed.name ||
    parsed.title ||
    parsed.summary ||
    (parsed.skills && parsed.skills.length > 0) ||
    (parsed.experience && parsed.experience.length > 0) ||
    (parsed.education && parsed.education.length > 0) ||
    (parsed.projects && parsed.projects.length > 0) ||
    (parsed.certifications && parsed.certifications.length > 0);

  // Fallback if parsing didn't find any structured sections
  if (!hasStructuredFields) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed select-text ${className}`}>
        {resumeText}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-xl border border-[#C7D2FE]/70 p-3.5 space-y-3.5 text-xs text-slate-800 shadow-2xs select-text ${className}`}>
        {/* Compact Header */}
        {(parsed.name || parsed.title) && (
          <div className="border-b border-slate-100 pb-2.5">
            {parsed.name && (
              <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
                {parsed.name}
              </h3>
            )}
            {parsed.title && (
              <p className="text-[11.5px] font-medium text-[#4F46E5] mt-0.5">
                {parsed.title}
              </p>
            )}
            {/* Contact Pills */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-[10.5px] text-slate-500">
              {parsed.contact?.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {parsed.contact.location}
                </span>
              )}
              {parsed.contact?.email && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {parsed.contact.email}
                </span>
              )}
              {parsed.contact?.phone && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {parsed.contact.phone}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Compact Summary */}
        {parsed.summary && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Professional Summary
            </span>
            <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-3">
              {parsed.summary}
            </p>
          </div>
        )}

        {/* Compact Skills */}
        {parsed.skills && parsed.skills.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Key Skills & Technologies
            </span>
            <div className="space-y-1.5">
              {parsed.skills.slice(0, 3).map((group, idx) => (
                <div key={idx} className="text-[11px]">
                  <span className="font-semibold text-slate-800 mr-1.5">
                    {group.category}:
                  </span>
                  <span className="text-slate-600">
                    {group.items.slice(0, 6).join(', ')}
                    {group.items.length > 6 ? ` +${group.items.length - 6} more` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact Experience Preview */}
        {parsed.experience && parsed.experience.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Experience Highlights
            </span>
            <div className="space-y-2">
              {parsed.experience.slice(0, 2).map((exp, idx) => (
                <div key={idx} className="border-l-2 border-[#4F46E5]/40 pl-2.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{exp.title}</span>
                    {exp.dates && (
                      <span className="text-[9.5px] text-slate-500 font-medium">{exp.dates}</span>
                    )}
                  </div>
                  {exp.company && (
                    <div className="text-[10.5px] text-[#4F46E5] font-medium">{exp.company}</div>
                  )}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <p className="text-[10.5px] text-slate-600 line-clamp-1">
                      • {exp.bullets[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Professional Resume View (for Modal)
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs p-7 space-y-6 text-slate-800 font-sans select-text ${className}`}>
      {/* 1. Header (Name, Title, Contact Info) */}
      <div className="border-b border-slate-200 pb-5 space-y-2.5">
        {parsed.name && (
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {parsed.name}
          </h2>
        )}

        {parsed.title && (
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-semibold text-[#4F46E5]">
              {parsed.title}
            </p>
          </div>
        )}

        {/* Contact Links & Information */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[12px] text-slate-600">
          {parsed.contact?.location && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{parsed.contact.location}</span>
            </div>
          )}

          {parsed.contact?.email && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${parsed.contact.email}`} className="text-[#4F46E5] hover:underline font-medium">
                {parsed.contact.email}
              </a>
            </div>
          )}

          {parsed.contact?.phone && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{parsed.contact.phone}</span>
            </div>
          )}

          {parsed.contact?.linkedin && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <svg className="w-3.5 h-3.5 text-[#0A66C2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span className="text-slate-700 font-medium">LinkedIn</span>
            </div>
          )}

          {parsed.contact?.github && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <svg className="w-3.5 h-3.5 text-slate-800 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span className="text-slate-700 font-medium">GitHub</span>
            </div>
          )}

          {parsed.contact?.portfolio && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <svg className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="text-slate-700 font-medium">Portfolio</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Professional Summary */}
      {parsed.summary && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#4F46E5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Professional Summary
            </h3>
          </div>
          <p className="text-[13px] text-slate-700 leading-relaxed font-normal bg-slate-50/70 rounded-xl p-4 border border-slate-100">
            {parsed.summary}
          </p>
        </div>
      )}

      {/* 3. Technical Skills */}
      {parsed.skills && parsed.skills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#4F46E5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Technical Skills & Competencies
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {parsed.skills.map((group, idx) => (
              <div
                key={idx}
                className="bg-slate-50/60 rounded-xl p-3.5 border border-slate-100 space-y-2"
              >
                <h4 className="text-[11.5px] font-bold text-[#312E81] uppercase tracking-wide">
                  {group.category}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item, itemIdx) => (
                    <span
                      key={itemIdx}
                      className="bg-white text-slate-800 text-[11px] font-medium px-2.5 py-1 rounded-md border border-slate-200 shadow-3xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Professional Experience */}
      {parsed.experience && parsed.experience.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#4F46E5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Professional Experience
            </h3>
          </div>
          <div className="space-y-4">
            {parsed.experience.map((exp, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200/90 p-4.5 space-y-2.5 shadow-2xs hover:border-[#C7D2FE] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0F172A]">
                      {exp.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[12.5px] text-[#4F46E5] font-semibold mt-0.5">
                      <span>{exp.company}</span>
                      {exp.location && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-normal">{exp.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {exp.dates && (
                    <span className="self-start sm:self-auto bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {exp.dates}
                    </span>
                  )}
                </div>

                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="space-y-1.5 pl-1 text-[12.5px] text-slate-700">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] shrink-0 mt-2" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Key Projects */}
      {parsed.projects && parsed.projects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#4F46E5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Key Projects
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {parsed.projects.map((proj, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 rounded-xl border border-slate-100 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[13.5px] font-bold text-slate-900">
                    {proj.title}
                  </h4>
                  {proj.dates && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      {proj.dates}
                    </span>
                  )}
                </div>
                {proj.subtitle && (
                  <p className="text-[11.5px] text-[#4F46E5] font-semibold">
                    {proj.subtitle}
                  </p>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="space-y-1 text-[12px] text-slate-700 pl-1">
                    {proj.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] shrink-0 mt-1.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Education */}
      {parsed.education && parsed.education.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#4F46E5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Education
            </h3>
          </div>
          <div className="space-y-2.5">
            {parsed.education.map((edu, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs"
              >
                <div>
                  <h4 className="text-[13px] font-bold text-[#0F172A]">
                    {edu.degree}
                  </h4>
                  <div className="flex items-center gap-2 text-[12px] text-slate-600 mt-0.5">
                    {edu.institution && <span className="font-semibold text-slate-800">{edu.institution}</span>}
                    {edu.location && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{edu.location}</span>
                      </>
                    )}
                  </div>
                  {edu.details && edu.details.length > 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {edu.details.join(' • ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {edu.gpa && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {edu.gpa}
                    </span>
                  )}
                  {edu.dates && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      {edu.dates}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Certifications */}
      {parsed.certifications && parsed.certifications.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#4F46E5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Certifications & Credentials
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {parsed.certifications.map((cert, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 bg-slate-50/70 border border-slate-100 rounded-lg p-2.5 text-[12px] text-slate-800 font-medium"
              >
                <span className="w-4 h-4 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">
                  ✓
                </span>
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Other Dynamically Discovered Sections */}
      {parsed.otherSections && parsed.otherSections.length > 0 && (
        <div className="space-y-4">
          {parsed.otherSections.map((sec, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-[#4F46E5]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  {sec.title}
                </h3>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 space-y-1.5">
                {sec.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="text-[12px] text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedResumeViewer;
