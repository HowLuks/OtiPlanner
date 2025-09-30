// src/app/api/appointments/create-auto/route.ts
'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Appointment, PendingAppointment, Service, Funcionario, Client, AppSettings, StaffQueue } from '@/lib/data';

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
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM clientes WHERE whatsapp = ?", [whatsapp]);
        if (rows.length > 0) {
            return rows[0] as Client;
        } else {
            const newClientId = `client-${Date.now()}`;
            await connection.query("INSERT INTO clientes (id, name, whatsapp) VALUES (?, ?, ?)", [newClientId, name, whatsapp]);
            return { id: newClientId, name, whatsapp } as Client;
        }
    } finally {
        connection.release();
    }
}

// Helper to get app settings
async function getAppSettings(): Promise<AppSettings | null> {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM configuracoes WHERE id = 'settings'");
        return rows.length > 0 ? { ...rows[0], id: 'settings' } as AppSettings : null;
    } finally {
        connection.release();
    }
}

// Helper to check for conflicts
async function isTimeBlocked(staffId: string, date: string, time: string, serviceDuration: number): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
        const newAppointmentStart = new Date(`${date}T${time}`).getTime();
        const newAppointmentEnd = newAppointmentStart + serviceDuration * 60 * 1000;

        // Check confirmed appointments
        const [appointments] = await connection.query<RowDataPacket[]>(
            "SELECT a.*, s.duration FROM agendamentos a JOIN servicos s ON a.serviceId = s.id WHERE a.staffId = ? AND a.date = ?",
            [staffId, date]
        );
        for (const app of appointments) {
            const existingStart = new Date(`${app.date}T${app.time}`).getTime();
            const existingEnd = existingStart + app.duration * 60 * 1000;
            if (newAppointmentStart < existingEnd && newAppointmentEnd > existingStart) return true;
        }

        // Check blocks
        const [blocks] = await connection.query<RowDataPacket[]>("SELECT * FROM folgas WHERE staffId = ? AND date = ?", [staffId, date]);
        for (const block of blocks) {
            const blockStart = new Date(`${block.date}T${block.startTime}`).getTime();
            const blockEnd = new Date(`${block.date}T${block.endTime}`).getTime();
            if (newAppointmentStart < blockEnd && newAppointmentEnd > blockStart) return true;
        }

        // Check work schedule
        const [schedules] = await connection.query<RowDataPacket[]>("SELECT * FROM carga_horaria WHERE staffId = ?", [staffId]);
        if (schedules.length > 0) {
            const schedule = schedules[0];
            const horarios = typeof schedule.horarios === 'string' ? JSON.parse(schedule.horarios) : schedule.horarios;
            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const workHours = horarios[dayOfWeek];
            if (!workHours || !workHours.start || !workHours.end) return true; // Not a working day
            
            const workStart = new Date(`${date}T${workHours.start}`).getTime();
            const workEnd = new Date(`${date}T${workHours.end}`).getTime();
            if (newAppointmentStart < workStart || newAppointmentEnd > workEnd) return true;
        } else {
            return true; // No schedule
        }

        return false;
    } finally {
        connection.release();
    }
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const validation = autoAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }
    const { clientName, clientWhatsapp, time, date, serviceName } = validation.data;

    const client = await findOrCreateClient(clientName, clientWhatsapp);

    const [serviceRows] = await connection.query<RowDataPacket[]>("SELECT * FROM servicos WHERE name = ?", [serviceName]);
    if (serviceRows.length === 0) {
        return NextResponse.json({ success: false, error: `Service '${serviceName}' not found.` }, { status: 404 });
    }
    const service = serviceRows[0] as Service;

    const appSettings = await getAppSettings();
    
    await connection.beginTransaction();

    if (appSettings?.manualSelection) {
        const newId = `p${Date.now()}`;
        const newPendingAppointment = { date, client: client.name, time, serviceId: service.id };
        await connection.query("INSERT INTO agendamentos_pendentes (id, date, client, time, serviceId) VALUES (?, ?, ?, ?, ?)", [newId, date, client.name, time, service.id]);
        await connection.commit();
        return NextResponse.json({ success: true, status: 'pending', appointment: { id: newId, ...newPendingAppointment } }, { status: 201 });
    }

    const [qualifiedStaff] = await connection.query<RowDataPacket[]>("SELECT * FROM funcionarios WHERE roleId = ?", [service.roleId]);
    if (qualifiedStaff.length === 0) {
        return NextResponse.json({ success: false, error: "No qualified staff for this service." }, { status: 400 });
    }

    // This is a simplification; a real implementation would need a more robust queue/rotation logic, maybe in a dedicated table.
    let assignedStaffId: string | null = null;
    for (const staff of qualifiedStaff as Funcionario[]) {
        const isBlocked = await isTimeBlocked(staff.id, date, time, service.duration);
        if (!isBlocked) {
            assignedStaffId = staff.id;
            break;
        }
    }

    if (assignedStaffId) {
        const newId = `c${Date.now()}`;
        const newConfirmedAppointment = { date, client: client.name, time, serviceId: service.id, staffId: assignedStaffId };
        await connection.query("INSERT INTO agendamentos (id, date, client, time, serviceId, staffId) VALUES (?, ?, ?, ?, ?, ?)", [newId, date, client.name, time, service.id, assignedStaffId]);
        
        // Transaction logic would go here
        
        await connection.commit();
        return NextResponse.json({ success: true, status: 'confirmed', appointment: { id: newId, ...newConfirmedAppointment } }, { status: 201 });
    } else {
        const newId = `p${Date.now()}`;
        const newPendingAppointment = { date, client: client.name, time, serviceId: service.id };
        await connection.query("INSERT INTO agendamentos_pendentes (id, date, client, time, serviceId) VALUES (?, ?, ?, ?, ?)", [newId, date, client.name, time, service.id]);
        await connection.commit();
        return NextResponse.json({ success: true, status: 'pending_fallback', message: "No staff available, created pending appointment.", appointment: { id: newId, ...newPendingAppointment } }, { status: 201 });
    }

  } catch (error) {
    await connection.rollback();
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
  } finally {
      connection.release();
  }
}
  
