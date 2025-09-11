import { PlaceHolderImages } from '@/lib/placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';
const findImageHint = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageHint || '';


export type Staff = {
  id: string;
  name: string;
  avatarUrl: string;
  avatarHint: string;
};

export const staff: Staff[] = [
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

export const confirmedAppointments: Appointment[] = [
  { id: 'c1', time: '10:00', client: 'Ana Silva', service: 'Corte de Cabelo', staffId: '1' },
  { id: 'c2', time: '14:00', client: 'Carlos Pereira', service: 'Barba', staffId: '2' },
  { id: 'c3', time: '16:00', client: 'Sofia Mendes', service: 'Manicure', staffId: '3' },
];

export type PendingAppointment = {
  id: string;
  time: string;
  client: string;
}

export const pendingAppointments: PendingAppointment[] = [
    { id: 'p1', client: 'João Almeida', time: '11:00' },
    { id: 'p2', client: 'Maria Santos', time: '15:00' },
    { id: 'p3', client: 'Pedro Costa', time: '17:00' },
];
