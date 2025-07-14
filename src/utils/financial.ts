
import { Transaction, FinancialSummary } from '@/types/financial';

export const categories = {
  income: [
    'Salário',
    'Freelance',
    'Investimentos',
    'Vendas',
    'Outros'
  ],
  expense: [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Entretenimento',
    'Roupas',
    'Tecnologia',
    'Outros'
  ]
};

export const categoryColors = {
  'Alimentação': '#FF6B6B',
  'Transporte': '#4ECDC4',
  'Moradia': '#45B7D1',
  'Saúde': '#96CEB4',
  'Educação': '#FECA57',
  'Entretenimento': '#FF9FF3',
  'Roupas': '#54A0FF',
  'Tecnologia': '#5F27CD',
  'Salário': '#00D2D3',
  'Freelance': '#FF9F43',
  'Investimentos': '#10AC84',
  'Vendas': '#EE5A24',
  'Outros': '#9C88FF'
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

export function calculateSummary(transactions: Transaction[]): FinancialSummary {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    balance,
    transactions
  };
}

export function createInstallments(transaction: Transaction): Transaction[] {
  if (!transaction.isInstallment || !transaction.installmentCount) {
    return [transaction];
  }

  const installmentAmount = transaction.amount / transaction.installmentCount;
  const installments: Transaction[] = [];

  for (let i = 0; i < transaction.installmentCount; i++) {
    const installmentDate = new Date(transaction.date);
    installmentDate.setMonth(installmentDate.getMonth() + i);

    installments.push({
      ...transaction,
      id: `${transaction.id}_${i + 1}`,
      amount: installmentAmount,
      currentInstallment: i + 1,
      originalTransactionId: transaction.id,
      description: `${transaction.description} (${i + 1}/${transaction.installmentCount})`,
      date: installmentDate
    });
  }

  return installments;
}

export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });
}

export function getTransactionsByMonth(transactions: Transaction[], month: number, year: number): Transaction[] {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === month && 
           transactionDate.getFullYear() === year;
  });
}
