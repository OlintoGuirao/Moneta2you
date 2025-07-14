export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: number;
  year: number;
}

export interface BudgetProgress {
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}