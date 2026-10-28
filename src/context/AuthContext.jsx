import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { appUrl, getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { toUserMessage } from "../lib/errors";

const AuthContext = createContext(null);

// Start downloading the auth SDK as soon as the app boots (it evaluates in its own task).
if (isSupabaseConfigured) getSupabase().catch(() => {});

/** The client, or a thrown error the callers turn into a friendly message. */
async function client() {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  return supabase;
}

/** Runs an auth/database action and turns any thrown error (offline, SDK failed to load) into { error }. */
async function attempt(action, fallback) {
  try {
    return await action(await client());
  } catch (error) {
    return { error: toUserMessage(error, fallback) };
  }
}

async function fetchOrCreateProfile(user) {
  const supabase = await client();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) return { profile: null, error };
  if (data) return { profile: data, error: null };
  // No profile row yet (e.g. the sign-up trigger is missing): create it — RLS allows id = auth.uid().
  const created = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: user.user_metadata?.full_name || null, onboarding_completed: false }, { onConflict: "id" })
    .select()
    .single();
  return { profile: created.data || null, error: created.error };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(isSupabaseConfigured ? "loading" : "unconfigured"); // loading | signedIn | signedOut | unconfigured
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState({ for: null, status: "idle", error: "" });
  const [recovery, setRecovery] = useState(false);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let alive = true;
    let unsubscribe = () => {};
    // An expired session is refreshed over the network; if the auth server is
    // slow or unreachable, don't keep the app waiting — continue signed out
    // and let a later auth event (if the server answers) sign the user in.
    const giveUp = setTimeout(() => {
      if (alive) setStatus((s) => (s === "loading" ? "signedOut" : s));
    }, 8000);
    client()
      .then((supabase) => {
        if (!alive) return undefined;
        // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock the auth lock.
        const { data } = supabase.auth.onAuthStateChange((event, next) => {
          if (!alive) return;
          if (event === "PASSWORD_RECOVERY") setRecovery(true);
          if (event === "SIGNED_OUT") setRecovery(false);
          setSession(next ?? null);
          setStatus(next ? "signedIn" : "signedOut");
        });
        unsubscribe = () => data.subscription.unsubscribe();
        return supabase.auth.getSession().then(({ data: current }) => {
          if (!alive) return;
          setSession(current.session ?? null);
          setStatus(current.session ? "signedIn" : "signedOut");
        });
      })
      .catch(() => alive && setStatus("signedOut"))
      .finally(() => clearTimeout(giveUp));
    return () => {
      alive = false;
      clearTimeout(giveUp);
      unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async (u) => {
    setProfileState({ for: u.id, status: "loading", error: "" });
    const { profile: p, error } = await fetchOrCreateProfile(u).catch((e) => ({ profile: null, error: e }));
    if (error) {
      setProfile(null);
      setProfileState({ for: u.id, status: "error", error: toUserMessage(error, "Profil gagal dimuat.") });
    } else {
      setProfile(p);
      setProfileState({ for: u.id, status: "ready", error: "" });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // Deferred to a task so the profile query never runs inside the auth event dispatch.
    const id = setTimeout(() => loadProfile(user), 0);
    return () => clearTimeout(id);
    // Only reload when the account changes, not on every token refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loadProfile]);

  const profileStatus = !userId ? "idle" : profileState.for === userId ? profileState.status : "loading";
  const currentProfile = userId && profileState.for === userId ? profile : null;

  const register = useCallback(
    ({ email, password, fullName }) =>
      attempt(async (supabase) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: appUrl("dashboard") },
        });
        if (error) return { error: toUserMessage(error) };
        // With email confirmation on, Supabase returns a user but no session.
        return { needsConfirmation: !data.session };
      }),
    []
  );

  const login = useCallback(
    ({ email, password }) =>
      attempt(async (supabase) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? toUserMessage(error) : "" };
      }),
    []
  );

  const logout = useCallback(
    () =>
      attempt(async (supabase) => {
        const { error } = await supabase.auth.signOut();
        return { error: error ? toUserMessage(error) : "" };
      }),
    []
  );

  const sendPasswordResetEmail = useCallback(
    (email) =>
      attempt(async (supabase) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl("reset-password") });
        return { error: error ? toUserMessage(error) : "" };
      }),
    []
  );

  const updatePassword = useCallback(
    (password) =>
      attempt(async (supabase) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (!error) setRecovery(false);
        return { error: error ? toUserMessage(error) : "" };
      }),
    []
  );

  const updateProfile = useCallback(
    async (changes) => {
      if (!userId) return { error: "Anda belum masuk." };
      return attempt(async (supabase) => {
        const { data, error } = await supabase.from("profiles").update(changes).eq("id", userId).select().single();
        if (error) return { error: toUserMessage(error, "Profil gagal disimpan.") };
        setProfile(data);
        if (changes.full_name !== undefined) {
          // Keep auth metadata in sync (used as a fallback name); not critical if it fails.
          await supabase.auth.updateUser({ data: { full_name: changes.full_name } });
        }
        return { data };
      }, "Profil gagal disimpan.");
    },
    [userId]
  );

  const completeOnboarding = useCallback(
    async ({ fullName, primaryGoal }) => {
      if (!userId) return { error: "Anda belum masuk." };
      const meta = await attempt(async (supabase) => {
        const { error } = await supabase.auth.updateUser({ data: { full_name: fullName, primary_goal: primaryGoal } });
        return { error: error ? toUserMessage(error) : "" };
      });
      if (meta.error) return { error: meta.error };
      return updateProfile({ full_name: fullName, onboarding_completed: true });
    },
    [userId, updateProfile]
  );

  const retryProfile = useCallback(() => user && loadProfile(user), [user, loadProfile]);

  const value = useMemo(
    () => ({
      status,
      user,
      session,
      profile: currentProfile,
      profileStatus,
      profileError: profileState.for === userId ? profileState.error : "",
      recovery,
      displayName: currentProfile?.full_name || user?.user_metadata?.full_name || "",
      register,
      login,
      logout,
      sendPasswordResetEmail,
      updatePassword,
      updateProfile,
      completeOnboarding,
      retryProfile,
    }),
    [status, user, session, currentProfile, profileStatus, profileState, userId, recovery, register, login, logout, sendPasswordResetEmail, updatePassword, updateProfile, completeOnboarding, retryProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}
