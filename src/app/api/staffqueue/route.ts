// src/app/api/staffqueue/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { StaffQueue } from '@/lib/data';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    // This data might be managed differently in a SQL database.
    // For now, we'll simulate it by returning a default queue based on existing staff.
    const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM funcionarios ORDER BY name ASC");
    const staffIds = rows.map(r => r.id);
    const staffQueue: StaffQueue = {
        id: 'staffQueue',
        staffIds: staffIds
    };
    return NextResponse.json(staffQueue);
  } catch (error) {
    console.error('Error fetching staff queue:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server error: ' + errorMessage }, { status: 500 });
  } finally {
    connection.release();
  }
}
