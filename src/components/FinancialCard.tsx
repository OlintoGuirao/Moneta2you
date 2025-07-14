
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/financial';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinancialCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'balance';
  className?: string;
}

export function FinancialCard({ title, amount, type, className = '' }: FinancialCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'income':
        return <TrendingUp className="h-6 w-6 text-green-500" />;
      case 'expense':
        return <TrendingDown className="h-6 w-6 text-red-500" />;
      case 'balance':
        return <DollarSign className="h-6 w-6 text-blue-500" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'income':
        return 'gradient-income';
      case 'expense':
        return 'gradient-expense';
      case 'balance':
        return 'gradient-balance';
    }
  };

  const getAmountColor = () => {
    switch (type) {
      case 'income':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
        return 'text-red-600 dark:text-red-400';
      case 'balance':
        return amount >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${className}`}>
      <div className={`absolute inset-0 opacity-10 ${getGradient()}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={`text-2xl font-bold ${getAmountColor()}`}>
          {formatCurrency(amount)}
        </div>
      </CardContent>
    </Card>
  );
}
