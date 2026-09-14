/**
 * URL Helper to construct reliable public web links for the User Portal
 * avoiding Google AI Studio parent frame domain mismatches (aistudio.google.com/404).
 */

const FALLBACK_APP_DEV_URL = 'https://ais-dev-gbtuv7c64iysiyr5e3awvh-211354663705.europe-west2.run.app';

let cachedServerBaseUrl: string | null = null;

// Pre-fetch server app info
if (typeof window !== 'undefined') {
  fetch('/api/app-info')
    .then(res => res.json())
    .then(data => {
      if (data?.baseUrl && !data.baseUrl.includes('aistudio.google.com') && !data.baseUrl.includes('google.com')) {
        cachedServerBaseUrl = data.baseUrl;
      } else if (data?.devUrl) {
        cachedServerBaseUrl = data.devUrl;
      }
    })
    .catch(() => {
      // Ignore network errors on init
    });
}

export function getStandaloneBaseUrl(): string {
  if (typeof window === 'undefined') {
    return FALLBACK_APP_DEV_URL;
  }

  // If we have a cached server base url that is not google internal frame
  if (cachedServerBaseUrl) {
    return cachedServerBaseUrl;
  }

  const origin = window.location.origin || '';
  const hostname = window.location.hostname || '';

  // If running inside Google AI Studio container iframe, DO NOT use aistudio.google.com!
  if (
    hostname.includes('aistudio.google.com') ||
    hostname.includes('google.com') ||
    origin.includes('aistudio.google.com') ||
    origin === 'null' ||
    !origin.startsWith('http')
  ) {
    return FALLBACK_APP_DEV_URL;
  }

  // If running directly on Cloud Run (e.g. *.run.app) or localhost
  return origin;
}

export interface StudentUrlOptions {
  bookId?: string;
  dept?: string;
  course?: string;
  action?: 'read' | 'buy' | 'view';
  refCode?: string;
  view?: string;
}

export function getStudentPortalUrl(options?: StudentUrlOptions): string {
  const baseUrl = getStandaloneBaseUrl();
  const url = new URL('/', baseUrl);

  // Set view parameter to 'user' for student portal
  url.searchParams.set('view', options?.view || 'user');

  if (options?.bookId) {
    url.searchParams.set('book', options.bookId);
  }
  if (options?.dept && options.dept !== 'ALL') {
    url.searchParams.set('dept', options.dept);
  }
  if (options?.course) {
    url.searchParams.set('course', options.course);
  }
  if (options?.action) {
    url.searchParams.set('action', options.action);
  }
  if (options?.refCode && options.refCode.trim()) {
    url.searchParams.set('ref', options.refCode.trim());
  }

  return url.toString();
}
