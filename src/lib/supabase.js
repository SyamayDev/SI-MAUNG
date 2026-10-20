import { createClient } from "@supabase/supabase-js";

// Public client configuration (bundled into the browser by design).
// Data access is protected by Row Level Security, not by hiding this key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

// The auth client consumes and clears the URL hash on start-up; keep the
// original so pages can still explain an expired/invalid email link.
export const initialUrlHash = typeof window !== "undefined" ? window.location.hash : "";

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/** Absolute URL of an app route, respecting the deployment base path (/SI-MAUNG/). */
export function appUrl(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  return `${window.location.origin}${base}${path.replace(/^\//, "")}`;
}
