// src/app/api/appointments/create-auto/route.ts
'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { collection, getDocs, query, where, doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Appointment, PendingAppointment, Service, Funcionario, Client, AppSettings, StaffQueue } from '@/lib/data';
import { getDay } from 'date-fns';
import { dayLabels } from '@/lib/constants';

// Zod schema for input validation
const autoAppointmentSchema = z.object({
  clientName: z.string().min(1, "Client name is required."),
  clientWhatsapp: z.string().min(1, "Client WhatsApp is required."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  serviceName: z.string().min(1, "Service name is required."),
});

// Helper function to find or create a client
async function findOrCreateClient(name: string, whatsapp: string): Promise<Client> {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where("whatsapp", "==", whatsapp));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Client exists
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Client;
    } else {
        // Create new client
        const newClientId = `client-${Date.now()}`;
        const newClient: Client = {
            id: newClientId,
            name: name,
            whatsapp: whatsapp,
        };
        await setDoc(doc(db, 'clients', newClientId), newClient);
        return newClient;
    }
}

// Helper to get app settings
async function getAppSettings(): Promise<AppSettings | null> {
    const settingsDoc = await getDoc(doc(db, 'appState', 'settings'));
    return settingsDoc.exists() ? settingsDoc.data() as AppSettings : null;
}

// Helper to check for conflicts
async function isTimeBlocked(staffId: string, date: string, time: string, serviceDuration: number): Promise<boolean> {
    const newAppointmentStart = new Date(`${date}T${time}`).getTime();
    const newAppointmentEnd = newAppointmentStart + serviceDuration * 60 * 1000;

    // Fetch all data needed for checks
    const [confirmedAppointmentsSnap, blocksSnap, workSchedulesSnap, servicesSnap] = await Promise.all([
        getDocs(query(collection(db, 'confirmedAppointments'), where('staffId', '==', staffId), where('date', '==', date))),
        getDocs(query(collection(db, 'blocks'), where('staffId', '==', staffId), where('date', '==', date))),
        getDocs(query(collection(db, 'workSchedules'), where('staffId', '==', staffId))),
        getDocs(collection(db, 'services'))
    ]);
    
    const services = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

    // Check confirmed appointments
    for (const doc of confirmedAppointmentsSnap.docs) {
        const existing = doc.data() as Appointment;
        const existingService = services.find(s => s.id === existing.serviceId);
        if (!existingService) continue;
        const existingStart = new Date(`${existing.date}T${existing.time}`).getTime();
        const existingEnd = existingStart + existingService.duration * 60 * 1000;
        if (newAppointmentStart < existingEnd && newAppointmentEnd > existingStart) return true;
    }

    // Check blocks
    for (const doc of blocksSnap.docs) {
        const block = doc.data();
        const blockStart = new Date(`${block.date}T${block.startTime}`).getTime();
        const blockEnd = new Date(`${block.date}T${block.endTime}`).getTime();
        if (newAppointmentStart < blockEnd && newAppointmentEnd > blockStart) return true;
    }

    // Check work schedule
    if (!workSchedulesSnap.empty) {
        const schedule = workSchedulesSnap.docs[0].data();
        const dayIndex = getDay(new Date(date));
        const dayOfWeek = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dayIndex];
        const workHours = schedule.horarios[dayOfWeek];

        if (!workHours || !workHours.start || !workHours.end) return true; // Not a working day

        const workStart = new Date(`${date}T${workHours.start}`).getTime();
        const workEnd = new Date(`${date}T${workHours.end}`).getTime();
        if (newAppointmentStart < workStart || newAppointmentEnd > workEnd) return true;
    } else {
        return true; // No schedule means no working hours
    }

    return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = autoAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }
    const { clientName, clientWhatsapp, time, date, serviceName } = validation.data;

    const client = await findOrCreateClient(clientName, clientWhatsapp);

    const servicesRef = collection(db, 'services');
    const serviceQuery = query(servicesRef, where("name", "==", serviceName));
    const serviceSnapshot = await getDocs(serviceQuery);

    if (serviceSnapshot.empty) {
        return NextResponse.json({ success: false, error: `Service '${serviceName}' not found.` }, { status: 404 });
    }
    const service = { id: serviceSnapshot.docs[0].id, ...serviceSnapshot.docs[0].data() } as Service;

    const appSettings = await getAppSettings();

    // SCENARIO 1: Manual selection is ON, create a pending appointment
    if (appSettings?.manualSelection) {
        const newId = `p${Date.now()}`;
        const newPendingAppointment: Omit<PendingAppointment, 'id'> = {
            date: date,
            client: client.name,
            clientWhatsapp: client.whatsapp,
            time: time,
            serviceId: service.id,
        };
        await setDoc(doc(db, 'pendingAppointments', newId), newPendingAppointment);
        return NextResponse.json({ success: true, status: 'pending', appointment: {id: newId, ...newPendingAppointment} }, { status: 201 });
    }

    // SCENARIO 2: Manual selection is OFF, find available staff and create confirmed appointment
    const funcionariosRef = collection(db, 'funcionarios');
    const q = query(funcionariosRef, where("roleId", "==", service.roleId));
    const qualifiedStaffSnap = await getDocs(q);
    const qualifiedStaff = qualifiedStaffSnap.docs.map(d => ({id: d.id, ...d.data()} as Funcionario));
    
    if (qualifiedStaff.length === 0) {
        return NextResponse.json({ success: false, error: "No qualified staff for this service." }, { status: 400 });
    }

    const queueDoc = await getDoc(doc(db, 'appState', 'staffQueue'));
    const staffQueue = queueDoc.exists() ? (queueDoc.data() as StaffQueue).staffIds : [];

    const staffInQueue = staffQueue.map(id => qualifiedStaff.find(s => s.id === id)).filter(Boolean) as Funcionario[];
    const staffNotInQueue = qualifiedStaff.filter(s => !staffQueue.includes(s.id));
    const potentialStaff = [...staffInQueue, ...staffNotInQueue];

    let assignedStaffId: string | null = null;
    for (const staff of potentialStaff) {
        const isBlocked = await isTimeBlocked(staff.id, date, time, service.duration);
        if (!isBlocked) {
            assignedStaffId = staff.id;
            break;
        }
    }

    // If an available staff is found, create confirmed appointment
    if (assignedStaffId) {
        const assignedStaffMember = qualifiedStaff.find(f => f.id === assignedStaffId)!;
        const newId = `c${Date.now()}`;
        const newConfirmedAppointment: Omit<Appointment, 'id'> = {
            date: date,
            client: client.name,
            clientWhatsapp: client.whatsapp,
            time: time,
            serviceId: service.id,
            staffId: assignedStaffId,
        };
        
        // Update queue
        const newQueue = staffQueue.filter(id => id !== assignedStaffId);
        newQueue.push(assignedStaffId);

        const batch = writeBatch(db);
        batch.set(doc(db, 'confirmedAppointments', newId), newConfirmedAppointment);
        batch.set(doc(db, 'appState', 'staffQueue'), { staffIds: newQueue }, { merge: true });
        
        // You might want to add transaction and sales update logic here as well
        // This is simplified to just creating the appointment
        
        await batch.commit();

        return NextResponse.json({ success: true, status: 'confirmed', appointment: {id: newId, ...newConfirmedAppointment} }, { status: 201 });
    } else {
        // Fallback: No one is available, create pending appointment
        const newId = `p${Date.now()}`;
        const newPendingAppointment: Omit<PendingAppointment, 'id'> = {
            date: date,
            client: client.name,
            clientWhatsapp: client.whatsapp,
            time: time,
            serviceId: service.id,
        };
        await setDoc(doc(db, 'pendingAppointments', newId), newPendingAppointment);
        return NextResponse.json({ success: true, status: 'pending_fallback', message: "No staff available, created pending appointment.", appointment: {id: newId, ...newPendingAppointment} }, { status: 201 });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
  }
}
