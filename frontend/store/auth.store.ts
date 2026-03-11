import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { Session } from "@supabase/supabase-js";
import { setUnauthorizedHandler } from "../services/api.client";
import { captureException, setMonitoringUser } from "../services/monitoring.service";
import { supabase } from "../services/supabase.client";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrateFromSession: (session: Session | null) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

let isAuthSubscriptionBound = false;

const clearLegacyAuthStorage = async () => {
  await Promise.allSettled([
    SecureStore.deleteItemAsync("auth_token"),
    SecureStore.deleteItemAsync("user_data"),
  ]);
};

const mapSessionUser = async (session: Session): Promise<User> => {
  const authUser = session.user;
  const metadataName =
    typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name : "";

  const fallbackUser: User = {
    id: authUser.id,
    name: metadataName,
    email: authUser.email ?? "",
  };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,name,email")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    return fallbackUser;
  }

  return {
    id: profile.id,
    name: profile.name || metadataName,
    email: profile.email || authUser.email || "",
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  logout: async () => {
    await supabase.auth.signOut();
    await clearLegacyAuthStorage();
    setMonitoringUser(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  hydrateFromSession: async (session) => {
    if (!session) {
      await clearLegacyAuthStorage();
      setMonitoringUser(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await mapSessionUser(session);
      await clearLegacyAuthStorage();
      setMonitoringUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      captureException(error, { phase: "auth_store_hydrate_session" });
      await clearLegacyAuthStorage();
      setMonitoringUser(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      if (!isAuthSubscriptionBound) {
        supabase.auth.onAuthStateChange((_event, session) => {
          void useAuthStore.getState().hydrateFromSession(session);
        });
        isAuthSubscriptionBound = true;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      await useAuthStore.getState().hydrateFromSession(session);
    } catch (error) {
      console.error("Auth initialization failed:", error);
      captureException(error, { phase: "auth_store_initialize" });
      await clearLegacyAuthStorage();
      setMonitoringUser(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

setUnauthorizedHandler(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    await useAuthStore.getState().hydrateFromSession(null);
  }
});
