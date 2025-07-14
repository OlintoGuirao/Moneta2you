import { Budget, BudgetProgress } from '@/types/budget';
import { Transaction } from '@/types/financial';
import { categories } from './financial';

const BUDGET_STORAGE_KEY = 'financial-budgets';

export function saveBudgets(budgets: Budget[]): void {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
}

export function loadBudgets(): Budget[] {
  const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getBudgetForCategory(category: string, month: number, year: number): Budget | undefined {
  const budgets = loadBudgets();
  return budgets.find(b => b.category === category && b.month === month && b.year === year);
}

export function setBudgetForCategory(category: string, limit: number, month: number, year: number): void {
  const budgets = loadBudgets();
  const existingIndex = budgets.findIndex(b => 
    b.category === category && b.month === month && b.year === year
  );

  const budget: Budget = {
    id: existingIndex >= 0 ? budgets[existingIndex].id : crypto.randomUUID(),
    category,
    limit,
    month,
    year
  };

  if (existingIndex >= 0) {
    budgets[existingIndex] = budget;
  } else {
    budgets.push(budget);
  }

  saveBudgets(budgets);
}

export function calculateBudgetProgress(
  transactions: Transaction[], 
  month: number, 
  year: number
): BudgetProgress[] {
  const budgets = loadBudgets().filter(b => b.month === month && b.year === year);
  const allCategories = [...categories.expense, ...categories.income];
  
  return budgets.map(budget => {
    const categoryTransactions = transactions.filter(t => 
      t.category === budget.category &&
      new Date(t.date).getMonth() === month &&
      new Date(t.date).getFullYear() === year
    );

    const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    
    return {
      category: budget.category,
      spent,
      limit: budget.limit,
      percentage,
      isOverBudget: spent > budget.limit,
      isNearLimit: percentage >= 80 && percentage < 100
    };
  });
}

export function getAllCategories(): string[] {
  return [...categories.expense, ...categories.income];
}