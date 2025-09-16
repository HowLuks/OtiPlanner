// src/app/api/appointments/create-manual/route.ts
'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { collection, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Appointment, Service, Funcionario, Client } from '@/lib/data';
import { getDay } from 'date-fns';

// Zod schema for input validation
const manualAppointmentSchema = z.object({
  clientName: z.string().min(1, "Client name is required."),
  clientWhatsapp: z.string().min(1, "Client WhatsApp is required."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  serviceName: z.string().min(1, "Service name is required."),
  staffId: z.string().min(1, "Staff ID is required."),
});

// Helper function to find or create a client
async function findOrCreateClient(name: string, whatsapp: string): Promise<Client> {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where("whatsapp", "==", whatsapp));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Client;
    } else {
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

// Helper function to check for conflicts, returns a reason string if blocked
async function getConflictReason(staffId: string, date: string, time: string, serviceDuration: number): Promise<string | null> {
    const newAppointmentStart = new Date(`${date}T${time}`).getTime();
    const newAppointmentEnd = newAppointmentStart + serviceDuration * 60 * 1000;

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
        if (newAppointmentStart < existingEnd && newAppointmentEnd > existingStart) return 'Staff member has a conflicting appointment.';
    }

    // Check blocks
    for (const doc of blocksSnap.docs) {
        const block = doc.data();
        const blockStart = new Date(`${block.date}T${block.startTime}`).getTime();
        const blockEnd = new Date(`${block.date}T${block.endTime}`).getTime();
        if (newAppointmentStart < blockEnd && newAppointmentEnd > blockStart) return 'Staff member has a time block at this hour.';
    }

    // Check work schedule
    if (!workSchedulesSnap.empty) {
        const schedule = workSchedulesSnap.docs[0].data();
        const dayIndex = getDay(new Date(date));
        const dayOfWeek = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dayIndex];
        const workHours = schedule.horarios[dayOfWeek];

        if (!workHours || !workHours.start || !workHours.end) return 'Staff member does not work on this day.';
        
        const workStart = new Date(`${date}T${workHours.start}`).getTime();
        const workEnd = new Date(`${date}T${workHours.end}`).getTime();
        if (newAppointmentStart < workStart || newAppointmentEnd > workEnd) return `Appointment is outside of working hours (${workHours.start} - ${workHours.end}).`;
    } else {
        return 'Staff member has no defined work schedule.';
    }

    return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = manualAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }
    const { clientName, clientWhatsapp, time, date, serviceName, staffId } = validation.data;

    // Validate staff and service exist
    const [staffDoc, serviceQuerySnap] = await Promise.all([
        getDoc(doc(db, 'funcionarios', staffId)),
        getDocs(query(collection(db, 'services'), where("name", "==", serviceName)))
    ]);

    if (!staffDoc.exists()) {
        return NextResponse.json({ success: false, error: `Staff with ID '${staffId}' not found.` }, { status: 404 });
    }
    if (serviceQuerySnap.empty) {
        return NextResponse.json({ success: false, error: `Service '${serviceName}' not found.` }, { status: 404 });
    }
    const service = { id: serviceQuerySnap.docs[0].id, ...serviceQuerySnap.docs[0].data() } as Service;
    const staff = { id: staffDoc.id, ...staffDoc.data() } as Funcionario;

    // Check if staff is qualified
    if (staff.roleId !== service.roleId) {
        return NextResponse.json({ success: false, error: `Staff '${staff.name}' is not qualified for the service '${service.name}'.` }, { status: 400 });
    }

    const conflictReason = await getConflictReason(staffId, date, time, service.duration);
    if (conflictReason) {
        return NextResponse.json({ success: false, error: `Appointment conflict: ${conflictReason}` }, { status: 409 });
    }

    const client = await findOrCreateClient(clientName, clientWhatsapp);
    
    const newId = `c${Date.now()}`;
    const newConfirmedAppointment: Omit<Appointment, 'id'> = {
        date: date,
        client: client.name,
        clientWhatsapp: client.whatsapp,
        time: time,
        serviceId: service.id,
        staffId: staffId,
    };
    
    // Here you would also add the logic to create a transaction and update sales figures
    // This is simplified to just creating the appointment document
    await setDoc(doc(db, 'confirmedAppointments', newId), newConfirmedAppointment);

    return NextResponse.json({ success: true, status: 'confirmed', appointment: {id: newId, ...newConfirmedAppointment} }, { status: 201 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
  }
}
