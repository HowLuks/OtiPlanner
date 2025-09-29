// src/app/api/settings/route.ts
'use server';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { z } from 'zod';

const settingsSchema = z.object({
    manualSelection: z.boolean().optional(),
    appointmentWebhookUrl: z.string().optional(),
});

const scheduleSchema = z.any(); // For simplicity

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const { type, payload } = await request.json();

    if (type === 'schedule') {
        // Upsert logic for schedule
        const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM horarios_trabalho WHERE staffId = ?", [payload.id]);
        if (rows.length > 0) {
            await connection.query("UPDATE horarios_trabalho SET horarios = ? WHERE staffId = ?", [JSON.stringify(payload.horarios), payload.staffId]);
        } else {
            await connection.query("INSERT INTO horarios_trabalho (id, staffId, horarios) VALUES (?, ?, ?)", [payload.id, payload.staffId, JSON.stringify(payload.horarios)]);
        }
        return NextResponse.json({ success: true, message: 'Horário salvo com sucesso.' });
    }

    if (type === 'settings') {
        const validation = settingsSchema.safeParse(payload);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        }
        const { manualSelection, appointmentWebhookUrl } = validation.data;
        
        const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM configuracoes WHERE id = 'settings'");
        if (rows.length > 0) {
            if (manualSelection !== undefined) {
                 await connection.query("UPDATE configuracoes SET manualSelection = ? WHERE id = 'settings'", [manualSelection]);
            }
            if (appointmentWebhookUrl !== undefined) {
                 await connection.query("UPDATE configuracoes SET webhook = ? WHERE id = 'settings'", [appointmentWebhookUrl]);
            }
        } else {
             await connection.query("INSERT INTO configuracoes (id, manualSelection, webhook) VALUES ('settings', ?, ?)", [!!manualSelection, appointmentWebhookUrl || null]);
        }
        
        return NextResponse.json({ success: true, message: 'Configuração salva com sucesso.' });
    }

    return NextResponse.json({ success: false, error: 'Tipo de requisição inválido.' }, { status: 400 });

  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
  } finally {
      connection.release();
  }
}
