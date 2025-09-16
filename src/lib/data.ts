import { PlaceHolderImages } from '@/lib/placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';
const findImageHint = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageHint || '';

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

export const initialRoles: Role[] = [
  { id: 'role-1', name: 'Cabeleireiro(a)' },
  { id: 'role-2', name: 'Manicure/Pedicure' },
  { id: 'role-3', name: 'Esteticista Facial' },
  { id: 'role-4', name: 'Massoterapeuta' },
  { id: 'role-5', name: 'Depiladora' },
  { id: 'role-6', name: 'Recepcionista' },
];

export const initialFuncionarios: Funcionario[] = [
    {
      id: "func-1",
      name: "Beatriz Costa",
      roleId: "role-1",
      avatarUrl: findImage('employee-1'),
      avatarHint: findImageHint('employee-1'),
      salesGoal: 80,
      salesValue: 4800,
      salesTarget: 6000,
    },
    {
      id: "func-2",
      name: "Ricardo Neves",
      roleId: "role-4",
      avatarUrl: findImage('employee-2'),
      avatarHint: findImageHint('employee-2'),
      salesGoal: 65,
      salesValue: 3900,
      salesTarget: 6000,
    },
    {
      id: "func-3",
      name: "Patrícia Almeida",
      roleId: "role-2",
      avatarUrl: findImage('employee-3'),
      avatarHint: findImageHint('employee-3'),
      salesGoal: 95,
      salesValue: 4750,
      salesTarget: 5000,
    },
    {
      id: "func-4",
      name: "Fernanda Lima",
      roleId: "role-3",
      avatarUrl: findImage('employee-5'),
      avatarHint: findImageHint('employee-5'),
      salesGoal: 70,
      salesValue: 4900,
      salesTarget: 7000,
    },
     {
      id: "func-5",
      name: "Gustavo Martins",
      roleId: "role-1",
      avatarUrl: findImage('employee-4'),
      avatarHint: findImageHint('employee-4'),
      salesGoal: 40,
      salesValue: 2000,
      salesTarget: 5000,
    },
];


export type Appointment = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  client: string;
  serviceId: string;
  staffId: string;
};

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

export const initialConfirmedAppointments: Appointment[] = [
  { id: 'c1', date: todayStr, time: '09:00', client: 'Laura Pires', serviceId: 's2', staffId: 'func-1' },
  { id: 'c2', date: todayStr, time: '11:30', client: 'Vanessa de Sá', serviceId: 's8', staffId: 'func-2' },
  { id: 'c3', date: todayStr, time: '15:00', client: 'Anderson Luz', serviceId: 's3', staffId: 'func-3' },
];

export type PendingAppointment = {
  id: string;
  date: string;
  time: string;
  client: string;
  serviceId: string;
}

export type Service = {
  id: string;
  name: string;
  price: number;
  roleId: string;
  duration: number; // in minutes
};


export const initialServices: Service[] = [
  { id: 's1', name: 'Corte Feminino', price: 90, roleId: 'role-1', duration: 60 },
  { id: 's2', name: 'Escova Progressiva', price: 250, roleId: 'role-1', duration: 180 },
  { id: 's3', name: 'Pé e Mão (Completo)', price: 55, roleId: 'role-2', duration: 90 },
  { id: 's4', name: 'Spa dos Pés', price: 70, roleId: 'role-2', duration: 60 },
  { id: 's5', name: 'Limpeza de Pele Profunda', price: 150, roleId: 'role-3', duration: 90 },
  { id: 's6', name: 'Peeling de Diamante', price: 200, roleId: 'role-3', duration: 75 },
  { id: 's7', name: 'Massagem Relaxante', price: 120, roleId: 'role-4', duration: 60 },
  { id: 's8', name: 'Drenagem Linfática', price: 130, roleId: 'role-4', duration: 60 },
  { id: 's9', name: 'Depilação (Axila)', price: 30, roleId: 'role-5', duration: 20 },
  { id: 's10', name: 'Corte Masculino', price: 50, roleId: 'role-1', duration: 45 },
];

export const initialPendingAppointments: PendingAppointment[] = [
    { id: 'p1', date: todayStr, client: 'Mariana Rios', time: '10:00', serviceId: 's1' },
    { id: 'p2', date: todayStr, client: 'Felipe Arruda', time: '12:00', serviceId: 's10' },
    { id: 'p3', date: todayStr, client: 'Bruna Tavares', time: '16:30', serviceId: 's5' },
];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: 'Entrada' | 'Saída';
  value: string;
  isIncome: boolean;
  appointmentId?: string; // Link to the appointment
};

export const initialTransactions: Transaction[] = [
    { id: 'trans-1', date: '2024-08-01', description: 'Serviços de beleza (semana)', type: 'Entrada', value: 'R$ 3.250,00', isIncome: true },
    { id: 'trans-2', date: '2024-08-02', description: 'Compra de esmaltes e produtos', type: 'Saída', value: 'R$ 800,00', isIncome: false },
    { id: 'trans-3', date: '2024-08-03', description: 'Pagamento conta de luz', type: 'Saída', value: 'R$ 450,00', isIncome: false },
    { id: 'trans-4', date: '2024-8-05', description: 'Serviço de massoterapia', type: 'Entrada', value: 'R$ 600,00', isIncome: true },
    { id: 'trans-5', date: '2024-08-07', description: 'Pagamento de salários', type: 'Saída', value: 'R$ 6.500,00', isIncome: false },
];

export const initialSaldoEmCaixa = 23750;

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
};

export type StaffQueue = {
    id: 'staffQueue';
    staffIds: string[];
}

export const initialBlocks: Block[] = [];
export const initialWorkSchedules: WorkSchedule[] = [];
export const initialAppSettings: AppSettings = { id: 'settings', manualSelection: false };
export const initialStaffQueue: StaffQueue = { id: 'staffQueue', staffIds: ["func-1", "func-2", "func-3", "func-4", "func-5"] };
