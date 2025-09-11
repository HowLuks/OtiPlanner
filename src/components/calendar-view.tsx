'use client';

import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';

interface CalendarViewProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function CalendarView({ selectedDate, onDateChange }: CalendarViewProps) {
  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          className="w-full"
          locale={ptBR}
          showOutsideDays={false}
          classNames={{
            months: 'w-full',
            month: 'w-full space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-lg font-bold capitalize',
            nav: 'flex items-center gap-2',
            nav_button: 'h-9 w-9 bg-transparent p-0 opacity-100 hover:opacity-75',
            day_selected:
              'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90',
            day_today: 'text-primary',
            head_row: 'flex w-full',
            head_cell:
              'text-muted-foreground rounded-md w-full font-normal text-sm text-center',
            row: 'flex w-full mt-2',
            cell: 'w-full h-9 text-center text-sm p-0 relative',
            day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
            day_outside: 'text-muted-foreground/50 opacity-50',
          }}
          components={{
            IconLeft: () => <ChevronLeft className="h-5 w-5" />,
            IconRight: () => <ChevronRight className="h-5 w-5" />,
          }}
        />
      </CardContent>
    </Card>
  );
}

    