export type Role = {
  id: string;
  name: string;
};

export type Funcionario = {
  id: string;
  name: string;
  roleId: string;
  avatarUrl: string;
  avatarHint: string;
  salesGoal: number;
  salesValue: number;
  salesTarget: number;
};
export type Staff = Funcionario;

export type Client = {
    id: string;
    name: string;
    whatsapp: string;
};

export type Appointment = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  client: string;
  clientWhatsapp?: string;
  serviceId: string;
  staffId: string;
};

export const initialConfirmedAppointments: Appointment[] = [];

export type PendingAppointment = {
  id: string;
  date: string;
  time: string;
  client: string;
  clientWhatsapp?: string;
  serviceId: string;
}

export type Service = {
  id: string;
  name: string;
  price: number;
  roleId: string;
  duration: number; // in minutes
};


export const initialServices: Service[] = [];
export const initialPendingAppointments: PendingAppointment[] = [];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: 'Entrada' | 'Saída';
  value: string;
  isIncome: boolean;
  appointmentId?: string; // Link to the appointment
};

export const initialTransactions: Transaction[] = [];
export const initialSaldoEmCaixa = 0;

export type Block = {
    id: string;
    staffId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
};

export type WorkSchedule = {
    id: string;
    staffId: string;
    horarios: {
        [key: string]: { start: string; end: string };
    }
};

export type AppSettings = {
    id: 'settings';
    manualSelection: boolean;
    appointmentWebhookUrl?: string;
};

export type StaffQueue = {
    id: 'staffQueue';
    staffIds: string[];
}

export const initialBlocks: Block[] = [];
export const initialWorkSchedules: WorkSchedule[] = [];
export const initialAppSettings: AppSettings = { id: 'settings', manualSelection: false };
export const initialStaffQueue: StaffQueue = { id: 'staffQueue', staffIds: [] };
