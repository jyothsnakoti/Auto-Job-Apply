import { apiClient, fetchWithAuth } from './authService';
import { ENHANCE_RESUME_ENDPOINTS, API_BASE_URL } from './endpoints';

/**
 * Download Enhanced Resume File
 * GET /api/jobs/{jobId}/enhance/download
 *
 * @param {string|number} jobId - The job ID for which the resume was enhanced
 * @param {string} [fallbackFilename] - Optional fallback filename (e.g. 'Enhanced_Resume.docx')
 * @returns {Promise<Blob>} The downloaded file Blob
 */
export const downloadEnhancedResume = async (
  jobId,
  fallbackFilename = 'Enhanced_Resume.docx'
) => {
  if (!jobId && jobId !== 0) {
    throw new Error('Job ID is required to download the enhanced resume.');
  }

  const endpoint =
    ENHANCE_RESUME_ENDPOINTS?.DOWNLOAD_ENHANCED?.(jobId) ||
    `${API_BASE_URL}/api/jobs/${jobId}/enhance/download`;

  console.log(`[enhancedResumeDownloadService] Downloading enhanced resume from: ${endpoint}`);

  try {
    const response = await apiClient.get(endpoint, {
      responseType: 'blob',
    });

    const blob = response.data;
    let filename = fallbackFilename;

    const disposition =
      response.headers?.['content-disposition'] ||
      response.headers?.['Content-Disposition'];

    if (disposition) {
      const filenameMatch = disposition.match(
        /filename\*?=(?:UTF-8'')?["']?([^"';\n\r]+)["']?/i
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1].trim());
      }
    }

    if (typeof window !== 'undefined' && window.document) {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }

    return blob;
  } catch (error) {
    console.warn(
      '[enhancedResumeDownloadService] apiClient failed, attempting fetchWithAuth fallback:',
      error
    );

    const res = await fetchWithAuth(endpoint, {
      method: 'GET',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let errMsg = `Failed to download enhanced resume (Status: ${res.status})`;
      try {
        const json = JSON.parse(text);
        errMsg = json?.message || json?.detail || json?.error || errMsg;
      } catch {
        if (text) errMsg = text;
      }
      const err = new Error(errMsg);
      err.status = res.status;
      throw err;
    }

    const blob = await res.blob();
    let filename = fallbackFilename;

    const disposition =
      res.headers.get('content-disposition') ||
      res.headers.get('Content-Disposition');

    if (disposition) {
      const filenameMatch = disposition.match(
        /filename\*?=(?:UTF-8'')?["']?([^"';\n\r]+)["']?/i
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1].trim());
      }
    }

    if (typeof window !== 'undefined' && window.document) {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }

    return blob;
  }
};

export default downloadEnhancedResume;
