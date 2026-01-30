export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  baseCurrency: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  baseAmount: number;
  baseCurrency: string;
  description: string;
  notes?: string;
  date: string;
  categoryId: string;
  category: Category;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
