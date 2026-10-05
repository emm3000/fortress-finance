import { CATEGORIES } from "@/constants/categories";

/** The fixed Category set; shipped with the app, never read from SQLite. */
export const useCategories = (): typeof CATEGORIES => CATEGORIES;
