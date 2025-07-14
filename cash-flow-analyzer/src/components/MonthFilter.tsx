import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

interface MonthFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
}

export function MonthFilter({ selectedMonth, selectedYear, onMonthChange }: MonthFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  const months = [
    { value: 0, label: 'Janeiro' },
    { value: 1, label: 'Fevereiro' },
    { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Maio' },
    { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' },
    { value: 10, label: 'Novembro' },
    { value: 11, label: 'Dezembro' }
  ];

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <Calendar className="h-5 w-5 text-primary" />
      <div className="flex items-center gap-2">
        <Label htmlFor="month-filter">Filtrar por:</Label>
      </div>
      
      <Select
        value={selectedMonth.toString()}
        onValueChange={(value) => onMonthChange(parseInt(value), selectedYear)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => onMonthChange(selectedMonth, parseInt(value))}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}