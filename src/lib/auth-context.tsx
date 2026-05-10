import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const SYNTHETIC_DOMAIN = "reverence.local";
export const usernameToEmail = (u: string) =>
  `${u.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "")}@${SYNTHETIC_DOMAIN}`;

export type Role = "admin" | "operateur";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
}

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  signIn: (username: string, pin: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const loadProfileAndRole = async (userId: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id,username,display_name").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((p as Profile) ?? null);
    const roles = (r ?? []).map((x: { role: string }) => x.role);
    setRole(roles.includes("admin") ? "admin" : roles.includes("operateur") ? "operateur" : null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setStatus("authenticated");
        // defer to avoid deadlock
        setTimeout(() => loadProfileAndRole(s.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
        setStatus("unauthenticated");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        setStatus("authenticated");
        loadProfileAndRole(data.session.user.id);
      } else {
        setStatus("unauthenticated");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthState["signIn"] = async (username, pin) => {
    const email = usernameToEmail(username);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pin });
    if (error) return { error: "Identifiants invalides" };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshRole = async () => {
    if (session?.user) await loadProfileAndRole(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{ status, user: session?.user ?? null, session, profile, role, signIn, signOut, refreshRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
