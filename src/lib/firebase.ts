// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initialFuncionarios, initialRoles, initialServices, initialConfirmedAppointments, initialPendingAppointments, initialTransactions, initialEmployeePerformance, initialSaldoEmCaixa } from './data';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);


// Function to seed initial data
export const seedDatabase = async () => {
    try {
        const batch = writeBatch(db);

        // Simple check if data exists by checking one collection
        const rolesCollection = collection(db, 'roles');
        const rolesSnapshot = await getDocs(rolesCollection);
        if (!rolesSnapshot.empty) {
            console.log('Firebase data already exists. Skipping seed.');
            return;
        }

        console.log('Seeding database...');

        initialRoles.forEach(role => {
            const docRef = doc(db, 'roles', role.id);
            batch.set(docRef, role);
        });

        initialFuncionarios.forEach(func => {
            const docRef = doc(db, 'funcionarios', func.id);
            batch.set(docRef, func);
        });

        initialServices.forEach(service => {
            const docRef = doc(db, 'services', service.id);
            batch.set(docRef, service);
        });

        initialConfirmedAppointments.forEach(app => {
            const docRef = doc(db, 'confirmedAppointments', app.id);
            batch.set(docRef, app);
        });
        
        initialPendingAppointments.forEach(app => {
            const docRef = doc(db, 'pendingAppointments', app.id);
            batch.set(docRef, app);
        });

        initialTransactions.forEach((t, i) => {
            const docRef = doc(db, 'transactions', `trans-${i}`);
            batch.set(docRef, t);
        });

        initialEmployeePerformance.forEach((ep, i) => {
             const docRef = doc(db, 'employeePerformance', `ep-${i}`);
            batch.set(docRef, ep);
        });

        const saldoRef = doc(db, 'appState', 'saldoEmCaixa');
        batch.set(saldoRef, { value: initialSaldoEmCaixa });

        await batch.commit();
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database: ', error);
    }
};


export { db, auth };
