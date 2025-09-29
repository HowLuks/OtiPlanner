// src/app/api/services/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Service } from '@/lib/data';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  duration: z.number().positive(),
  roleId: z.string().min(1),
});

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }
    
    const newServiceId = `s${Date.now()}`;
    const newService: Service = {
      id: newServiceId,
      ...validation.data,
    };
    
    await connection.query("INSERT INTO servicos (id, name, price, duration, roleId) VALUES (?, ?, ?, ?, ?)", 
        [newService.id, newService.name, newService.price, newService.duration, newService.roleId]);
    
    return NextResponse.json({ success: true, service: newService }, { status: 201 });
  } catch (error) {
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
            return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });
        }
        
        await connection.beginTransaction();
        
        // Delete associated appointments
        await connection.query("DELETE FROM agendamentos WHERE serviceId = ?", [id]);
        await connection.query("DELETE FROM agendamentos_pendentes WHERE serviceId = ?", [id]);

        // Delete the service itself
        await connection.query("DELETE FROM servicos WHERE id = ?", [id]);

        await connection.commit();
        
        return NextResponse.json({ success: true, message: 'Serviço e agendamentos associados foram deletados.' });

    } catch (error) {
        await connection.rollback();
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    } finally {
        connection.release();
    }
}
