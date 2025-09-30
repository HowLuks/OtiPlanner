// src/app/api/workschedules/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { WorkSchedule } from '@/lib/data';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM carga_horaria");
    
    const schedules = rows.map(row => {
        try {
            // Horarios might be stored as a JSON string
            const horarios = typeof row.horarios === 'string' ? JSON.parse(row.horarios) : row.horarios;
            return { ...row, horarios };
        } catch (e) {
            console.error(`Failed to parse horarios for staffId ${row.staffId}:`, row.horarios);
            return { ...row, horarios: {} }; // Return empty schedule on parse error
        }
    });
    
    return NextResponse.json(schedules as WorkSchedule[]);
  } catch (error) {
    console.error('Error fetching work schedules:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server error: ' + errorMessage }, { status: 500 });
  } finally {
    connection.release();
  }
}
