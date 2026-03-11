import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import AlertsScreen from "@/app/(main)/alerts";

jest.mock("@/hooks/useNotifications", () => ({
  useNotifications: jest.fn(() => ({
    data: [
      {
        id: "alert-1",
        title: "Your fortress took damage",
        body: "Daily liquidation applied damage.",
        type: "ATTACK",
        status: "SENT",
        createdAt: "2026-03-11T12:00:00.000Z",
      },
    ],
    isLoading: false,
    isError: false,
  })),
}));

describe("AlertsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes alerts using notification type instead of title parsing", () => {
    const screen = render(<AlertsScreen />);

    fireEvent.press(screen.getByText("Your fortress took damage"));

    expect(globalThis.__TEST_ROUTER__.push).toHaveBeenCalledWith("/(main)");
    expect(screen.getByText("Ir al dashboard")).toBeTruthy();
  });
});
