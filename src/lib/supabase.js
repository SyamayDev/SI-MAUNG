// Public client configuration (bundled into the browser by design).
// Data access is protected by Row Level Security, not by hiding this key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

// The auth client consumes and clears the URL hash on start-up; keep the
// original so pages can still explain an expired/invalid email link.
export const initialUrlHash = typeof window !== "undefined" ? window.location.hash : "";

let clientPromise = null;

/**
 * The shared Supabase client. The SDK (~200 KB) is loaded on demand so it is
 * downloaded in parallel with the app but evaluated in its own task, keeping
 * the first render of every page fast. Resolves to null when not configured.
 * @returns {Promise<import("@supabase/supabase-js").SupabaseClient | null>}
 */
export function getSupabase() {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then(({ createClient }) =>
        createClient(supabaseUrl, supabasePublishableKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        })
      )
      .catch((error) => {
        clientPromise = null; // a later call may retry (e.g. after a network hiccup)
        throw error;
      });
  }
  return clientPromise;
}

/** Absolute URL of an app route, respecting the deployment base path (/SI-MAUNG/). */
export function appUrl(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  return `${window.location.origin}${base}${path.replace(/^\//, "")}`;
}
