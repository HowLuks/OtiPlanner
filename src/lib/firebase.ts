// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initialFuncionarios, initialRoles, initialServices, initialConfirmedAppointments, initialPendingAppointments, initialTransactions, initialEmployeePerformance, initialSaldoEmCaixa, initialBlocks, initialWorkSchedules } from './data';

const firebaseConfig = {
    apiKey: "AIzaSyDA2qwwoF7GELvhp4UzGeceTajJJhauYJ8",
    authDomain: "studio-6228903307-46c1c.firebaseapp.com",
    projectId: "studio-6228903307-46c1c",
    storageBucket: "studio-6228903307-46c1c.appspot.com",
    messagingSenderId: "564947118922",
    appId: "1:564947118922:web:e7bde2fab7767ee7796fb3"
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
            // console.log('Firebase data already exists. Skipping seed.');
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

        initialBlocks.forEach(block => {
            const docRef = doc(db, 'blocks', block.id);
            batch.set(docRef, block);
        });

        initialWorkSchedules.forEach(ws => {
            const docRef = doc(db, 'workSchedules', ws.id);
            batch.set(docRef, ws);
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
