// src/app/api/appsettings/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { AppSettings } from '@/lib/data';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM configuracoes WHERE id = 'settings'");
    if (rows.length > 0) {
        const settings = rows[0];
        // MySQL stores boolean as 0 or 1
        return NextResponse.json({ 
            id: 'settings',
            manualSelection: !!settings.manualSelection,
            appointmentWebhookUrl: settings.webhook
        } as AppSettings);
    }
    // Return default settings if not found in DB
    return NextResponse.json({ id: 'settings', manualSelection: false, appointmentWebhookUrl: '' });
  } catch (error) {
    console.error('Error fetching app settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Server error: ' + errorMessage }, { status: 500 });
  } finally {
    connection.release();
  }
}
