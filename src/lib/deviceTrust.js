// Tracks which Clerk user IDs have completed email-code verification on this
// browser, so we only prompt for it once per device instead of every sign-in.
const STORAGE_KEY = 'riply_trusted_devices';

function readTrusted() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function isDeviceTrusted(userId) {
  if (!userId) return false;
  return Boolean(readTrusted()[userId]);
}

export function trustDevice(userId) {
  if (!userId) return;
  const trusted = readTrusted();
  trusted[userId] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trusted));
}
