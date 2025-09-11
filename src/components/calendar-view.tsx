'use client'

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Prevent hydration error by setting selected date on client
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  return (
    <Card className="bg-card">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="hover:bg-accent">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Mês anterior</span>
          </Button>
          <h3 className="text-lg font-bold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="hover:bg-accent">
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Próximo mês</span>
          </Button>
        </div>
        <Calendar
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="p-0"
          locale={ptBR}
          classNames={{
            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
            day_today: "text-primary",
            head_cell: "text-muted-foreground font-bold text-sm",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
            day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100",
            day_outside: "text-muted-foreground/50 opacity-50",
          }}
        />
      </CardContent>
    </Card>
  );
}
