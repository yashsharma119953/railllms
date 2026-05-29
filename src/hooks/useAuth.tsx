import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "admin" | "user";

interface Profile {
  full_name: string;
  hrms_id: string | null;
  cug_number: string | null;
  location: string | null;
  designation: string | null;
  avatar_url: string | null;
  username: string | null;
  password?: string | null;
}

interface AuthState {
  user: { id: string; username: string } | null;
  role: AppRole | null;
  profile: Profile | null;
}

interface AuthContextType extends AuthState {
  loading: boolean;
  isHydrated: boolean;
  signIn: (role: AppRole | null, username: string, password: string) => Promise<{ error: any } | { error: null }>;
  signOut: () => Promise<void>;
  setDemoRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FIXED_SUPERADMIN_EMAIL = "Sr.DOM-PRYJ";
const FIXED_SUPERADMIN_PASSWORD = "AcetiansTechnologies@2026";
const SESSION_KEY = "raillms-auth";

function buildSession(state: AuthState) {
  return JSON.stringify(state);
}

function readSession(): AuthState | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

function saveSession(state: AuthState) {
  window.sessionStorage.setItem(SESSION_KEY, buildSession(state));
}

function clearSession() {
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (session) {
      setUser(session.user);
      setRole(session.role);
      setProfile(session.profile);
    }
    setIsHydrated(true);
  }, []);

  const persistState = (nextState: AuthState) => {
    setUser(nextState.user);
    setRole(nextState.role);
    setProfile(nextState.profile);
    saveSession(nextState);
  };

  const signIn = async (selectedRole: AppRole | null, enteredUsername: string, password: string) => {
    setLoading(true);
    try {
      const normalizedUsername = enteredUsername.trim();

      // First, check if there's a managed super admin record in the DB
      const { data: saData, error: saErr } = await supabase
        .from("super_admins")
        .select("username,password")
        .eq("username", normalizedUsername)
        .maybeSingle();

      if (!saErr && saData && saData.password === password) {
        persistState({
          user: { id: "superadmin-db", username: saData.username },
          role: "super_admin",
          profile: {
            full_name: "Super Admin",
            hrms_id: null,
            cug_number: null,
            location: null,
            designation: "Super Admin",
            avatar_url: null,
            username: saData.username,
          },
        });
        return { error: null };
      }

      // Fallback to built-in fixed credentials
      if (normalizedUsername === FIXED_SUPERADMIN_EMAIL && password === FIXED_SUPERADMIN_PASSWORD) {
        persistState({
          user: { id: "superadmin-local", username: FIXED_SUPERADMIN_EMAIL },
          role: "super_admin",
          profile: {
            full_name: "Super Admin",
            hrms_id: null,
            cug_number: null,
            location: null,
            designation: "Super Admin",
            avatar_url: null,
            username: FIXED_SUPERADMIN_EMAIL,
          },
        });
        return { error: null };
      }

      if (!selectedRole) {
        return { error: new Error("Please select a role before logging in.") };
      }

      if (selectedRole === "admin") {
        const { data, error } = await supabase
          .from("admin_assignments")
          .select("*")
          .eq("admin_username", normalizedUsername)
          .eq("admin_password", password)
          .maybeSingle();

        if (error || !data) {
          return { error: error || new Error("Invalid admin credentials") };
        }

        persistState({
          user: { id: data.admin_user_id, username: data.admin_username || normalizedUsername },
          role: "admin",
          profile: {
            full_name: data.admin_name,
            hrms_id: null,
            cug_number: data.cug_number,
            location: data.location,
            designation: "Admin",
            avatar_url: null,
            username: data.admin_username,
            password: data.admin_password,
          },
        });
        return { error: null };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", normalizedUsername)
        .eq("password", password)
        .maybeSingle();

      if (error || !data) {
        return { error: error || new Error("Invalid user credentials") };
      }

      persistState({
        user: { id: data.user_id, username: data.username || normalizedUsername },
        role: "user",
        profile: data as Profile,
      });

      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    clearSession();
    setUser(null);
    setRole(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    role,
    profile,
    loading,
    isHydrated,
    signIn,
    signOut,
    setDemoRole: (r: AppRole) => setRole(r),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
