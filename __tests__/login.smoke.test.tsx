import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import LoginScreen from "@/app/(auth)/login";
import { AuthService } from "@/services/auth.service";

jest.mock("@/services/auth.service", () => ({
  AuthService: {
    login: jest.fn(),
  },
}));

jest.mock("@/services/monitoring.service", () => ({
  captureException: jest.fn(),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in and redirects to the main stack", async () => {
    const loginMock = jest.mocked(AuthService.login);
    loginMock.mockResolvedValue({} as Awaited<ReturnType<typeof AuthService.login>>);

    const screen = render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("tu@email.com"), "emm@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••"), "123456");
    fireEvent.press(screen.getByText("Entrar al Reino"));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "emm@example.com",
        password: "123456",
      });
      expect(globalThis.__TEST_ROUTER__.replace).toHaveBeenCalledWith("/(main)");
    });
  });
});
