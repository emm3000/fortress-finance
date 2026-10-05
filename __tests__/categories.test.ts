import { CATEGORIES, getCategory } from "@/constants/categories";

describe("categories", () => {
  it("lists 14 categories, 10 EXPENSE and 4 INCOME, with the slugs and Spanish names of the PRD table", () => {
    expect(CATEGORIES).toHaveLength(14);
    expect(CATEGORIES.filter((c) => c.type === "EXPENSE")).toHaveLength(10);
    expect(CATEGORIES.filter((c) => c.type === "INCOME")).toHaveLength(4);
    expect(CATEGORIES.map((c) => [c.type, c.slug, c.name])).toEqual([
      ["EXPENSE", "food", "Comida"],
      ["EXPENSE", "groceries", "Mercado"],
      ["EXPENSE", "transport", "Transporte"],
      ["EXPENSE", "housing", "Vivienda"],
      ["EXPENSE", "utilities", "Servicios"],
      ["EXPENSE", "health", "Salud"],
      ["EXPENSE", "education", "Educación"],
      ["EXPENSE", "leisure", "Ocio"],
      ["EXPENSE", "shopping", "Compras"],
      ["EXPENSE", "other_expense", "Otros gastos"],
      ["INCOME", "salary", "Sueldo"],
      ["INCOME", "side_income", "Ingresos extra"],
      ["INCOME", "gifts", "Regalos"],
      ["INCOME", "other_income", "Otros ingresos"],
    ]);
  });

  it("looks a category up by slug and returns undefined for an unknown slug", () => {
    expect(getCategory("food")?.name).toBe("Comida");
    expect(getCategory("nope")).toBeUndefined();
  });
});
