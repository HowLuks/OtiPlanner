import { AppHeader } from "@/components/header";
import { CalendarView } from "@/components/calendar-view";
import { ConfirmedAppointments } from "@/components/confirmed-appointments";
import { PendingAppointments } from "@/components/pending-appointments";

export default function Home() {
  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-background">
      <AppHeader />
      <main className="flex flex-col lg:flex-row flex-1 p-6 lg:p-10 gap-8">
        <div className="flex-1 lg:w-[65%] xl:w-[70%]">
          <div className="mb-6">
            <h2 className="text-3xl font-bold font-headline">Agendamentos</h2>
            <p className="text-muted-foreground">Visualize e gerencie seus agendamentos.</p>
          </div>
          <CalendarView />
          <ConfirmedAppointments />
        </div>
        <aside className="lg:w-[35%] xl:w-[30%]">
          <PendingAppointments />
        </aside>
      </main>
    </div>
  );
}
