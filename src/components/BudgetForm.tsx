import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setBudgetForCategory, getAllCategories } from '@/utils/budget';
import { formatCurrency } from '@/utils/financial';
import { useToast } from '@/hooks/use-toast';

interface BudgetFormProps {
  selectedMonth: number;
  selectedYear: number;
  onBudgetSet: () => void;
}

export function BudgetForm({ selectedMonth, selectedYear, onBudgetSet }: BudgetFormProps) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !limit) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const limitValue = parseFloat(limit);
    if (limitValue <= 0) {
      toast({
        title: "Erro",
        description: "O limite deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setBudgetForCategory(category, limitValue, selectedMonth, selectedYear);
    
    toast({
      title: "Orçamento definido",
      description: `Limite de ${formatCurrency(limitValue)} definido para ${category}.`,
    });

    setCategory('');
    setLimit('');
    onBudgetSet();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Definir Orçamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {getAllCategories().map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="limit">Limite (R$)</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <Button type="submit" className="w-full">
            Definir Orçamento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}