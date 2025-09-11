import { PlaceHolderImages } from '@/lib/placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';
const findImageHint = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageHint || '';


export type Staff = {
  id: string;
  name: string;
  avatarUrl: string;
  avatarHint: string;
};

export const initialStaff: Staff[] = [
  { id: '1', name: 'Carla', avatarUrl: findImage('staff-1'), avatarHint: findImageHint('staff-1') },
  { id: '2', name: 'Marcos', avatarUrl: findImage('staff-2'), avatarHint: findImageHint('staff-2') },
  { id: '3', name: 'Beatriz', avatarUrl: findImage('staff-3'), avatarHint: findImageHint('staff-3') },
];

export type Appointment = {
  id: string;
  time: string;
  client: string;
  service: string;
  staffId: string;
};

export const initialConfirmedAppointments: Appointment[] = [
  { id: 'c1', time: '10:00', client: 'Ana Silva', service: 'Corte de Cabelo', staffId: '1' },
  { id: 'c2', time: '14:00', client: 'Carlos Pereira', service: 'Barba', staffId: '2' },
  { id: 'c3', time: '16:00', client: 'Sofia Mendes', service: 'Manicure', staffId: '3' },
];

export type PendingAppointment = {
  id: string;
  time: string;
  client: string;
}

export const initialPendingAppointments: PendingAppointment[] = [
    { id: 'p1', client: 'João Almeida', time: '11:00' },
    { id: 'p2', client: 'Maria Santos', time: '15:00' },
    { id: 'p3', client: 'Pedro Costa', time: '17:00' },
];

export type Service = {
  id: string;
  name: string;
  price: number;
  role: string;
};

export const initialRoles: string[] = [
  'Barbeiro',
  'Cabeleireira',
  'Manicure',
  'Esteticista',
  'Recepcionista',
];

export const initialServices: Service[] = [
  { id: 's1', name: 'Corte Social', price: 30, role: 'Barbeiro' },
  { id: 's2', name: 'Corte de Cabelo Feminino', price: 60, role: 'Cabeleireira' },
  { id: 's3', name: 'Manicure Simples', price: 25, role: 'Manicure' },
  { id: 's4', name: 'Pedicure Simples', price: 30, role: 'Manicure' },
  { id: 's5', name: 'Design de Barba', price: 25, role: 'Barbeiro' },
  { id: 's6', name: 'Limpeza de Pele', price: 80, role: 'Esteticista' },
  { id: 's7', name: 'Coloração', price: 120, role: 'Cabeleireira' },
];


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
