/** localStorage key — bump suffix when onboarding content changes materially. */
export const ONBOARDING_DISMISSED_KEY = "prob-desk-get-started-v1";

export const ONBOARDING_SHOW_EVENT = "prob-desk-show-onboarding";

export function isOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissOnboarding(): void {
  try {
    window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

export function clearOnboardingDismissed(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

export function requestShowOnboarding(): void {
  clearOnboardingDismissed();
  window.dispatchEvent(new CustomEvent(ONBOARDING_SHOW_EVENT));
}
