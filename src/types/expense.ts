export type ExpenseCategory = 'Food' | 'Transport' | 'Shopping' | 'Utilities' | 'Entertainment' | 'Others';

export interface Expense {
  id?: string; // Stringified ObjectId for frontend use
  _id?: string; // Alternative to handle MongoDB mapping seamlessly
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // Format: YYYY-MM-DD
  createdAt?: string;
}
