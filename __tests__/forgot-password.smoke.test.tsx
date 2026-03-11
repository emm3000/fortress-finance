import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ForgotPasswordScreen from "@/app/(auth)/forgot-password";
import { AuthService } from "@/services/auth.service";

jest.mock("@/services/auth.service", () => ({
  AuthService: {
    requestPasswordReset: jest.fn(),
  },
}));

jest.mock("@/services/monitoring.service", () => ({
  captureException: jest.fn(),
}));

describe("ForgotPasswordScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests password reset and routes to reset-password with the email param", async () => {
    const resetMock = jest.mocked(AuthService.requestPasswordReset);
    resetMock.mockResolvedValue({
      message: "Codigo enviado",
    } as Awaited<ReturnType<typeof AuthService.requestPasswordReset>>);

    const screen = render(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("tu@email.com"), "emm@example.com");
    fireEvent.press(screen.getByText("Solicitar codigo"));

    await waitFor(() => {
      expect(resetMock).toHaveBeenCalledWith({
        email: "emm@example.com",
      });
      expect(screen.getByText("Codigo enviado")).toBeTruthy();
      expect(globalThis.__TEST_ROUTER__.push).toHaveBeenCalledWith({
        pathname: "/(auth)/reset-password",
        params: { email: "emm@example.com" },
      });
    });
  });
});
