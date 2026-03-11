import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

import OnboardingScreen from "@/app/(auth)/onboarding";

describe("OnboardingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the first onboarding step and lets the user skip", async () => {
    const deleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);
    const setItemAsync = jest.mocked(SecureStore.setItemAsync);

    const screen = render(<OnboardingScreen />);

    expect(screen.getByText("Registra tu reino financiero")).toBeTruthy();
    expect(screen.getByText("Saltar")).toBeTruthy();

    fireEvent.press(screen.getByText("Saltar"));

    await waitFor(() => {
      expect(deleteItemAsync).toHaveBeenCalledWith("onboarding_preferences_draft");
      expect(setItemAsync).toHaveBeenCalledWith("onboarding_skipped", "true");
      expect(globalThis.__TEST_ROUTER__.replace).toHaveBeenCalledWith("/(auth)/login");
    });
  });
});
