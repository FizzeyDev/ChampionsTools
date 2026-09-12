const STORAGE_KEY = "champcalc.notes";

export function getNotes(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveNotes(text: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, text);
  } catch {
    // storage full or unavailable — silently ignore
  }
}