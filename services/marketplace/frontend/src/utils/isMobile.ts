/**
 * Detect if the user is on a mobile device.
 * Uses user agent and screen width for reliable detection across browsers.
 */

/** Regex for mobile user agent patterns. */
const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi|Mobile/i;

/**
 * Check if the current device appears to be mobile.
 * Considers user agent and viewport width (e.g. narrow browser on desktop).
 */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  const uaMobile = MOBILE_UA.test(ua);
  const narrowViewport = window.innerWidth < 768;
  return uaMobile || narrowViewport;
}
