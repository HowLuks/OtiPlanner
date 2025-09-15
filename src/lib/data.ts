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
  { id: 'role-1', name: 'Barbeiro' },
  { id: 'role-2', name: 'Cabeleireira' },
  { id: 'role-3', name: 'Manicure' },
  { id: 'role-4', name: 'Esteticista' },
  { id: 'role-5', name: 'Recepcionista' },
];

export const initialFuncionarios: Funcionario[] = [
    {
      id: "func-1",
      name: "Mariana Silva",
      roleId: "role-2",
      avatarUrl: findImage('employee-1'),
      avatarHint: findImageHint('employee-1'),
      salesGoal: 75,
      salesValue: 3750,
      salesTarget: 5000,
    },
    {
      id: "func-2",
      name: "Lucas Oliveira",
      roleId: "role-1",
      avatarUrl: findImage('employee-2'),
      avatarHint: findImageHint('employee-2'),
      salesGoal: 50,
      salesValue: 2000,
      salesTarget: 4000,
    },
    {
      id: "func-3",
      name: "Juliana Santos",
      roleId: "role-3",
      avatarUrl: findImage('employee-3'),
      avatarHint: findImageHint('employee-3'),
      salesGoal: 90,
      salesValue: 5400,
      salesTarget: 6000,
    },
    {
      id: "func-4",
      name: "Camila Pereira",
      roleId: "role-4",
      avatarUrl: findImage('employee-5'),
      avatarHint: findImageHint('employee-5'),
      salesGoal: 80,
      salesValue: 3600,
      salesTarget: 4500,
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
  { id: 'c1', date: todayStr, time: '10:00', client: 'Ana Silva', serviceId: 's2', staffId: 'func-1' },
  { id: 'c2', date: todayStr, time: '14:00', client: 'Carlos Pereira', serviceId: 's5', staffId: 'func-2' },
  { id: 'c3', date: todayStr, time: '16:00', client: 'Sofia Mendes', serviceId: 's3', staffId: 'func-3' },
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
  { id: 's1', name: 'Corte Social', price: 30, roleId: 'role-1', duration: 30 },
  { id: 's2', name: 'Corte de Cabelo Feminino', price: 60, roleId: 'role-2', duration: 60 },
  { id: 's3', name: 'Manicure Simples', price: 25, roleId: 'role-3', duration: 45 },
  { id: 's4', name: 'Pedicure Simples', price: 30, roleId: 'role-3', duration: 45 },
  { id: 's5', name: 'Design de Barba', price: 25, roleId: 'role-1', duration: 30 },
  { id: 's6', name: 'Limpeza de Pele', price: 80, roleId: 'role-4', duration: 90 },
  { id: 's7', name: 'Coloração', price: 120, roleId: 'role-2', duration: 120 },
];

export const initialPendingAppointments: PendingAppointment[] = [
    { id: 'p1', date: todayStr, client: 'João Almeida', time: '11:00', serviceId: 's1' },
    { id: 'p2', date: todayStr, client: 'Maria Santos', time: '15:00', serviceId: 's3' },
    { id: 'p3', date: todayStr, client: 'Pedro Costa', time: '17:00', serviceId: 's6' },
    { id: 'p4', date: todayStr, client: 'Juliana Lima', time: '09:00', serviceId: 's7' },
    { id: 'p5', date: todayStr, client: 'Ricardo Alves', time: '13:00', serviceId: 's5' },
];

export type Transaction = {
  date: string;
  description: string;
  type: 'Entrada' | 'Saída';
  value: string;
  isIncome: boolean;
};

export const initialTransactions: Transaction[] = [
    { date: '15/07/2024', description: 'Pagamento de cliente - Projeto Web', type: 'Entrada', value: 'R$ 2.500,00', isIncome: true },
    { date: '18/07/2024', description: 'Aluguel do espaço', type: 'Saída', value: 'R$ 1.500,00', isIncome: false },
    { date: '20/07/2024', description: 'Compra de materiais de escritório', type: 'Saída', value: 'R$ 300,00', isIncome: false },
    { date: '22/07/2024', description: 'Pagamento de cliente - Consultoria', type: 'Entrada', value: 'R$ 1.800,00', isIncome: true },
    { date: '25/07/2024', description: 'Salário - Funcionário 1', type: 'Saída', value: 'R$ 2.000,00', isIncome: false },
];

export type EmployeePerformance = {
  name: string;
  income: string;
};

export const initialEmployeePerformance: EmployeePerformance[] = [
    { name: 'Funcionário 1', income: 'R$ 3.500,00' },
    { name: 'Funcionário 2', income: 'R$ 2.800,00' },
    { name: 'Funcionário 3', income: 'R$ 4.200,00' },
];

export const initialSaldoEmCaixa = 12500;

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

export const initialBlocks: Block[] = [];
export const initialWorkSchedules: WorkSchedule[] = [];
export const initialAppSettings: AppSettings = { id: 'settings', manualSelection: false };
