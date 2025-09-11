'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, onSnapshot, doc, getDocs } from 'firebase/firestore';
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
    
    setLoading(true);

    const collections: { [key: string]: any } = {
        services: collection(db, 'services'),
        roles: collection(db, 'roles'),
        funcionarios: collection(db, 'funcionarios'),
        confirmedAppointments: collection(db, 'confirmedAppointments'),
        pendingAppointments: collection(db, 'pendingAppointments'),
        transactions: collection(db, 'transactions'),
        employeePerformance: collection(db, 'employeePerformance'),
    };
    
    const singleDocs: { [key: string]: any } = {
        saldoEmCaixa: doc(db, 'appState', 'saldoEmCaixa'),
    };

    const listenersToAttach = { ...collections, ...singleDocs };
    const totalListeners = Object.keys(listenersToAttach).length;
    let loadedCount = 0;

    const checkAllDataLoaded = () => {
        loadedCount++;
        if (loadedCount === totalListeners) {
            setLoading(false);
        }
    };
    
    const unsubscribes = Object.entries(listenersToAttach).map(([key, ref]) => 
      onSnapshot(ref, (snapshot: any) => {
        if (!snapshot.exists || (snapshot.exists && snapshot.exists())) {
            // This is a collection snapshot or a doc that exists
            if (snapshot.docs) { // Collection
                const items = snapshot.docs.map((doc: any) => doc.data());
                setData(prevData => ({ ...prevData, [key]: items }));
            } else if (snapshot.exists()) { // Single Doc
                const value = snapshot.data().value;
                setData(prevData => ({ ...prevData, [key]: value }));
            }
        }
        // For the initial load, we call checkAllDataLoaded inside the listener
        // This ensures we only stop loading after the first batch of data is received.
        // To prevent this from running on every update, we could add a flag.
        if (loading) { // A simple way to ensure it only affects the initial load
          checkAllDataLoaded();
        }
      }, (error) => {
        console.error(`Error fetching ${key}: `, error);
        // Also count errors so we don't get stuck loading
        if (loading) {
            checkAllDataLoaded();
        }
      })
    );
    
    // In case some collections are empty, onSnapshot might not fire immediately.
    // Let's pre-fetch with getDocs to ensure checkAllDataLoaded is called.
    const initialFetch = async () => {
        for (const key in listenersToAttach) {
            const ref = listenersToAttach[key];
            try {
                // We don't need the data, just the confirmation of the fetch
                if(ref.type === 'collection') {
                  await getDocs(ref);
                }
            } catch (error) {
                console.error(`Initial fetch failed for ${key}`, error);
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
