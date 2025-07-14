
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Transaction } from '@/types/financial';
import { categories } from '@/utils/financial';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { db, collection as fbCollection, onSnapshot as fbOnSnapshot, query as fbQuery, where as fbWhere } from '../firebase';
import { auth } from '../firebase';

interface TransactionFormProps {
  onAddTransaction: (transaction: Transaction) => void;
  activeProfile?: string;
}

export function TransactionForm({ onAddTransaction, activeProfile }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    paymentMethod: 'cash' as 'cash' | 'debit' | 'credit',
    isInstallment: false,
    installmentCount: ''
  });
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const email = activeProfile || currentUser?.email;
    if (!email) return;
    const q = fbQuery(
      fbCollection(db, 'categories'),
      fbWhere('user', '==', email)
    );
    const unsubscribe = fbOnSnapshot(q, (snapshot) => {
      setCustomCategories(snapshot.docs.map(doc => doc.data().name));
    });
    return () => unsubscribe();
  }, [activeProfile, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('FormData submit:', formData);
    if (!formData.amount || !formData.description || !formData.category) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: new Date(),
      paymentMethod: formData.paymentMethod,
      isInstallment: formData.isInstallment,
      installmentCount: formData.isInstallment ? parseInt(formData.installmentCount) : undefined
    };

    onAddTransaction(transaction);
    
    // Reset form
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      paymentMethod: 'cash',
      isInstallment: false,
      installmentCount: ''
    });

    toast({
      title: "Sucesso!",
      description: "Transação adicionada com sucesso.",
    });
  };

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nova Transação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') =>
                  setFormData(prev => ({ ...prev, type: value, category: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva a transação..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories[formData.type].map((category, idx) => (
                    <SelectItem key={category + '-' + idx} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  {customCategories.map((category, idx) => (
                    <SelectItem key={category + '-custom-' + idx} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: 'cash' | 'debit' | 'credit') =>
                  setFormData(prev => ({ ...prev, paymentMethod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="debit">Cartão de Débito</SelectItem>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.paymentMethod === 'credit' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Switch
                  id="installment"
                  checked={formData.isInstallment}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, isInstallment: checked }))
                  }
                />
                <Label htmlFor="installment">Parcelar compra</Label>
              </div>
              
              {formData.isInstallment && (
                <div className="space-y-2">
                  <Label htmlFor="installmentCount">Número de parcelas</Label>
                  <Select
                    value={formData.installmentCount}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, installmentCount: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o número de parcelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 2).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full">
            Adicionar Transação
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
