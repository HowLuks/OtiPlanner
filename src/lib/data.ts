import { PlaceHolderImages } from '@/lib/placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';
const findImageHint = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageHint || '';


export type Funcionario = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  avatarHint: string;
  salesGoal: number;
  salesValue: number;
  salesTarget: number;
};
export type Staff = Funcionario;

export const initialRoles: string[] = [
  'Barbeiro',
  'Cabeleireira',
  'Manicure',
  'Esteticista',
  'Recepcionista',
];

export const initialFuncionarios: Funcionario[] = [
    {
      id: "1",
      name: "Mariana Silva",
      role: "Cabeleireira",
      avatarUrl: "https://picsum.photos/seed/5/112/112",
      avatarHint: "woman portrait",
      salesGoal: 75,
      salesValue: 3750,
      salesTarget: 5000,
    },
    {
      id: "2",
      name: "Lucas Oliveira",
      role: "Barbeiro",
      avatarUrl: "https://picsum.photos/seed/6/112/112",
      avatarHint: "man portrait",
      salesGoal: 50,
      salesValue: 2000,
      salesTarget: 4000,
    },
    {
      id: "3",
      name: "Juliana Santos",
      role: "Manicure",
      avatarUrl: "https://picsum.photos/seed/7/112/112",
      avatarHint: "woman portrait",
      salesGoal: 90,
      salesValue: 5400,
      salesTarget: 6000,
    },
    {
      id: "4",
      name: "Camila Pereira",
      role: "Esteticista",
      avatarUrl: "https://picsum.photos/seed/9/112/112",
      avatarHint: "woman portrait",
      salesGoal: 80,
      salesValue: 3600,
      salesTarget: 4500,
    },
    // Staff members from old initialStaff list merged here
    {
      id: 'staff-1',
      name: 'Carla',
      avatarUrl: findImage('staff-1'),
      avatarHint: findImageHint('staff-1'),
      role: 'Cabeleireira',
      salesGoal: 0,
      salesValue: 0,
      salesTarget: 4000,
    },
    {
      id: 'staff-2',
      name: 'Marcos',
      avatarUrl: findImage('staff-2'),
      avatarHint: findImageHint('staff-2'),
      role: 'Barbeiro',
      salesGoal: 0,
      salesValue: 0,
      salesTarget: 4000,
    },
    {
      id: 'staff-3',
      name: 'Beatriz',
      avatarUrl: findImage('staff-3'),
      avatarHint: findImageHint('staff-3'),
      role: 'Manicure',
      salesGoal: 0,
      salesValue: 0,
      salesTarget: 4000,
    },
  ];


export type Appointment = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  client: string;
  service: string;
  staffId: string;
  duration: number; // in minutes
};

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

export const initialConfirmedAppointments: Appointment[] = [
  { id: 'c1', date: todayStr, time: '10:00', client: 'Ana Silva', service: 'Corte de Cabelo', staffId: 'staff-1', duration: 60 },
  { id: 'c2', date: todayStr, time: '14:00', client: 'Carlos Pereira', service: 'Barba', staffId: 'staff-2', duration: 30 },
  { id: 'c3', date: todayStr, time: '16:00', client: 'Sofia Mendes', service: 'Manicure', staffId: 'staff-3', duration: 45 },
];

export type PendingAppointment = {
  id: string;
  date: string;
  time: string;
  client: string;
  service: Service;
}

export type Service = {
  id: string;
  name: string;
  price: number;
  role: string;
  duration: number; // in minutes
};


export const initialServices: Service[] = [
  { id: 's1', name: 'Corte Social', price: 30, role: 'Barbeiro', duration: 30 },
  { id: 's2', name: 'Corte de Cabelo Feminino', price: 60, role: 'Cabeleireira', duration: 60 },
  { id: 's3', name: 'Manicure Simples', price: 25, role: 'Manicure', duration: 45 },
  { id: 's4', name: 'Pedicure Simples', price: 30, role: 'Manicure', duration: 45 },
  { id: 's5', name: 'Design de Barba', price: 25, role: 'Barbeiro', duration: 30 },
  { id: 's6', name: 'Limpeza de Pele', price: 80, role: 'Esteticista', duration: 90 },
  { id: 's7', name: 'Coloração', price: 120, role: 'Cabeleireira', duration: 120 },
];

export const initialPendingAppointments: PendingAppointment[] = [
    { id: 'p1', date: todayStr, client: 'João Almeida', time: '11:00', service: initialServices.find(s => s.id === 's1')! },
    { id: 'p2', date: todayStr, client: 'Maria Santos', time: '15:00', service: initialServices.find(s => s.id === 's3')! },
    { id: 'p3', date: todayStr, client: 'Pedro Costa', time: '17:00', service: initialServices.find(s => s.id === 's6')! },
    { id: 'p4', date: todayStr, client: 'Juliana Lima', time: '09:00', service: initialServices.find(s => s.id === 's7')! },
    { id: 'p5', date: todayStr, client: 'Ricardo Alves', time: '13:00', service: initialServices.find(s => s.id === 's5')! },
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
