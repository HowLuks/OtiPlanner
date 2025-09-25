// src/app/api/appointments/route.ts
'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, getDoc, query, where, getDocs } from 'firebase/firestore';
import { Appointment, PendingAppointment, Service, Funcionario, Client, AppSettings, StaffQueue, Transaction } from '@/lib/data';
import { z } from 'zod';
import { getDay } from 'date-fns';

// Schemas
const appointmentSchema = z.object({
  clientName: z.string().min(1),
  clientWhatsapp: z.string().optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/),
  selectedServiceId: z.string().min(1),
  selectedStaffId: z.string().optional(),
  status: z.enum(['confirmed', 'pending']),
});

const confirmationSchema = z.object({
    pendingAppointment: z.any(),
    selectedStaffId: z.string().min(1),
});

const rejectionSchema = z.object({
    appointmentId: z.string().min(1),
});

// Helper: Upsert Client
async function upsertClient(name: string, whatsapp?: string) {
    if (!whatsapp) return;
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('whatsapp', '==', whatsapp));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0];
        if (clientDoc.data().name !== name) {
            await setDoc(doc(db, 'clients', clientDoc.id), { name }, { merge: true });
        }
    } else {
        const newClientId = `client-${Date.now()}`;
        const newClient: Client = { id: newClientId, name: name.trim(), whatsapp: whatsapp.trim() };
        await setDoc(doc(db, 'clients', newClientId), newClient);
    }
}

// Helper: Update Staff Sales
async function updateStaffSales(staffId: string, serviceId: string, operation: 'add' | 'subtract') {
    const [staffDoc, serviceDoc] = await Promise.all([
        getDoc(doc(db, 'funcionarios', staffId)),
        getDoc(doc(db, 'services', serviceId))
    ]);

    if (!staffDoc.exists() || !serviceDoc.exists()) return;
    
    const staff = staffDoc.data() as Funcionario;
    const service = serviceDoc.data() as Service;
    const price = service.price;

    const newSalesValue = operation === 'add' ? staff.salesValue + price : staff.salesValue - price;
    const newSalesGoal = staff.salesTarget > 0 ? Math.round((newSalesValue / staff.salesTarget) * 100) : 0;
    
    await setDoc(doc(db, 'funcionarios', staffId), { salesValue: newSalesValue, salesGoal: newSalesGoal }, { merge: true });
}

// Helper: Manage Transaction
async function manageTransaction(appointment: Appointment, service: Service, operation: 'add' | 'subtract') {
    const transactionId = `trans-app-${appointment.id}`;
    const transactionRef = doc(db, 'transactions', transactionId);
    const saldoRef = doc(db, 'appState', 'saldoEmCaixa');

    const batch = writeBatch(db);
    const saldoSnap = await getDoc(saldoRef);
    const saldoAtual = saldoSnap.exists() ? saldoSnap.data().value : 0;
    
    if (operation === 'add') {
        const newTransaction: Omit<Transaction, 'id'> = {
            date: appointment.date,
            description: `${service.name} - ${appointment.client}`,
            type: 'Entrada',
            value: service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            isIncome: true,
            appointmentId: appointment.id
        };
        batch.set(transactionRef, newTransaction);
        batch.set(saldoRef, { value: saldoAtual + service.price });
    } else {
        batch.delete(transactionRef);
        batch.set(saldoRef, { value: saldoAtual - service.price });
    }

    await batch.commit();
}


// POST: Create new confirmed/pending appointment
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = appointmentSchema.safeParse(body);
        if (!validation.success) return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        
        const { clientName, clientWhatsapp, appointmentDate, appointmentTime, selectedServiceId, selectedStaffId, status } = validation.data;
        
        await upsertClient(clientName, clientWhatsapp);

        if (status === 'pending') {
            const newId = `p${Date.now()}`;
            const newPending: PendingAppointment = { id: newId, date: appointmentDate, time: appointmentTime, client: clientName, clientWhatsapp, serviceId: selectedServiceId };
            await setDoc(doc(db, 'pendingAppointments', newId), newPending);
            return NextResponse.json({ success: true, appointment: newPending });
        }

        // --- Handling Confirmed Appointments ---
        if (!selectedStaffId) return NextResponse.json({ success: false, error: "Staff ID é obrigatório para agendamentos confirmados." }, { status: 400 });

        const newId = `c${Date.now()}`;
        const newConfirmed: Appointment = { id: newId, date: appointmentDate, time: appointmentTime, client: clientName, clientWhatsapp, serviceId: selectedServiceId, staffId: selectedStaffId };
        
        const serviceDoc = await getDoc(doc(db, 'services', selectedServiceId));
        if (!serviceDoc.exists()) throw new Error("Serviço não encontrado");
        const service = serviceDoc.data() as Service;

        await setDoc(doc(db, 'confirmedAppointments', newId), newConfirmed);
        await updateStaffSales(selectedStaffId, selectedServiceId, 'add');
        await manageTransaction(newConfirmed, service, 'add');

        return NextResponse.json({ success: true, appointment: newConfirmed }, { status: 201 });

    } catch (e) {
        const error = e as Error;
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


// PUT: Confirm a pending appointment
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const validation = confirmationSchema.safeParse(body);
        if (!validation.success) return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });

        const { pendingAppointment, selectedStaffId } = validation.data;

        // Create confirmed appointment
        const newConfirmedId = `c${Date.now()}`;
        const newConfirmed: Appointment = {
            id: newConfirmedId,
            date: pendingAppointment.date,
            time: pendingAppointment.time,
            client: pendingAppointment.client,
            clientWhatsapp: pendingAppointment.clientWhatsapp,
            serviceId: pendingAppointment.serviceId,
            staffId: selectedStaffId
        };
        
        const serviceDoc = await getDoc(doc(db, 'services', newConfirmed.serviceId));
        if (!serviceDoc.exists()) throw new Error("Serviço não encontrado");
        const service = serviceDoc.data() as Service;

        const batch = writeBatch(db);
        batch.set(doc(db, 'confirmedAppointments', newConfirmedId), newConfirmed);
        batch.delete(doc(db, 'pendingAppointments', pendingAppointment.id));
        await batch.commit();

        // Update sales and transaction
        await updateStaffSales(selectedStaffId, newConfirmed.serviceId, 'add');
        await manageTransaction(newConfirmed, service, 'add');

        return NextResponse.json({ success: true, appointment: newConfirmed });
    } catch (e) {
        const error = e as Error;
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


// DELETE: Reject pending or delete confirmed
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type'); // 'pending' or 'confirmed'
        
        if (!id || !type) return NextResponse.json({ success: false, error: "ID e tipo são obrigatórios" }, { status: 400 });

        if (type === 'pending') {
            await deleteDoc(doc(db, 'pendingAppointments', id));
            return NextResponse.json({ success: true, message: 'Agendamento pendente rejeitado.' });
        }

        if (type === 'confirmed') {
            const appDoc = await getDoc(doc(db, 'confirmedAppointments', id));
            if (!appDoc.exists()) return NextResponse.json({ success: false, error: "Agendamento não encontrado" }, { status: 404 });
            const appointment = appDoc.data() as Appointment;
            
            const serviceDoc = await getDoc(doc(db, 'services', appointment.serviceId));
            if (!serviceDoc.exists()) throw new Error("Serviço não encontrado para o agendamento");
            const service = serviceDoc.data() as Service;

            await deleteDoc(doc(db, "confirmedAppointments", id));
            await updateStaffSales(appointment.staffId, appointment.serviceId, 'subtract');
            await manageTransaction(appointment, service, 'subtract');

            return NextResponse.json({ success: true, message: 'Agendamento confirmado deletado.' });
        }

        return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 });
    } catch (e) {
        const error = e as Error;
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
