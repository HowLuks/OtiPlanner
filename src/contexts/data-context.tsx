'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, onSnapshot, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { Appointment, EmployeePerformance, Funcionario, PendingAppointment, Role, Service, Transaction, Block, WorkSchedule, AppSettings } from '@/lib/data';

interface DataContextType {
  services: Service[];
  roles: Role[];
  funcionarios: Funcionario[];
  confirmedAppointments: Appointment[];
  pendingAppointments: PendingAppointment[];
  transactions: Transaction[];
  employeePerformance: EmployeePerformance[];
  blocks: Block[];
  workSchedules: WorkSchedule[];
  appSettings: AppSettings | null;
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
  employeePerformance: [],
  blocks: [],
  workSchedules: [],
  appSettings: null,
  saldoEmCaixa: 0,
  loading: true,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Omit<DataContextType, 'loading'>>({
    services: [],
    roles: [],
    funcionarios: [],
    confirmedAppointments: [],
    pendingAppointments: [],
    transactions: [],
    employeePerformance: [],
    blocks: [],
    workSchedules: [],
    appSettings: null,
    saldoEmCaixa: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setLoading(false);
      setData({
        services: [],
        roles: [],
        funcionarios: [],
        confirmedAppointments: [],
        pendingAppointments: [],
        transactions: [],
        employeePerformance: [],
        blocks: [],
        workSchedules: [],
        appSettings: null,
        saldoEmCaixa: 0,
      });
      return;
    }
    
    setLoading(true);

    const collections: { [key: string]: any } = {
        services: collection(db, 'services'),
        roles: collection(db, 'roles'),
        funcionarios: collection(db, 'funcionarios'),
        confirmedAppointments: collection(db, 'confirmedAppointments'),
        pendingAppointments: collection(db, 'pendingAppointments'),
        transactions: collection(db, 'transactions'),
        employeePerformance: collection(db, 'employeePerformance'),
        blocks: collection(db, 'blocks'),
        workSchedules: collection(db, 'workSchedules'),
    };
    
    const singleDocs: { [key: string]: any } = {
        saldoEmCaixa: doc(db, 'appState', 'saldoEmCaixa'),
        appSettings: doc(db, 'appState', 'settings'),
    };

    const listenersToAttach = { ...collections, ...singleDocs };
    const totalListeners = Object.keys(listenersToAttach).length;
    let loadedCount = 0;
    const initialLoadFlags: { [key: string]: boolean } = {};


    const checkAllDataLoaded = () => {
        loadedCount++;
        if (loadedCount >= totalListeners) {
            setLoading(false);
        }
    };
    
    const unsubscribes = Object.entries(listenersToAttach).map(([key, ref]) => 
      onSnapshot(ref, (snapshot: any) => {
        if (!snapshot.exists || (snapshot.exists && snapshot.exists())) {
            if (snapshot.docs) { // Collection
                const items = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
                setData(prevData => ({ ...prevData, [key]: items }));
            } else if (snapshot.exists()) { // Single Doc
                const docData = snapshot.data();
                const value = key === 'saldoEmCaixa' ? docData.value : { ...docData, id: snapshot.id };
                setData(prevData => ({ ...prevData, [key]: value }));
            }
        }
        if (!initialLoadFlags[key]) {
          initialLoadFlags[key] = true;
          checkAllDataLoaded();
        }
      }, (error) => {
        console.error(`Error fetching ${key}: `, error);
        if (!initialLoadFlags[key]) {
          initialLoadFlags[key] = true;
          checkAllDataLoaded();
        }
      })
    );
    
    const initialFetch = async () => {
        for (const key in listenersToAttach) {
            try {
                const ref = listenersToAttach[key];
                if (ref.type === 'collection') {
                    const snapshot = await getDocs(ref);
                     if (!initialLoadFlags[key] && snapshot.docs.length === 0) {
                        initialLoadFlags[key] = true;
                        checkAllDataLoaded();
                    }
                } else {
                     const snapshot = await getDoc(ref);
                      if (!initialLoadFlags[key] && !snapshot.exists()) {
                        initialLoadFlags[key] = true;
                        checkAllDataLoaded();
                    }
                }
            } catch (error) {
                console.error(`Initial fetch failed for ${key}`, error);
                 if (!initialLoadFlags[key]) {
                    initialLoadFlags[key] = true;
                    checkAllDataLoaded();
                }
            }
        }
    };

    initialFetch();


    // Cleanup on unmount or when user changes
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, authLoading]);

  const value = { ...data, loading };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
