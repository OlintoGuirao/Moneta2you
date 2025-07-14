
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/financial';
import { calculateSummary, createInstallments, getCurrentMonthTransactions, getTransactionsByMonth } from '@/utils/financial';
import { calculateBudgetProgress } from '@/utils/budget';
import { FinancialCard } from '@/components/FinancialCard';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { FinancialChart } from '@/components/FinancialChart';
import { MonthFilter } from '@/components/MonthFilter';
import { BudgetForm } from '@/components/BudgetForm';
import { BudgetProgress } from '@/components/BudgetProgress';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Wallet, User, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { auth, db, collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc, getDocs } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/utils/financial';
import { Select } from '@/components/ui/select';
import { LineChart, Line, CartesianGrid, Legend } from 'recharts';

// Função utilitária para remover campos undefined
function removeUndefined(obj: any) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

// Função utilitária para tratar datas do Firestore ou string/Date
function parseFirestoreDate(date: any): Date {
  if (date && typeof date === 'object' && 'seconds' in date && typeof date.seconds === 'number') {
    return new Date(date.seconds * 1000);
  }
  if (typeof date === 'string' || typeof date === 'number') {
    return new Date(date);
  }
  if (date instanceof Date) {
    return date;
  }
  return new Date();
}

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budgetRefresh, setBudgetRefresh] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profiles, setProfiles] = useState<{ email: string, label: string, permission: string }[]>([]);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  const navigate = useNavigate();

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !activeProfile) return;
    const normalizedProfile = activeProfile.toLowerCase().trim();
    console.log('Buscando transações para o perfil:', normalizedProfile);
    let unsubscribe: any = null;
    let ignore = false;
    async function fetchAndSetTransactions() {
      if (normalizedProfile === user.email.toLowerCase().trim()) {
        // Dois onSnapshot: um para userId, outro para userEmail
        let txs1: any[] = [];
        let txs2: any[] = [];
        const update = () => {
          // Mesclar e remover duplicatas por id
          const all = [...txs1, ...txs2];
          const unique = Array.from(new Map(all.map(t => [t.id, t])).values());
          setTransactions(unique);
        };
        const unsub1 = onSnapshot(
          query(collection(db, "transactions"), where("userId", "==", user.uid)),
          (snapshot) => {
            txs1 = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                type: data.type,
                amount: Number(data.amount),
                description: data.description,
                category: data.category,
                date: parseFirestoreDate(data.date),
                isInstallment: data.isInstallment,
                installmentCount: data.installmentCount,
                currentInstallment: data.currentInstallment,
                originalTransactionId: data.originalTransactionId,
                paymentMethod: data.paymentMethod,
              };
            });
            update();
          }
        );
        const unsub2 = onSnapshot(
          query(collection(db, "transactions"), where("userEmail", "==", user.email.toLowerCase().trim())),
          (snapshot) => {
            txs2 = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                type: data.type,
                amount: Number(data.amount),
                description: data.description,
                category: data.category,
                date: parseFirestoreDate(data.date),
                isInstallment: data.isInstallment,
                installmentCount: data.installmentCount,
                currentInstallment: data.currentInstallment,
                originalTransactionId: data.originalTransactionId,
                paymentMethod: data.paymentMethod,
              };
            });
            update();
          }
        );
        unsubscribe = () => { unsub1(); unsub2(); };
      } else {
        // Perfil compartilhado: busca normal
        const q = query(collection(db, "transactions"), where("userEmail", "==", normalizedProfile));
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (ignore) return;
          const txs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type,
              amount: Number(data.amount),
              description: data.description,
              category: data.category,
              date: parseFirestoreDate(data.date),
              isInstallment: data.isInstallment,
              installmentCount: data.installmentCount,
              currentInstallment: data.currentInstallment,
              originalTransactionId: data.originalTransactionId,
              paymentMethod: data.paymentMethod,
            };
          });
          setTransactions(txs);
        });
      }
    }
    fetchAndSetTransactions();
    return () => {
      ignore = true;
      if (unsubscribe) unsubscribe();
    };
  }, [user, activeProfile]);

  useEffect(() => {
    console.log('Transactions state:', transactions);
  }, [transactions]);

  // Buscar perfis acessíveis (meu e autorizados)
  useEffect(() => {
    if (!user) return;
    // Meu próprio perfil
    const myProfile = { email: user.email, label: 'Minhas finanças', permission: 'owner' };
    // Perfis que me autorizaram
    const q = query(collection(db, 'financeUsers'), where('email', '==', user.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const others = snapshot.docs
        .map(doc => {
          const owner = doc.data().owner;
          return owner ? {
            email: owner,
            label: owner,
            permission: doc.data().permission || 'view',
          } : null;
        })
        .filter(Boolean);
      setProfiles([myProfile, ...others]);
      if (!activeProfile) setActiveProfile(myProfile.email);
    });
    return () => unsubscribe();
  }, [user]);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const menu = document.getElementById('profile-menu');
      if (menu && !menu.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Remover o useEffect do localStorage para carregar transações

  const handleAddTransaction = async (transaction: Transaction) => {
    if (!user || !activeProfile) return;
    try {
      // Determinar userId e userEmail do perfil ativo
      let userId, userEmail;
      const normalizedProfile = activeProfile.toLowerCase().trim();
      if (normalizedProfile === user.email.toLowerCase().trim()) {
        userId = user.uid;
        userEmail = user.email.toLowerCase().trim();
      } else {
        userId = null;
        userEmail = normalizedProfile;
      }
      console.log('Salvando transação para userEmail:', userEmail);
      if (transaction.isInstallment && transaction.installmentCount && transaction.installmentCount > 1) {
        for (let i = 1; i <= transaction.installmentCount; i++) {
          await addDoc(collection(db, "transactions"),
            removeUndefined({
              ...transaction,
              amount: Number(transaction.amount) / transaction.installmentCount,
              userId,
              userEmail,
              currentInstallment: i,
              originalTransactionId: transaction.id,
              date: new Date(new Date(transaction.date).setMonth(new Date(transaction.date).getMonth() + (i - 1))).toISOString()
            })
          );
        }
      } else {
        await addDoc(collection(db, "transactions"),
          removeUndefined({
            ...transaction,
            userId,
            userEmail,
            date: new Date(transaction.date).toISOString()
          })
        );
      }
      toast({ title: "Sucesso!", description: `Transação adicionada com sucesso para o perfil: ${userEmail}` });
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      toast({ title: "Erro", description: "Erro ao adicionar transação.", variant: "destructive" });
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
  const budgetProgress = calculateBudgetProgress(transactions, selectedMonth, selectedYear);

  const handleBudgetSet = () => {
    setBudgetRefresh(prev => prev + 1);
  };

  // --- NOVO: cálculo de dívidas futuras e dados para gráfico ---
  const now = new Date();
  // Todas as parcelas futuras (apenas despesas parceladas com data >= hoje)
  const futureInstallments = transactions.filter(t =>
    t.type === 'expense' &&
    t.isInstallment &&
    t.date &&
    new Date(t.date) >= now
  );
  // Valor total devido
  const totalDue = futureInstallments.reduce((sum, t) => sum + Number(t.amount), 0);
  // Agrupar por mês/ano de vencimento
  const installmentsByMonth: Record<string, number> = {};
  futureInstallments.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    installmentsByMonth[key] = (installmentsByMonth[key] || 0) + Number(t.amount);
  });
  // Dados para o gráfico
  const barData = Object.entries(installmentsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [year, month] = key.split('-');
      return {
        name: `${month}/${year.slice(2)}`,
        value
      };
    });

  // --- NOVO: cálculo de economias mensais para gráfico ---
  // Agrupar transações por mês/ano
  const monthlyBalances: Record<string, { income: number, expense: number }> = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyBalances[key]) monthlyBalances[key] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyBalances[key].income += Number(t.amount);
    if (t.type === 'expense') monthlyBalances[key].expense += Number(t.amount);
  });
  // Gerar dados ordenados para o gráfico
  const sortedMonths = Object.keys(monthlyBalances).sort();
  const economyData = sortedMonths.map(key => {
    const [year, month] = key.split('-');
    const saldo = monthlyBalances[key].income - monthlyBalances[key].expense;
    return {
      name: `${month}/${year.slice(2)}`,
      saldo,
      key,
    };
  });
  // Descobrir se o mês atual economizou mais ou menos que o anterior
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentIdx = economyData.findIndex(e => e.key === currentMonthKey);
  let currentColor = '#22c55e'; // verde
  if (currentIdx > 0 && economyData[currentIdx].saldo < economyData[currentIdx - 1].saldo) {
    currentColor = '#ef4444'; // vermelho
  }

  // --- NOVO: gráfico de economia mês a mês (barras coloridas) ---
  // Agrupar despesas por mês/ano
  const monthlyExpenses: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyExpenses[key] = (monthlyExpenses[key] || 0) + Number(t.amount);
    }
  });
  // Gerar dados ordenados para o gráfico
  const sortedExpenseMonths = Object.keys(monthlyExpenses).sort();
  const expenseBarData = sortedExpenseMonths.map((key, idx, arr) => {
    const [year, month] = key.split('-');
    const value = monthlyExpenses[key];
    let color = '#a3a3a3'; // cinza
    if (idx > 0) {
      if (value < monthlyExpenses[arr[idx - 1]]) color = '#22c55e'; // verde
      else if (value > monthlyExpenses[arr[idx - 1]]) color = '#ef4444'; // vermelho
    }
    return {
      name: `${month}/${year.slice(2)}`,
      value,
      fill: color,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-2 sm:px-4 py-4 flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2 sm:gap-4">
            <Wallet className="h-8 w-8 text-primary flex-shrink-0" />
            {/* Seletor de perfil ativo */}
            {profiles.length > 1 && (
              <select
                className="ml-4 border rounded px-2 py-1 text-sm text-black bg-white"
                value={activeProfile || ''}
                onChange={e => setActiveProfile(e.target.value)}
              >
                {profiles.map((p, idx) => (
                  <option key={p.email + idx} value={p.email}>{p.label === 'Minhas finanças' ? p.label : p.email}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-row items-center gap-2 sm:gap-4">
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
            {user && (
              <div className="relative">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-gray-300 shadow-sm cursor-pointer"
                  title={user.email}
                  onClick={() => setMenuOpen((v) => !v)}
                />
                {menuOpen && (
                  <div id="profile-menu" className="absolute right-0 mt-2 w-48 bg-white border border-blue-100 rounded-xl shadow-2xl z-10 animate-fade-in flex flex-col py-2">
                    <button
                      className="flex items-center gap-2 w-full text-left px-5 py-2 hover:bg-blue-50 transition rounded-t-xl text-gray-700 font-medium"
                      onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                    >
                      <User className="w-4 h-4 text-blue-600" /> Perfil
                    </button>
                    <button
                      className="flex items-center gap-2 w-full text-left px-5 py-2 hover:bg-red-50 transition rounded-b-xl text-red-600 font-medium border-t border-blue-50"
                      onClick={() => { setMenuOpen(false); auth.signOut(); }}
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Filtro por Mês */}
        <div className="animate-fade-in">
          <MonthFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
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

        {/* Orçamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 animate-fade-in">
          <BudgetForm
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onBudgetSet={handleBudgetSet}
          />
          <BudgetProgress budgets={budgetProgress} />
        </div>

        {/* Gráfico */}
        <div className="animate-slide-up">
          <FinancialChart transactions={filteredTransactions} />
        </div>

        {/* Formulário e Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <TransactionForm onAddTransaction={handleAddTransaction} activeProfile={activeProfile} />
          <TransactionList transactions={filteredTransactions} />
        </div>

        {/* Estatísticas */}
        {filteredTransactions.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 sm:p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Estatísticas Gerais do Mês</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{filteredTransactions.length}</p>
                <p className="text-sm text-muted-foreground">Total de Transações</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredTransactions.filter(t => t.type === 'income').length}
                </p>
                <p className="text-sm text-muted-foreground">Receitas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {filteredTransactions.filter(t => t.type === 'expense').length}
                </p>
                <p className="text-sm text-muted-foreground">Despesas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredTransactions.filter(t => t.isInstallment).length}
                </p>
                <p className="text-sm text-muted-foreground">Parceladas</p>
              </div>
            </div>
          </div>
        )}
        {/* NOVO CARD: Total devido em parcelas e gráfico de vencimento */}
        {totalDue > 0 && (
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle>Valor Total Devido em Parcelas Futuras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 mb-4">{formatCurrency(totalDue)}</div>
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={formatCurrency} className="text-xs" />
                    <Tooltip formatter={formatCurrency} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#e11d48">
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#e11d48" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-muted-foreground mt-2">O gráfico mostra o valor total de parcelas a vencer em cada mês futuro.</div>
            </CardContent>
          </Card>
        )}
        {/* NOVO: Gráfico de economias mensais */}
        {economyData.length > 1 && (
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle>Economia Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={economyData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={formatCurrency} className="text-xs" />
                    <Tooltip formatter={formatCurrency} />
                    <Legend />
                    <Line type="monotone" dataKey="saldo" stroke="#8884d8" strokeWidth={2} dot={false} />
                    {currentIdx >= 0 && (
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        data={[economyData[currentIdx]]}
                        stroke={currentColor}
                        strokeWidth={4}
                        dot={{ r: 8, fill: currentColor, stroke: '#fff', strokeWidth: 2 }}
                        legendType="none"
                        isAnimationActive={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs mt-2">
                O ponto do mês atual fica <span className={currentColor === '#22c55e' ? 'text-green-600' : 'text-red-600'}>
                  {currentColor === '#22c55e' ? 'verde' : 'vermelho'}
                </span> se você economizou mais (ou menos) que no mês anterior.
              </div>
            </CardContent>
          </Card>
        )}
        {/* NOVO: Gráfico de economia mês a mês (barras coloridas) */}
        {expenseBarData.length > 1 && (
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle>Economia Mensal (Despesas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseBarData}>
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={formatCurrency} className="text-xs" />
                    <Tooltip formatter={formatCurrency} />
                    <Bar dataKey="value">
                      {expenseBarData.map((entry, index) => (
                        <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs mt-2">
                A barra fica <span className="text-green-600">verde</span> se você gastou menos que no mês anterior, <span className="text-red-600">vermelha</span> se gastou mais, e <span className="text-gray-500">cinza</span> se igual.
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
