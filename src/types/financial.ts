
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  isInstallment?: boolean;
  installmentCount?: number;
  currentInstallment?: number;
  originalTransactionId?: string;
  paymentMethod?: 'cash' | 'debit' | 'credit';
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactions: Transaction[];
}

export interface CategoryData {
  name: string;
  amount: number;
  color: string;
}
