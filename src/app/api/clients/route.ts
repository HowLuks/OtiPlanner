// src/app/api/clients/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { Client } from '@/lib/data';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = clientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }

    const { name, whatsapp } = validation.data;
    const newClientId = `client-${Date.now()}`;
    const newClient: Client = {
      id: newClientId,
      name,
      whatsapp,
    };
    
    await pool.query("INSERT INTO clientes (id, name, whatsapp) VALUES (?, ?, ?)", [newClientId, name, whatsapp]);

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Check for unique constraint violation
    if (error instanceof Error && 'code' in error && error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ success: false, error: 'Este número de WhatsApp já está cadastrado.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Client ID is required' }, { status: 400 });
        }
        
        // Note: You might want to handle foreign key constraints. 
        // E.g., decide what happens to appointments of a deleted client.
        // The current database schema might not allow deletion if the client has appointments.
        await pool.query("DELETE FROM clientes WHERE id = ?", [id]);

        return NextResponse.json({ success: true, message: 'Cliente deletado com sucesso.' });
    } catch (error) {
        console.error("Erro ao deletar cliente:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    }
}
