import { Category, CategoryRepository } from "@/db/category.repository";
import { supabase } from './supabase.client';

type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: 'INCOME' | 'EXPENSE';
  is_default: boolean;
};

export const CategoryService = {
  async getAllRemote(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,icon,color,type,is_default')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    const remoteCategories = (data ?? []) as CategoryRow[];

    return remoteCategories.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
      is_default: row.is_default ? 1 : 0,
    }));
  },

  async getCachedOrRemote(isOnline: boolean): Promise<Category[]> {
    if (!isOnline) {
      return CategoryRepository.getAll();
    }

    try {
      const remoteCategories = await this.getAllRemote();
      if (remoteCategories.length > 0) {
        await CategoryRepository.upsertMany(remoteCategories);
      }
      return remoteCategories;
    } catch (error) {
      const localCategories = await CategoryRepository.getAll();
      if (localCategories.length > 0) {
        return localCategories;
      }
      throw error;
    }
  },
};
