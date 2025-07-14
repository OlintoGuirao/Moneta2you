
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/financial';
import { calculateSummary, createInstallments, getCurrentMonthTransactions, getTransactionsByMonth } from '@/utils/financial';
import { FinancialCard } from '@/components/FinancialCard';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { FinancialChart } from '@/components/FinancialChart';
import { MonthFilter } from '@/components/MonthFilter';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const savedTransactions = localStorage.getItem('financial-transactions');
    if (savedTransactions) {
      const parsed = JSON.parse(savedTransactions);
      setTransactions(parsed.map((t: any) => ({ ...t, date: new Date(t.date) })));
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Salvar transações no localStorage
  useEffect(() => {
    localStorage.setItem('financial-transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleAddTransaction = (transaction: Transaction) => {
    console.log('Adicionando transação:', transaction);
    
    if (transaction.isInstallment) {
      const installments = createInstallments(transaction);
      console.log('Parcelas criadas:', installments);
      setTransactions(prev => [...prev, ...installments]);
      toast({
        title: "Sucesso!",
        description: `Transação parcelada em ${transaction.installmentCount}x adicionada com sucesso.`,
      });
    } else {
      setTransactions(prev => [...prev, transaction]);
      toast({
        title: "Sucesso!",
        description: "Transação adicionada com sucesso.",
      });
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const filteredTransactions = getTransactionsByMonth(transactions, selectedMonth, selectedYear);
  const summary = calculateSummary(filteredTransactions);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Controle Financeiro</h1>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="relative"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Filtro por Mês */}
        <div className="animate-fade-in">
          <MonthFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <FinancialCard
            title="Receitas do Mês"
            amount={summary.totalIncome}
            type="income"
          />
          <FinancialCard
            title="Despesas do Mês"
            amount={summary.totalExpenses}
            type="expense"
          />
          <FinancialCard
            title="Saldo do Mês"
            amount={summary.balance}
            type="balance"
          />
        </div>

        {/* Gráfico */}
        <div className="animate-slide-up">
          <FinancialChart transactions={filteredTransactions} />
        </div>

        {/* Formulário e Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TransactionForm onAddTransaction={handleAddTransaction} />
          <TransactionList transactions={filteredTransactions} />
        </div>

        {/* Estatísticas */}
        {transactions.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Estatísticas Gerais</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{transactions.length}</p>
                <p className="text-sm text-muted-foreground">Total de Transações</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {transactions.filter(t => t.type === 'income').length}
                </p>
                <p className="text-sm text-muted-foreground">Receitas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {transactions.filter(t => t.type === 'expense').length}
                </p>
                <p className="text-sm text-muted-foreground">Despesas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {transactions.filter(t => t.isInstallment).length}
                </p>
                <p className="text-sm text-muted-foreground">Parceladas</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
