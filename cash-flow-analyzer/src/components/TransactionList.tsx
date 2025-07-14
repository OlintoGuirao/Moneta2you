
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types/financial';
import { formatCurrency } from '@/utils/financial';
import { TrendingUp, TrendingDown, Calendar, CreditCard, Banknote, Trash2, Pencil, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db, deleteDoc, doc, updateDoc } from '../firebase';
import { toast } from '@/hooks/use-toast';
import { categories } from '@/utils/financial';
import { useState } from 'react';
import { Tooltip } from '@/components/ui/tooltip';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Obter categorias únicas das transações
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));

  // Filtrar transações pela categoria selecionada
  const filteredTransactions = selectedCategory === 'Todas'
    ? transactions
    : transactions.filter(t => t.category === selectedCategory);

  // Calcular o total devido da categoria filtrada (apenas despesas)
  const totalDevido = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleRemove = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast({ title: 'Removido', description: 'Transação removida com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao remover transação.', variant: 'destructive' });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditData({
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
    });
  };

  const handleEditChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async (transaction: Transaction) => {
    try {
      await updateDoc(doc(db, 'transactions', transaction.id), {
        amount: Number(editData.amount),
        description: editData.description,
        category: editData.category,
      });
      setEditingId(null);
      toast({ title: 'Editado', description: 'Transação editada com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao editar transação.', variant: 'destructive' });
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData({});
  };

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
        {/* Dropdown de filtro por categoria */}
        <div className="mt-2 flex flex-row items-center justify-between gap-2 w-full p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <select
              className="border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm text-black bg-white dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-300 outline-none shadow-sm"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="Todas">Todas</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {/* Valor devido da categoria */}
          <span className="inline-block px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold text-xs shadow-sm border border-red-200 dark:border-red-800">
            {formatCurrency(totalDevido)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
          {sortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 border rounded-xl shadow-sm hover:shadow-md transition bg-white dark:bg-zinc-900 min-w-0 group ${transaction.type === 'income' ? 'border-green-200' : 'border-red-200'}`}
            >
              {/* Botões flutuantes no canto superior direito */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity z-10">
                {editingId === transaction.id ? (
                  <>
                    <button
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                      onClick={() => handleEditSave(transaction)}
                      title="Salvar"
                    >Salvar</button>
                    <button
                      className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                      onClick={handleEditCancel}
                      title="Cancelar"
                    >Cancelar</button>
                  </>
                ) : (
                  <>
                    <button
                      className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                      title="Editar transação"
                      onClick={() => handleEdit(transaction)}
                      style={{ minWidth: 40 }}
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-300"
                      title="Remover transação"
                      onClick={() => handleRemove(transaction.id)}
                      style={{ minWidth: 40 }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full min-w-0">
                <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-black dark:text-white w-full break-words" title={transaction.description}>{transaction.description}</p>
                  <div className="flex flex-wrap items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                    <span className="truncate max-w-[60px] sm:max-w-[100px] text-black dark:text-white">{transaction.category}</span>
                    <span>•</span>
                    <span className="text-black dark:text-white">{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    {transaction.paymentMethod && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span className="text-black dark:text-white">{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {transaction.isInstallment && (
                    <Badge variant="outline" className="mt-1 text-black dark:text-white">Parcela {transaction.currentInstallment}/{transaction.installmentCount}</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-row-reverse sm:flex-row items-end sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0 w-full sm:w-auto">
                {editingId === transaction.id ? (
                  <>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 border rounded text-black"
                      value={editData.amount}
                      onChange={e => handleEditChange('amount', e.target.value)}
                    />
                    <input
                      type="text"
                      className="w-24 px-2 py-1 border rounded text-black"
                      value={editData.description}
                      onChange={e => handleEditChange('description', e.target.value)}
                    />
                    <select
                      className="w-20 px-2 py-1 border rounded text-black"
                      value={editData.category}
                      onChange={e => handleEditChange('category', e.target.value)}
                    >
                      {categories[transaction.type].map((cat: string, idx: number) => (
                        <option key={cat + '-' + idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <div className={`font-semibold text-base sm:text-lg ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      style={{ minWidth: 80 }}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
