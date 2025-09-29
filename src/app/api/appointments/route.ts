// src/app/api/appointments/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Appointment, PendingAppointment, Service, Funcionario, Client, Transaction } from '@/lib/data';
import { z } from 'zod';

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

// Helper: Upsert Client
async function upsertClient(connection: any, name: string, whatsapp?: string) {
    if (!whatsapp) return;
    const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM clientes WHERE whatsapp = ?", [whatsapp]);
    if (rows.length > 0) {
        await connection.query("UPDATE clientes SET name = ? WHERE id = ?", [name, rows[0].id]);
    } else {
        const newClientId = `client-${Date.now()}`;
        await connection.query("INSERT INTO clientes (id, name, whatsapp) VALUES (?, ?, ?)", [newClientId, name.trim(), whatsapp.trim()]);
    }
}

// Helper: Update Staff Sales
async function updateStaffSales(connection: any, staffId: string, servicePrice: number, operation: 'add' | 'subtract') {
    const operator = operation === 'add' ? '+' : '-';
    await connection.query(`UPDATE funcionarios SET salesValue = salesValue ${operator} ? WHERE id = ?`, [servicePrice, staffId]);
    // Recalculating percentage can be done here or via a DB trigger for better performance
    const [staffRows] = await connection.query<RowDataPacket[]>("SELECT salesValue, salesTarget FROM funcionarios WHERE id = ?", [staffId]);
    const staff = staffRows[0];
    const newSalesGoal = staff.salesTarget > 0 ? Math.round((staff.salesValue / staff.salesTarget) * 100) : 0;
    await connection.query("UPDATE funcionarios SET salesGoalPercentage = ? WHERE id = ?", [newSalesGoal, staffId]);
}

// Helper: Manage Transaction
async function manageTransaction(connection: any, appointment: Appointment, service: Service, operation: 'add' | 'subtract') {
    const transactionId = `trans-app-${appointment.id}`;
    if (operation === 'add') {
        await connection.query(
            "INSERT INTO financeiro (id, data, description, valor, tipo, agendamento_id) VALUES (?, ?, ?, ?, ?, ?)",
            [transactionId, appointment.date, `${service.name} - ${appointment.client}`, service.price, 'entrada', appointment.id]
        );
    } else {
        await connection.query("DELETE FROM financeiro WHERE id = ?", [transactionId]);
    }
}

// POST: Create new confirmed/pending appointment
export async function POST(request: Request) {
    const connection = await pool.getConnection();
    try {
        const body = await request.json();
        const validation = appointmentSchema.safeParse(body);
        if (!validation.success) return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        
        const { clientName, clientWhatsapp, appointmentDate, appointmentTime, selectedServiceId, selectedStaffId, status } = validation.data;
        
        await connection.beginTransaction();
        await upsertClient(connection, clientName, clientWhatsapp);

        if (status === 'pending') {
            const newId = `p${Date.now()}`;
            const newPending: PendingAppointment = { id: newId, date: appointmentDate, time: appointmentTime, client: clientName, clientWhatsapp, serviceId: selectedServiceId };
            await connection.query("INSERT INTO agendamentos_pendentes (id, date, time, client, serviceId) VALUES (?, ?, ?, ?, ?)", 
                [newId, appointmentDate, appointmentTime, clientName, selectedServiceId]);
            await connection.commit();
            return NextResponse.json({ success: true, appointment: newPending });
        }

        // --- Handling Confirmed Appointments ---
        if (!selectedStaffId) {
            await connection.rollback();
            return NextResponse.json({ success: false, error: "Staff ID é obrigatório para agendamentos confirmados." }, { status: 400 });
        }

        const [serviceRows] = await connection.query<RowDataPacket[]>("SELECT * FROM servicos WHERE id = ?", [selectedServiceId]);
        if (serviceRows.length === 0) throw new Error("Serviço não encontrado");
        const service = serviceRows[0] as Service;

        const newId = `c${Date.now()}`;
        const newConfirmed: Appointment = { id: newId, date: appointmentDate, time: appointmentTime, client: clientName, clientWhatsapp, serviceId: selectedServiceId, staffId: selectedStaffId };
        
        await connection.query("INSERT INTO agendamentos (id, date, time, client, serviceId, staffId) VALUES (?, ?, ?, ?, ?, ?)",
            [newId, appointmentDate, appointmentTime, clientName, selectedServiceId, selectedStaffId]);
        
        await updateStaffSales(connection, selectedStaffId, service.price, 'add');
        await manageTransaction(connection, newConfirmed, service, 'add');

        await connection.commit();
        return NextResponse.json({ success: true, appointment: newConfirmed }, { status: 201 });

    } catch (e) {
        await connection.rollback();
        const error = e as Error;
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}


// PUT: Confirm a pending appointment
export async function PUT(request: Request) {
    const connection = await pool.getConnection();
    try {
        const body = await request.json();
        const validation = confirmationSchema.safeParse(body);
        if (!validation.success) return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });

        const { pendingAppointment, selectedStaffId } = validation.data;

        await connection.beginTransaction();

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
        
        const [serviceRows] = await connection.query<RowDataPacket[]>("SELECT * FROM servicos WHERE id = ?", [newConfirmed.serviceId]);
        if (serviceRows.length === 0) throw new Error("Serviço não encontrado");
        const service = serviceRows[0] as Service;

        await connection.query("INSERT INTO agendamentos (id, date, time, client, serviceId, staffId) VALUES (?, ?, ?, ?, ?, ?)",
            [newConfirmedId, newConfirmed.date, newConfirmed.time, newConfirmed.client, newConfirmed.serviceId, selectedStaffId]);
        
        await connection.query("DELETE FROM agendamentos_pendentes WHERE id = ?", [pendingAppointment.id]);
        
        await updateStaffSales(connection, selectedStaffId, service.price, 'add');
        await manageTransaction(connection, newConfirmed, service, 'add');

        await connection.commit();

        return NextResponse.json({ success: true, appointment: newConfirmed });
    } catch (e) {
        await connection.rollback();
        const error = e as Error;
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}


// DELETE: Reject pending or delete confirmed
export async function DELETE(request: Request) {
    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type');
        
        if (!id || !type) return NextResponse.json({ success: false, error: "ID e tipo são obrigatórios" }, { status: 400 });

        await connection.beginTransaction();

        if (type === 'pending') {
            await connection.query("DELETE FROM agendamentos_pendentes WHERE id = ?", [id]);
            await connection.commit();
            return NextResponse.json({ success: true, message: 'Agendamento pendente rejeitado.' });
        }

        if (type === 'confirmed') {
            const [appRows] = await connection.query<RowDataPacket[]>("SELECT * FROM agendamentos WHERE id = ?", [id]);
            if (appRows.length === 0) return NextResponse.json({ success: false, error: "Agendamento não encontrado" }, { status: 404 });
            const appointment = appRows[0] as Appointment;
            
            const [serviceRows] = await connection.query<RowDataPacket[]>("SELECT * FROM servicos WHERE id = ?", [appointment.serviceId]);
            if (serviceRows.length === 0) throw new Error("Serviço não encontrado para o agendamento");
            const service = serviceRows[0] as Service;

            await connection.query("DELETE FROM agendamentos WHERE id = ?", [id]);
            await updateStaffSales(connection, appointment.staffId, service.price, 'subtract');
            await manageTransaction(connection, appointment, service, 'subtract');

            await connection.commit();
            return NextResponse.json({ success: true, message: 'Agendamento confirmado deletado.' });
        }
        
        await connection.rollback();
        return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 });
    } catch (e) {
        await connection.rollback();
        const error = e as Error;
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}
