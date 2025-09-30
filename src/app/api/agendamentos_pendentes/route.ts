// src/app/api/agendamentos_pendentes/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { PendingAppointment } from '@/lib/data';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM agendamentos_pendentes");
    return NextResponse.json(rows as PendingAppointment[]);
  } catch (error) {
    console.error('Error fetching pending appointments:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server error: ' + errorMessage }, { status: 500 });
  } finally {
    connection.release();
  }
}
