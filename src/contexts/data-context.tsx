'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { Appointment, EmployeePerformance, Funcionario, PendingAppointment, Role, Service, Transaction } from '@/lib/data';

interface DataContextType {
  services: Service[];
  roles: Role[];
  funcionarios: Funcionario[];
  confirmedAppointments: Appointment[];
  pendingAppointments: PendingAppointment[];
  transactions: Transaction[];
  employeePerformance: EmployeePerformance[];
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
    saldoEmCaixa: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
        setLoading(true);
        return;
    }

    if (!user) {
        // If no user, stop loading and clear data
        setLoading(false);
        setData({
            services: [],
            roles: [],
            funcionarios: [],
            confirmedAppointments: [],
            pendingAppointments: [],
            transactions: [],
            employeePerformance: [],
            saldoEmCaixa: 0,
        });
        return;
    }

    const collections = {
        services: collection(db, 'services'),
        roles: collection(db, 'roles'),
        funcionarios: collection(db, 'funcionarios'),
        confirmedAppointments: collection(db, 'confirmedAppointments'),
        pendingAppointments: collection(db, 'pendingAppointments'),
        transactions: collection(db, 'transactions'),
        employeePerformance: collection(db, 'employeePerformance'),
    };
    
    const singleDocs = {
        saldoEmCaixa: doc(db, 'appState', 'saldoEmCaixa'),
    };
    
    // Create listeners for all collections
    const unsubscribes = Object.entries(collections).map(([key, ref]) => 
      onSnapshot(ref, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data());
        setData(prevData => ({ ...prevData, [key]: items }));
      })
    );

    // Create listeners for all single documents
    const unsubscribesDocs = Object.entries(singleDocs).map(([key, ref]) =>
        onSnapshot(ref, (doc) => {
            if(doc.exists()) {
                const value = doc.data().value;
                setData(prevData => ({ ...prevData, [key]: value }));
            }
        })
    );
    
    // Combine all unsubscribers
    const allUnsubscribes = [...unsubscribes, ...unsubscribesDocs];

    // Set loading to false once initial listeners are set up
    // A more robust solution might wait for the first snapshot of each
    setLoading(false);

    // Cleanup on unmount or when user changes
    return () => allUnsubscribes.forEach(unsub => unsub());
  }, [user, authLoading]);

  const value = { ...data, loading };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
