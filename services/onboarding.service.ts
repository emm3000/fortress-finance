import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase.client";

const ONBOARDING_DRAFT_KEY = "onboarding_preferences_draft";

export type OnboardingPreferencesDraft = {
  currency: string;
  monthlyIncomeGoal: number;
};

export const OnboardingService = {
  async saveDraft(draft: OnboardingPreferencesDraft) {
    await SecureStore.setItemAsync(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  },

  async clearDraft() {
    await SecureStore.deleteItemAsync(ONBOARDING_DRAFT_KEY);
  },

  async getDraft(): Promise<OnboardingPreferencesDraft | null> {
    const raw = await SecureStore.getItemAsync(ONBOARDING_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as OnboardingPreferencesDraft;
      if (
        typeof parsed.currency !== "string" ||
        typeof parsed.monthlyIncomeGoal !== "number" ||
        parsed.monthlyIncomeGoal <= 0
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  async syncPreferencesIfNeeded() {
    const draft = await this.getDraft();
    if (!draft) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error("Sesion no disponible. Inicia sesion nuevamente.");
    }

    const { error } = await supabase.rpc("complete_onboarding", {
      p_currency: draft.currency,
      p_monthly_income_goal: draft.monthlyIncomeGoal,
    });

    if (error) {
      throw error;
    }

    await this.clearDraft();
  },
};
