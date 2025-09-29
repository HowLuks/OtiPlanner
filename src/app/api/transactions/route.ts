// src/app/api/transactions/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Transaction } from '@/lib/data';
import { z } from 'zod';

const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  description: z.string(),
  type: z.enum(['Entrada', 'Saída']),
  value: z.string(), // The formatted string e.g., "R$ 150,00"
  isIncome: z.boolean(),
  numericValue: z.number(), // The actual number
});

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM financeiro");
     const transactions = rows.map(row => ({
        id: row.id,
        date: new Date(row.data).toISOString().split('T')[0], // Format date
        description: row.description,
        type: row.tipo === 'entrada' ? 'Entrada' : 'Saída',
        value: `R$ ${parseFloat(row.valor).toFixed(2).replace('.', ',')}`,
        isIncome: row.tipo === 'entrada',
        appointmentId: row.agendamento_id,
    }));
    return NextResponse.json(transactions as Transaction[]);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server error: ' + errorMessage }, { status: 500 });
  } finally {
    connection.release();
  }
}


export async function POST(request: Request) {
    const connection = await pool.getConnection();
    try {
        const body = await request.json();
        const validation = transactionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        }
        
        const { id, date, description, type, numericValue } = validation.data;
        const transactionId = id || `trans-${Date.now()}`;
        
        await connection.beginTransaction();

        if (id) { // Editing existing transaction
            await connection.query("UPDATE financeiro SET data = ?, description = ?, valor = ?, tipo = ? WHERE id = ?", 
                [date, description, numericValue, type === 'Entrada' ? 'entrada' : 'saida', id]);
        } else { // Creating new transaction
            await connection.query("INSERT INTO financeiro (id, data, description, valor, tipo) VALUES (?, ?, ?, ?, ?)", 
                [transactionId, date, description, numericValue, type === 'Entrada' ? 'entrada' : 'saida']);
        }
        
        await connection.commit();

        return NextResponse.json({ success: true, transactionId }, { status: 201 });

    } catch (error) {
        await connection.rollback();
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

        if (!id) {
            return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
        }
        
        // We now allow deleting any transaction, as requested.
        await connection.query("DELETE FROM financeiro WHERE id = ?", [id]);

        return NextResponse.json({ success: true, message: 'Transação deletada com sucesso.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    } finally {
        connection.release();
    }
}
