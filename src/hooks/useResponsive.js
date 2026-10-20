import { useSyncExternalStore } from "react";

/** Live media-query match (re-evaluates on resize/rotation). */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (listener) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** Desktop shell (sidebar) from 1024px; below that the bottom navigation is used. */
export default function useResponsive() {
  return !useMediaQuery("(min-width: 1024px)");
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
