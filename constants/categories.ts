export type CategoryType = "EXPENSE" | "INCOME";

export const CATEGORIES = [
  { slug: "food", type: "EXPENSE", name: "Comida" },
  { slug: "groceries", type: "EXPENSE", name: "Mercado" },
  { slug: "transport", type: "EXPENSE", name: "Transporte" },
  { slug: "housing", type: "EXPENSE", name: "Vivienda" },
  { slug: "utilities", type: "EXPENSE", name: "Servicios" },
  { slug: "health", type: "EXPENSE", name: "Salud" },
  { slug: "education", type: "EXPENSE", name: "Educación" },
  { slug: "leisure", type: "EXPENSE", name: "Ocio" },
  { slug: "shopping", type: "EXPENSE", name: "Compras" },
  { slug: "other_expense", type: "EXPENSE", name: "Otros gastos" },
  { slug: "salary", type: "INCOME", name: "Sueldo" },
  { slug: "side_income", type: "INCOME", name: "Ingresos extra" },
  { slug: "gifts", type: "INCOME", name: "Regalos" },
  { slug: "other_income", type: "INCOME", name: "Otros ingresos" },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategorySlug = Category["slug"];

export function getCategory(slug: CategorySlug): Category {
  return CATEGORIES.find((category) => category.slug === slug) as Category;
}
