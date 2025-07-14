
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types/financial';
import { formatCurrency } from '@/utils/financial';
import { TrendingUp, TrendingDown, Calendar, CreditCard, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit':
        return <CreditCard className="h-4 w-4" />;
      case 'debit':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit':
        return 'Cartão de Crédito';
      case 'debit':
        return 'Cartão de Débito';
      default:
        return 'Dinheiro';
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma transação encontrada</p>
            <p className="text-sm">Adicione sua primeira transação acima</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'income' 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
                
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{transaction.category}</span>
                    <span>•</span>
                    <span>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    {transaction.paymentMethod && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {transaction.isInstallment && (
                    <Badge variant="outline" className="mt-1">
                      Parcela {transaction.currentInstallment}/{transaction.installmentCount}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'income' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
