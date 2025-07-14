import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { BudgetProgress as BudgetProgressType } from '@/types/budget';
import { formatCurrency } from '@/utils/financial';

interface BudgetProgressProps {
  budgets: BudgetProgressType[];
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Controle Orçamentário</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhum orçamento definido para este mês.
          </p>
        </CardContent>
      </Card>
    );
  }

  const alerts = budgets.filter(b => b.isOverBudget || b.isNearLimit);

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((budget) => (
            <Alert 
              key={budget.category} 
              variant={budget.isOverBudget ? "destructive" : "default"}
            >
              {budget.isOverBudget ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {budget.isOverBudget 
                  ? `Orçamento de ${budget.category} ultrapassado! Gasto: ${formatCurrency(budget.spent)} de ${formatCurrency(budget.limit)}`
                  : `Atenção: ${budget.category} próximo do limite (${budget.percentage.toFixed(1)}%)`
                }
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Controle Orçamentário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgets.map((budget) => (
            <div key={budget.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{budget.category}</span>
                  {budget.isOverBudget ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : budget.isNearLimit ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                </div>
              </div>
              <Progress 
                value={Math.min(budget.percentage, 100)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {budget.percentage.toFixed(1)}% do orçamento utilizado
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}