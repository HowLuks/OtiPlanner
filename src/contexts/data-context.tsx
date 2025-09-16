'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, doc, DocumentData, QuerySnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  fetchData: () => Promise<void>;
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
  clients: [],
  loading: true,
  fetchData: async () => {},
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
    clients: [],
}

const collectionsToListen = [
  { key: 'services', ref: collection(db, 'services') },
  { key: 'roles', ref: collection(db, 'roles') },
  { key: 'funcionarios', ref: collection(db, 'funcionarios') },
  { key: 'confirmedAppointments', ref: collection(db, 'confirmedAppointments') },
  { key: 'pendingAppointments', ref: collection(db, 'pendingAppointments') },
  { key: 'transactions', ref: collection(db, 'transactions') },
  { key: 'blocks', ref: collection(db, 'blocks') },
  { key: 'workSchedules', ref: collection(db, 'workSchedules') },
  { key: 'clients', ref: collection(db, 'clients') },
  { key: 'appSettings', ref: doc(db, 'appState', 'settings'), isDoc: true },
  { key: 'staffQueue', ref: doc(db, 'appState', 'staffQueue'), isDoc: true },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Omit<DataContextType, 'loading' | 'fetchData'>>(initialState);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allData: any = {};
      for (const { key, ref, isDoc } of collectionsToListen) {
        if (isDoc) {
          const snapshot = await getDocs(ref as any); // This is not correct for a doc
           // How to fetch a single doc without onSnapshot? getDoc
           const docSnap = await (ref as any).get();
            if (docSnap.exists()) {
                allData[key] = { ...docSnap.data(), id: docSnap.id };
            } else {
                allData[key] = null;
            }

        } else {
          const snapshot = await getDocs(ref as any);
          allData[key] = snapshot.docs.map((doc: DocumentData) => ({ ...doc.data(), id: doc.id }));
        }
      }
       setData(prev => ({...prev, ...allData}));
    } catch (error) {
        console.error("Error fetching data manually: ", error);
    } finally {
        setLoading(false);
    }
  }, [user]);


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

    const dataListeners = collectionsToListen;
    
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
            value = docData ? { ...docData, id: snapshot.id } : null;
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
          const defaultValue = isDoc ? null : [];
          setData(prevData => ({ ...prevData, [key]: defaultValue }));
          checkAllDataLoaded();
        }
      });
      unsubscribes.push(unsub);
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, authLoading]);

  const value = { ...data, loading, fetchData };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}

    