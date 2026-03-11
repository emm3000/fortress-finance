import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ResetPasswordScreen from "@/app/(auth)/reset-password";
import { AuthService } from "@/services/auth.service";

jest.mock("@/services/auth.service", () => ({
  AuthService: {
    confirmPasswordReset: jest.fn(),
  },
}));

jest.mock("@/services/monitoring.service", () => ({
  captureException: jest.fn(),
}));

describe("ResetPasswordScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    globalThis.__TEST_LOCAL_SEARCH_PARAMS__.mockReturnValue({});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("confirms password reset and returns to login", async () => {
    const confirmMock = jest.mocked(AuthService.confirmPasswordReset);
    confirmMock.mockResolvedValue({} as Awaited<ReturnType<typeof AuthService.confirmPasswordReset>>);

    const screen = render(<ResetPasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("tu@email.com"), "emm@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Pega el codigo recibido"), "123456");
    fireEvent.changeText(screen.getAllByPlaceholderText("••••••")[0], "abcdef");
    fireEvent.changeText(screen.getAllByPlaceholderText("••••••")[1], "abcdef");
    fireEvent.press(screen.getByText("Actualizar contraseña"));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith({
        email: "emm@example.com",
        token: "123456",
        newPassword: "abcdef",
      });
      expect(screen.getByText("Contraseña actualizada. Ya puedes iniciar sesión.")).toBeTruthy();
    });

    jest.advanceTimersByTime(800);

    expect(globalThis.__TEST_ROUTER__.replace).toHaveBeenCalledWith("/(auth)/login");
  });
});
