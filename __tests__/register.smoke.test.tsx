import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import RegisterScreen from "@/app/(auth)/register";
import { AuthService } from "@/services/auth.service";

jest.mock("@/services/auth.service", () => ({
  AuthService: {
    register: jest.fn(),
  },
}));

jest.mock("@/services/monitoring.service", () => ({
  captureException: jest.fn(),
}));

describe("RegisterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the email confirmation message when signup returns no session", async () => {
    const registerMock = jest.mocked(AuthService.register);
    registerMock.mockResolvedValue({
      requiresEmailConfirmation: true,
    } as Awaited<ReturnType<typeof AuthService.register>>);

    const screen = render(<RegisterScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Tu nombre"), "Emm");
    fireEvent.changeText(screen.getByPlaceholderText("tu@email.com"), "emm@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••"), "123456");
    fireEvent.press(screen.getByText("Registrar Escudo"));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: "Emm",
        email: "emm@example.com",
        password: "123456",
      });
      expect(
        screen.getByText(
          "Te enviamos un enlace de confirmacion a tu correo. Confirma tu cuenta antes de iniciar sesion."
        )
      ).toBeTruthy();
      expect(globalThis.__TEST_ROUTER__.replace).not.toHaveBeenCalled();
    });
  });
});
