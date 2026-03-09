import prisma from '../config/db';
import type { OnboardingPreferencesInput } from '../validations/onboarding.validation';

export const upsertUserPreferences = async (
  userId: string,
  data: OnboardingPreferencesInput,
) => {
  return await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      currency: data.currency,
      monthlyIncomeGoal: data.monthlyIncomeGoal,
    },
    update: {
      currency: data.currency,
      monthlyIncomeGoal: data.monthlyIncomeGoal,
    },
  });
};
