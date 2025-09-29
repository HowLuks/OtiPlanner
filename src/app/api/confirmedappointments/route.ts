// src/app/api/confirmedappointments/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { Appointment } from '@/lib/data';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM agendamentos");
    return NextResponse.json(rows as Appointment[]);
  } catch (error) {
    console.error('Error fetching confirmed appointments:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server error: ' + errorMessage }, { status: 500 });
  } finally {
    connection.release();
  }
}
