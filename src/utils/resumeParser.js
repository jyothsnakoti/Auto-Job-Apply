/**
 * Intelligent frontend parser for plain text and markdown Enhanced Resumes.
 * Converts unstructured / semi-structured plain text into a rich, structured resume object.
 * NO static / hardcoded content is used — all information is parsed dynamically from the input string.
 */

// Common section header detection patterns
const SECTION_PATTERNS = [
  {
    key: 'summary',
    regex: /^(?:###?\s*)?(?:professional\s+|executive\s+|career\s+)?summary|profile|about\s+me|career\s+objective/i,
    title: 'Professional Summary',
  },
  {
    key: 'skills',
    regex: /^(?:###?\s*)?(?:technical\s+|core\s+|key\s+)?skills|technologies|technical\s+expertise|core\s+competencies|tech\s+stack/i,
    title: 'Technical Skills',
  },
  {
    key: 'experience',
    regex: /^(?:###?\s*)?(?:professional\s+|work\s+|employment\s+)?experience|work\s+history|employment\s+history|career\s+history/i,
    title: 'Professional Experience',
  },
  {
    key: 'projects',
    regex: /^(?:###?\s*)?(?:key\s+|featured\s+|academic\s+|personal\s+)?projects/i,
    title: 'Key Projects',
  },
  {
    key: 'education',
    regex: /^(?:###?\s*)?education(?:al\s+background)?|academic\s+background|qualifications|academic\s+credentials/i,
    title: 'Education',
  },
  {
    key: 'certifications',
    regex: /^(?:###?\s*)?certifications?|certificates?|licenses(?:\s+&\s+certifications)?|courses|trainings?/i,
    title: 'Certifications',
  },
  {
    key: 'achievements',
    regex: /^(?:###?\s*)?achievements?|awards?(?:\s+&\s+honors)?|honors/i,
    title: 'Achievements & Awards',
  },
  {
    key: 'languages',
    regex: /^(?:###?\s*)?languages?/i,
    title: 'Languages',
  },
  {
    key: 'publications',
    regex: /^(?:###?\s*)?publications?|research(?:\s+papers)?/i,
    title: 'Publications',
  },
  {
    key: 'volunteer',
    regex: /^(?:###?\s*)?volunteer(?:\s+experience)?|community\s+involvement/i,
    title: 'Volunteer Experience',
  },
  {
    key: 'interests',
    regex: /^(?:###?\s*)?interests?|hobbies/i,
    title: 'Interests',
  },
];

// Regex for common contact info patterns
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i;
const URL_REGEX = /(?:https?:\/\/)[^\s|]+/i;
const DATE_RANGE_REGEX = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\s*(?:–|-|to)\s*(?:present|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4})/i;

/**
 * Clean line by removing markdown symbols, bullets, or extra spacing
 * @param {string} line
 * @returns {string}
 */
const cleanLine = (line) => {
  if (!line) return '';
  return line
    .replace(/^[\s#*•–\->|:]+/, '')
    .replace(/[\s*#|]+$/, '')
    .trim();
};

/**
 * Check if a line is a section header
 * @param {string} line
 * @returns {{ key: string, title: string } | null}
 */
const matchSectionHeader = (line) => {
  const trimmed = line.replace(/^[#*\s_]+|[#*\s_:]+$/g, '').trim();
  if (!trimmed || trimmed.length > 50) return null;

  for (const pattern of SECTION_PATTERNS) {
    if (pattern.regex.test(trimmed)) {
      return { key: pattern.key, title: pattern.title, rawHeading: trimmed };
    }
  }

  // Check generic section heading like "SOME SECTION:" or "ALL CAPS HEADING"
  if (/^[A-Z\s&/]{3,35}:?$/.test(trimmed) && !trimmed.includes('.') && !EMAIL_REGEX.test(trimmed)) {
    return {
      key: 'other_' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      title: trimmed.replace(/:$/, ''),
      rawHeading: trimmed,
    };
  }

  return null;
};

/**
 * Parses contact information block into individual structured fields
 * @param {string[]} headerLines
 * @returns {Object} contact details
 */
const parseContactInfo = (headerLines) => {
  const contact = {
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    other: [],
  };

  const fullHeaderText = headerLines.join(' | ');

  // 1. Email
  const emailMatch = fullHeaderText.match(EMAIL_REGEX);
  if (emailMatch) {
    contact.email = emailMatch[0].trim();
  }

  // 2. LinkedIn
  const linkedinMatch = fullHeaderText.match(LINKEDIN_REGEX);
  if (linkedinMatch) {
    contact.linkedin = linkedinMatch[0].trim();
  }

  // 3. GitHub
  const githubMatch = fullHeaderText.match(GITHUB_REGEX);
  if (githubMatch) {
    contact.github = githubMatch[0].trim();
  }

  // 4. Phone
  const phoneMatch = fullHeaderText.match(PHONE_REGEX);
  if (phoneMatch && phoneMatch[0].length >= 8) {
    contact.phone = phoneMatch[0].trim();
  }

  // 5. Portfolio / General URL
  const urlMatches = fullHeaderText.match(new RegExp(URL_REGEX, 'g')) || [];
  for (const url of urlMatches) {
    if (!url.includes('linkedin.com') && !url.includes('github.com') && !contact.portfolio) {
      contact.portfolio = url.trim();
    }
  }

  // 6. Location & Remaining Elements
  for (const line of headerLines) {
    const parts = line.split(/[|•·,]+/).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      const isEmail = EMAIL_REGEX.test(part);
      const isPhone = PHONE_REGEX.test(part) && part.length >= 8;
      const isUrl = URL_REGEX.test(part) || part.includes('linkedin.com') || part.includes('github.com');

      if (!isEmail && !isPhone && !isUrl) {
        if (
          !contact.location &&
          (part.includes('India') ||
            part.includes('USA') ||
            part.includes('United States') ||
            part.includes('City') ||
            part.includes('TX') ||
            part.includes('CA') ||
            part.includes('NY') ||
            part.toLowerCase().includes('remote') ||
            /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(part))
        ) {
          contact.location = part;
        } else if (part.length > 2 && part.length < 60 && !contact.other.includes(part)) {
          contact.other.push(part);
        }
      }
    }
  }

  return contact;
};

/**
 * Parses the skills section into structured categories or pills
 * @param {string[]} lines
 * @returns {Array<{ category: string, items: string[] }>}
 */
const parseSkillsSection = (lines) => {
  const categories = [];
  const uncategorized = [];

  for (const line of lines) {
    const cleaned = cleanLine(line);
    if (!cleaned) continue;

    // Check if line is "Category: Skill1, Skill2, Skill3"
    const colonIdx = cleaned.indexOf(':');
    const dashIdx = cleaned.indexOf(' - ');

    if (colonIdx > 0 && colonIdx < 35) {
      const categoryName = cleaned.substring(0, colonIdx).trim();
      const itemsStr = cleaned.substring(colonIdx + 1).trim();
      const items = itemsStr
        .split(/[,•|·/]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (items.length > 0) {
        categories.push({
          category: categoryName,
          items,
        });
        continue;
      }
    } else if (dashIdx > 0 && dashIdx < 35) {
      const categoryName = cleaned.substring(0, dashIdx).trim();
      const itemsStr = cleaned.substring(dashIdx + 3).trim();
      const items = itemsStr
        .split(/[,•|·/]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (items.length > 0) {
        categories.push({
          category: categoryName,
          items,
        });
        continue;
      }
    }

    // Split items if comma-separated or standalone bullet
    const items = cleaned
      .split(/[,•|·]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    uncategorized.push(...items);
  }

  if (uncategorized.length > 0) {
    categories.push({
      category: categories.length === 0 ? 'Skills & Competencies' : 'Additional Skills',
      items: uncategorized,
    });
  }

  return categories;
};

/**
 * Parses professional experience section into structured job entries
 * @param {string[]} lines
 * @returns {Array<{ title: string, company: string, location: string, dates: string, bullets: string[] }>}
 */
const parseExperienceSection = (lines) => {
  const experiences = [];
  let currentJob = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    const cleaned = cleanLine(rawLine);
    if (!cleaned) continue;

    const isBullet =
      rawLine.startsWith('•') ||
      rawLine.startsWith('-') ||
      rawLine.startsWith('*') ||
      rawLine.startsWith('–') ||
      /^\d+\.\s/.test(rawLine);

    const hasDate = DATE_RANGE_REGEX.test(cleaned);
    const hasPipe = cleaned.includes('|');

    // Check if this line is likely a Job Header (Title / Company / Dates)
    if (!isBullet && (hasDate || hasPipe || (cleaned.length < 90 && (cleaned.includes(' at ') || cleaned.includes(' @ '))))) {
      if (currentJob) {
        experiences.push(currentJob);
      }

      let title = '';
      let company = '';
      let location = '';
      let dates = '';

      // Extract dates if present
      const dateMatch = cleaned.match(DATE_RANGE_REGEX);
      if (dateMatch) {
        dates = dateMatch[0].trim();
      }

      // Check pipe separators: "Title | Company | Location | Dates"
      if (hasPipe) {
        const parts = cleaned.split('|').map((p) => p.trim()).filter(Boolean);
        title = parts[0] || '';
        company = parts[1] || '';
        location = parts[2] && !DATE_RANGE_REGEX.test(parts[2]) ? parts[2] : '';
        if (!dates && parts[3] && DATE_RANGE_REGEX.test(parts[3])) {
          dates = parts[3];
        }
      } else if (cleaned.includes(' at ')) {
        const parts = cleaned.split(' at ');
        title = parts[0]?.trim() || '';
        company = parts[1]?.trim() || '';
      } else if (cleaned.includes(' @ ')) {
        const parts = cleaned.split(' @ ');
        title = parts[0]?.trim() || '';
        company = parts[1]?.trim() || '';
      } else {
        title = cleaned;
      }

      // Clean extracted dates from title/company
      if (dates) {
        title = title.replace(dates, '').replace(/[-–|,\s]+$/, '').trim();
        company = company.replace(dates, '').replace(/[-–|,\s]+$/, '').trim();
      }

      currentJob = {
        title: title || 'Professional Role',
        company: company || '',
        location: location || '',
        dates: dates || '',
        bullets: [],
      };
      continue;
    }

    // If current line is a date line following a title line
    if (currentJob && hasDate && !isBullet && !currentJob.dates) {
      currentJob.dates = cleaned;
      continue;
    }

    // It's a responsibility / achievement bullet point
    if (currentJob) {
      currentJob.bullets.push(cleaned);
    } else {
      // Create initial job if bullets appear before explicit header
      currentJob = {
        title: cleaned.length < 80 ? cleaned : 'Professional Experience',
        company: '',
        location: '',
        dates: '',
        bullets: [],
      };
    }
  }

  if (currentJob) {
    experiences.push(currentJob);
  }

  return experiences;
};

/**
 * Parses projects section into structured entries
 * @param {string[]} lines
 * @returns {Array<{ title: string, subtitle: string, dates: string, bullets: string[] }>}
 */
const parseProjectsSection = (lines) => {
  const projects = [];
  let currentProject = null;

  for (const line of lines) {
    const rawLine = line.trim();
    const cleaned = cleanLine(rawLine);
    if (!cleaned) continue;

    const isBullet =
      rawLine.startsWith('•') ||
      rawLine.startsWith('-') ||
      rawLine.startsWith('*') ||
      rawLine.startsWith('–') ||
      /^\d+\.\s/.test(rawLine);

    const hasPipe = cleaned.includes('|');
    const hasColon = cleaned.indexOf(':') > 0 && cleaned.indexOf(':') < 40;

    if (!isBullet && (hasPipe || hasColon || cleaned.length < 70)) {
      if (currentProject) {
        projects.push(currentProject);
      }

      let title = cleaned;
      let subtitle = '';
      let dates = '';

      const dateMatch = cleaned.match(DATE_RANGE_REGEX);
      if (dateMatch) {
        dates = dateMatch[0].trim();
      }

      if (hasPipe) {
        const parts = cleaned.split('|').map((p) => p.trim());
        title = parts[0];
        subtitle = parts.slice(1).join(' | ');
      } else if (hasColon) {
        const colonIdx = cleaned.indexOf(':');
        title = cleaned.substring(0, colonIdx).trim();
        subtitle = cleaned.substring(colonIdx + 1).trim();
      }

      currentProject = {
        title,
        subtitle,
        dates,
        bullets: [],
      };
      continue;
    }

    if (currentProject) {
      currentProject.bullets.push(cleaned);
    } else {
      currentProject = {
        title: 'Project',
        subtitle: '',
        dates: '',
        bullets: [cleaned],
      };
    }
  }

  if (currentProject) {
    projects.push(currentProject);
  }

  return projects;
};

/**
 * Parses education section into structured academic entries
 * @param {string[]} lines
 * @returns {Array<{ degree: string, institution: string, location: string, dates: string, gpa: string, details: string[] }>}
 */
const parseEducationSection = (lines) => {
  const educationList = [];
  let currentEdu = null;

  for (const line of lines) {
    const cleaned = cleanLine(line);
    if (!cleaned) continue;

    const isBullet =
      line.trim().startsWith('•') ||
      line.trim().startsWith('-') ||
      line.trim().startsWith('*');

    const hasPipe = cleaned.includes('|');
    const dateMatch = cleaned.match(DATE_RANGE_REGEX) || cleaned.match(/\b(19\d\d|20\d\d)\b/);

    if (!isBullet && (hasPipe || cleaned.toLowerCase().includes('bachelor') || cleaned.toLowerCase().includes('master') || cleaned.toLowerCase().includes('b.tech') || cleaned.toLowerCase().includes('m.tech') || cleaned.toLowerCase().includes('degree') || cleaned.toLowerCase().includes('university') || cleaned.toLowerCase().includes('college') || cleaned.toLowerCase().includes('institute'))) {
      if (currentEdu) {
        educationList.push(currentEdu);
      }

      let degree = '';
      let institution = '';
      let location = '';
      let dates = dateMatch ? dateMatch[0].trim() : '';
      let gpa = '';

      if (hasPipe) {
        const parts = cleaned.split('|').map((p) => p.trim());
        degree = parts[0] || '';
        institution = parts[1] || '';
        for (let j = 2; j < parts.length; j++) {
          if (parts[j].toLowerCase().includes('gpa') || parts[j].toLowerCase().includes('cgpa') || parts[j].includes('%')) {
            gpa = parts[j];
          } else if (DATE_RANGE_REGEX.test(parts[j])) {
            dates = parts[j];
          } else {
            location = parts[j];
          }
        }
      } else {
        degree = cleaned;
      }

      currentEdu = {
        degree: degree || 'Degree',
        institution,
        location,
        dates,
        gpa,
        details: [],
      };
      continue;
    }

    if (currentEdu) {
      if (cleaned.toLowerCase().includes('gpa') || cleaned.toLowerCase().includes('cgpa')) {
        currentEdu.gpa = cleaned;
      } else {
        currentEdu.details.push(cleaned);
      }
    } else {
      currentEdu = {
        degree: cleaned,
        institution: '',
        location: '',
        dates: '',
        gpa: '',
        details: [],
      };
    }
  }

  if (currentEdu) {
    educationList.push(currentEdu);
  }

  return educationList;
};

/**
 * Main parser entry point.
 * Parses raw enhancedResume string into a rich, structured object for professional resume rendering.
 *
 * @param {string} rawText - Plain-text or markdown enhanced resume string from backend API
 * @returns {Object} Structured resume data
 */
export const parseEnhancedResume = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return {
      rawText: '',
      hasContent: false,
      name: '',
      title: '',
      contact: {},
      summary: '',
      skills: [],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      otherSections: [],
    };
  }

  // Normalize line endings
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const headerLines = [];
  const rawSections = [];
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const headerMatch = matchSectionHeader(rawLine);

    if (headerMatch) {
      if (currentSection) {
        rawSections.push(currentSection);
      }
      currentSection = {
        key: headerMatch.key,
        title: headerMatch.title,
        rawHeading: headerMatch.rawHeading,
        lines: [],
      };
    } else if (currentSection) {
      currentSection.lines.push(rawLine);
    } else {
      if (rawLine.trim()) {
        headerLines.push(rawLine.trim());
      }
    }
  }

  if (currentSection) {
    rawSections.push(currentSection);
  }

  // Extract Name & Title from pre-section header lines
  let name = '';
  let title = '';
  const remainingHeaderLines = [];

  if (headerLines.length > 0) {
    // 1st non-empty line without email/phone/links is candidate name
    const candidateNameLine = headerLines.find(
      (l) => !EMAIL_REGEX.test(l) && !PHONE_REGEX.test(l) && !URL_REGEX.test(l) && l.length < 50
    );

    if (candidateNameLine) {
      name = cleanLine(candidateNameLine);
    }

    // 2nd line or line containing keywords like Developer, Engineer, Manager, etc.
    const titleLine = headerLines.find(
      (l) =>
        l !== candidateNameLine &&
        !EMAIL_REGEX.test(l) &&
        !PHONE_REGEX.test(l) &&
        !URL_REGEX.test(l) &&
        l.length < 80
    );

    if (titleLine) {
      title = cleanLine(titleLine);
    }

    for (const line of headerLines) {
      if (line !== candidateNameLine && line !== titleLine) {
        remainingHeaderLines.push(line);
      }
    }
  }

  // Extract Contact Details
  const contact = parseContactInfo(headerLines);

  // Parse Specific Identified Sections
  let summary = '';
  let skills = [];
  let experience = [];
  let projects = [];
  let education = [];
  let certifications = [];
  const otherSections = [];

  for (const sec of rawSections) {
    switch (sec.key) {
      case 'summary':
        summary = sec.lines.map(cleanLine).filter(Boolean).join(' ');
        break;

      case 'skills':
        skills = parseSkillsSection(sec.lines);
        break;

      case 'experience':
        experience = parseExperienceSection(sec.lines);
        break;

      case 'projects':
        projects = parseProjectsSection(sec.lines);
        break;

      case 'education':
        education = parseEducationSection(sec.lines);
        break;

      case 'certifications':
        certifications = sec.lines.map(cleanLine).filter(Boolean);
        break;

      case 'achievements':
      case 'languages':
      case 'publications':
      case 'volunteer':
      case 'interests':
      default: {
        const items = sec.lines.map(cleanLine).filter(Boolean);
        if (items.length > 0) {
          otherSections.push({
            key: sec.key,
            title: sec.title || sec.rawHeading,
            items,
          });
        }
        break;
      }
    }
  }

  return {
    rawText,
    hasContent: true,
    name,
    title,
    contact,
    summary,
    skills,
    experience,
    projects,
    education,
    certifications,
    otherSections,
  };
};

export default parseEnhancedResume;
