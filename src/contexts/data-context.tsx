'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, onSnapshot, doc, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { Appointment, Funcionario, PendingAppointment, Role, Service, Transaction, Block, WorkSchedule, AppSettings, StaffQueue } from '@/lib/data';

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
  saldoEmCaixa: number;
  loading: boolean;
}

const DataContext = createContext<DataContextType>({
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
  saldoEmCaixa: 0,
  loading: true,
});

const initialState = {
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
    saldoEmCaixa: 0,
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Omit<DataContextType, 'loading'>>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setLoading(false);
      setData(initialState);
      return;
    }
    
    setLoading(true);

    const dataListeners = [
      { key: 'services', ref: collection(db, 'services') },
      { key: 'roles', ref: collection(db, 'roles') },
      { key: 'funcionarios', ref: collection(db, 'funcionarios') },
      { key: 'confirmedAppointments', ref: collection(db, 'confirmedAppointments') },
      { key: 'pendingAppointments', ref: collection(db, 'pendingAppointments') },
      { key: 'transactions', ref: collection(db, 'transactions') },
      { key: 'blocks', ref: collection(db, 'blocks') },
      { key: 'workSchedules', ref: collection(db, 'workSchedules') },
      { key: 'appSettings', ref: doc(db, 'appState', 'settings'), isDoc: true },
      { key: 'staffQueue', ref: doc(db, 'appState', 'staffQueue'), isDoc: true },
      { key: 'saldoEmCaixa', ref: doc(db, 'appState', 'saldoEmCaixa'), isDoc: true },
    ];
    
    let loadedCount = 0;
    const initialLoadFlags: { [key: string]: boolean } = {};
    const unsubscribes: (() => void)[] = [];

    const checkAllDataLoaded = () => {
        loadedCount++;
        if (loadedCount >= dataListeners.length) {
            setLoading(false);
        }
    };
    
    dataListeners.forEach(({ key, ref, isDoc }) => {
      const unsub = onSnapshot(ref as any, (snapshot: DocumentData | QuerySnapshot) => {
        let value: any;
        if(isDoc) {
           const docData = snapshot.data();
            if (key === 'saldoEmCaixa') {
                value = docData?.value || 0;
            } else {
                value = docData ? { ...docData, id: snapshot.id } : null;
            }
        } else {
            value = snapshot.docs.map((doc: DocumentData) => ({ ...doc.data(), id: doc.id }));
        }

        setData(prevData => ({ ...prevData, [key]: value }));

        if (!initialLoadFlags[key]) {
          initialLoadFlags[key] = true;
          checkAllDataLoaded();
        }
      }, (error) => {
        console.error(`Error fetching ${key}: `, error);
        if (!initialLoadFlags[key]) {
          initialLoadFlags[key] = true;
          const defaultValue = isDoc ? (key === 'saldoEmCaixa' ? 0 : null) : [];
          setData(prevData => ({ ...prevData, [key]: defaultValue }));
          checkAllDataLoaded();
        }
      });
      unsubscribes.push(unsub);
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, authLoading]);

  const value = { ...data, loading };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}

