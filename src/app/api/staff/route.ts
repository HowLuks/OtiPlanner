// src/app/api/staff/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { z } from 'zod';

const roleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome da função é obrigatório"),
});

const employeeSchema = z.object({
    id: z.string(),
    name: z.string(),
    roleId: z.string(),
    avatarUrl: z.string(),
    salesGoal: z.number(), // This is percentage
    salesValue: z.number(),
    salesTarget: z.number(),
});

const blockSchema = z.object({
    id: z.string(),
    staffId: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
});


// ROLE, EMPLOYEE, BLOCK HANDLING
export async function POST(request: Request) {
    const connection = await pool.getConnection();
    try {
        const { type, payload } = await request.json();
        
        await connection.beginTransaction();

        if (type === 'role') {
            const validation = roleSchema.safeParse(payload);
            if (!validation.success) {
                return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
            }
            const { id, name } = validation.data;
            const roleId = id || `role-${Date.now()}`;
            
            if (id) {
                 await connection.query("UPDATE funcoes SET name = ? WHERE id = ?", [name, id]);
            } else {
                 await connection.query("INSERT INTO funcoes (id, name) VALUES (?, ?)", [roleId, name]);
            }
            await connection.commit();
            return NextResponse.json({ success: true, role: { id: roleId, name } }, { status: 201 });
        }

        if (type === 'employee') {
            const validation = employeeSchema.safeParse(payload);
            if(!validation.success) {
                return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
            }
            const { id, name, roleId, avatarUrl, salesTarget } = validation.data;
            const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM funcionarios WHERE id = ?", [id]);
            if (rows.length > 0) {
                await connection.query("UPDATE funcionarios SET name = ?, roleId = ?, avatarUrl = ?, salesTarget = ? WHERE id = ?", [name, roleId, avatarUrl, salesTarget, id]);
            } else {
                 await connection.query("INSERT INTO funcionarios (id, name, roleId, avatarUrl, salesTarget, salesValue, salesGoalPercentage) VALUES (?, ?, ?, ?, ?, 0, 0)", [id, name, roleId, avatarUrl, salesTarget]);
            }
            
            await connection.commit();
            return NextResponse.json({ success: true, employee: validation.data }, { status: 201 });
        }

        if (type === 'block') {
            const validation = blockSchema.safeParse(payload);
            if (!validation.success) {
                return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
            }
            const block = validation.data;

            // Check for conflicts before saving... (simplified, a full check is complex)
            const [appointments] = await connection.query<RowDataPacket[]>("SELECT * FROM agendamentos WHERE staffId = ? AND date = ? AND time BETWEEN ? AND ?", [block.staffId, block.date, block.startTime, block.endTime]);

            if(appointments.length > 0) {
                 await connection.rollback();
                 return NextResponse.json({ success: false, error: "Conflito detectado. O funcionário já tem um agendamento neste horário." }, { status: 409 });
            }

            await connection.query("INSERT INTO folgas (id, staffId, date, startTime, endTime) VALUES (?, ?, ?, ?, ?)", [block.id, block.staffId, block.date, block.startTime, block.endTime]);
            await connection.commit();
            return NextResponse.json({ success: true, block });
        }
        
        await connection.rollback();
        return NextResponse.json({ success: false, error: 'Tipo de requisição inválido.' }, { status: 400 });
    } catch (error) {
        await connection.rollback();
        console.error("Staff API Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    } finally {
        connection.release();
    }
}


export async function DELETE(request: Request) {
    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type');

        if (!id || !type) {
            return NextResponse.json({ success: false, error: 'ID e tipo são obrigatórios' }, { status: 400 });
        }

        await connection.beginTransaction();

        if (type === 'role') {
            const [staffRows] = await connection.query<RowDataPacket[]>("SELECT id FROM funcionarios WHERE roleId = ?", [id]);
            const [serviceRows] = await connection.query<RowDataPacket[]>("SELECT id FROM servicos WHERE roleId = ?", [id]);

            if (staffRows.length > 0 || serviceRows.length > 0) {
                await connection.rollback();
                return NextResponse.json({ success: false, error: 'Função em uso por funcionários ou serviços.' }, { status: 409 });
            }
            await connection.query("DELETE FROM funcoes WHERE id = ?", [id]);
            await connection.commit();
            return NextResponse.json({ success: true, message: 'Função deletada com sucesso.' });
        }

        if (type === 'employee') {
            // Consider what to do with their appointments. Reassign? Delete? For now, we delete the employee.
            // Foreign key constraints will determine the actual behavior.
            await connection.query("DELETE FROM funcionarios WHERE id = ?", [id]);
            await connection.commit();
            return NextResponse.json({ success: true, message: 'Funcionário deletado com sucesso.' });
        }
        
        await connection.rollback();
        return NextResponse.json({ success: false, error: 'Tipo inválido.' }, { status: 400 });

    } catch (error) {
        await connection.rollback();
        console.error(`Erro ao deletar ${type}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        // Handle foreign key constraint error specifically
        if (error instanceof Error && 'code' in error && error.code === 'ER_ROW_IS_REFERENCED_2') {
            return NextResponse.json({ success: false, error: 'Não é possível deletar. Este item está sendo usado em outro lugar (ex: em agendamentos).' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    } finally {
        connection.release();
    }
}
