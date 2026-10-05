import { renderHook } from "@testing-library/react-native";
import { CATEGORIES } from "@/constants/categories";
import { useCategories } from "@/hooks/useCategories";

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(() => {
    throw new Error("useCategories must not open SQLite");
  }),
}));

describe("useCategories", () => {
  it("useCategories returns the 14 categories from constants/categories.ts without SQLite", () => {
    const { result } = renderHook(() => useCategories());

    expect(result.current).toBe(CATEGORIES);
    expect(result.current).toHaveLength(14);
  });
});
