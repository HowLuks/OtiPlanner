'use client';

import { useState } from 'react';
import { ptBR } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';

export function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full"
          locale={ptBR}
          classNames={{
            months: 'w-full',
            caption: 'flex items-center justify-between p-4 sm:p-6',
            caption_label: 'text-lg font-bold capitalize',
            nav: 'flex items-center gap-2',
            nav_button: 'h-9 w-9 bg-transparent p-0 opacity-100 hover:opacity-75',
            day_selected:
              'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90',
            day_today: 'text-primary',
            head_cell: 'text-muted-foreground font-bold text-sm',
            day: 'h-10 w-10 p-0 font-normal aria-selected:opacity-100',
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

function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
