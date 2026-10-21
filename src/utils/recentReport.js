const storageKey = "mkc.latestTrackingCode";

export function getRecentTrackingCode() {
  try {
    const code = localStorage.getItem(storageKey) || "";
    return /^MKC-\d{4}-[A-Z0-9]+$/.test(code) ? code : "";
  } catch {
    return "";
  }
}

export function rememberTrackingCode(code) {
  try {
    localStorage.setItem(storageKey, code);
  } catch {
    // Tracking remains available on screen when browser storage is disabled.
  }
}

export function clearRecentTrackingCode() {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // The current page can still dismiss the remembered code.
  }
}
