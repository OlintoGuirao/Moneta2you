
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Transaction, CategoryData } from '@/types/financial';
import { categoryColors, formatCurrency } from '@/utils/financial';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface FinancialChartProps {
  transactions: Transaction[];
}

export function FinancialChart({ transactions }: FinancialChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [pieRadius, setPieRadius] = useState(80);
  // Mapa para armazenar cores aleatórias de categorias novas
  const randomColorMap = useRef<{ [key: string]: string }>({});

  // Função para gerar cor aleatória
  function getRandomColor() {
    // Gera cor pastel
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 70%)`;
  }

  function getCategoryColor(name: string) {
    if (categoryColors[name]) return categoryColors[name];
    if (!randomColorMap.current[name]) {
      randomColorMap.current[name] = getRandomColor();
    }
    return randomColorMap.current[name];
  }

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 400) setPieRadius(50);
      else if (window.innerWidth < 640) setPieRadius(60);
      else setPieRadius(80);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const categoryData: CategoryData[] = Object.entries(
    expenseTransactions.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, amount]) => ({
    name,
    amount,
    color: getCategoryColor(name)
  }));

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma despesa para exibir</p>
            <p className="text-sm">Adicione algumas despesas para ver o gráfico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gastos por Categoria</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={chartType === 'pie' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('pie')}
          >
            <PieChartIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] sm:h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={pieRadius}
                  dataKey="amount"
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={categoryData}>
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs"
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Legenda */}
        <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 overflow-x-auto">
          {categoryData.map((category) => (
            <div key={category.name} className="flex items-center space-x-2 min-w-0">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm truncate">{category.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
