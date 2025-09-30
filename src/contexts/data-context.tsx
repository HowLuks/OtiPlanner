'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import { Appointment, Funcionario, PendingAppointment, Role, Service, Transaction, Block, WorkSchedule, AppSettings, StaffQueue, Client } from '@/lib/data';

interface DataContextType {
  services: Service[];
  roles: Role[];
  funcionarios: Funcionario[];
  confirmedAppointments: Appointment[];
  pendingAppointments: PendingAppointment[];
  transactions: Transaction[];
  blocks: Block[];
  workSchedules: WorkSchedule[];
  appSettings: AppSettings | null;
  staffQueue: StaffQueue | null;
  clients: Client[];
  loading: boolean;
  fetchData: () => void;
}

const initialState: Omit<DataContextType, 'loading' | 'fetchData'> = {
  services: [],
  roles: [],
  funcionarios: [],
  confirmedAppointments: [],
  pendingAppointments: [],
  transactions: [],
  blocks: [],
  workSchedules: [],
  appSettings: null,
  staffQueue: null,
  clients: [],
};

const DataContext = createContext<DataContextType>({
  ...initialState,
  loading: true,
  fetchData: () => {},
});

const API_ENDPOINTS = [
    'services', 'roles', 'funcionarios', 'confirmedAppointments', 
    'agendamentos_pendentes', 'transactions', 'blocks', 'workSchedules', 
    'clients', 'appSettings', 'staffQueue'
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Omit<DataContextType, 'loading' | 'fetchData'>>(initialState);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
        setData(initialState);
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const responses = await Promise.all(
          API_ENDPOINTS.map(endpoint => 
              fetch(`/api/${endpoint.toLowerCase()}`).then(res => res.json())
          )
      );
      
      const fetchedData = API_ENDPOINTS.reduce((acc, endpoint, index) => {
        let key = endpoint;
        if (key === 'agendamentos_pendentes') key = 'pendingAppointments';
        if (key === 'confirmedAppointments') key = 'confirmedAppointments';
        
        acc[key as keyof typeof initialState] = responses[index].data || responses[index] || (initialState[key as keyof typeof initialState] === null ? null : []);
        return acc;
      }, {} as any);

      setData(fetchedData);

    } catch (error) {
      console.error("Failed to fetch data:", error);
      setData(initialState);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
        fetchData();
    }
  }, [user, authLoading, fetchData]);

  const value = { ...data, loading, fetchData };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
