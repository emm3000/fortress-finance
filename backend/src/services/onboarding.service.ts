import prisma from '../config/db';
import { TransactionType } from '@prisma/client';
import type { OnboardingPreferencesInput } from '../validations/onboarding.validation';

export const upsertUserPreferences = async (
  userId: string,
  data: OnboardingPreferencesInput,
) => {
  return await prisma.$transaction(async (tx) => {
    const preferences = await tx.userPreference.upsert({
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

    const alreadyHasInitialCategories = await tx.userInitialCategory.count({
      where: { userId },
    });

    if (alreadyHasInitialCategories === 0) {
      const suggestedCategories = await tx.category.findMany({
        where: { type: TransactionType.EXPENSE },
        orderBy: { name: 'asc' },
        take: 4,
        select: { id: true },
      });

      if (suggestedCategories.length > 0) {
        await tx.userInitialCategory.createMany({
          data: suggestedCategories.map((category) => ({
            userId,
            categoryId: category.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return preferences;
  });
};
