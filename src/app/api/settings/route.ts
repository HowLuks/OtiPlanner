// src/app/api/settings/route.ts
'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';

const settingsSchema = z.object({
    manualSelection: z.boolean().optional(),
    appointmentWebhookUrl: z.string().optional(),
});

const scheduleSchema = z.any(); // For simplicity, not strictly validating schedule structure

export async function POST(request: Request) {
  try {
    const { type, payload } = await request.json();

    if (type === 'schedule') {
        const scheduleRef = doc(db, 'workSchedules', payload.id);
        await setDoc(scheduleRef, payload, { merge: true });
        return NextResponse.json({ success: true, message: 'Horário salvo com sucesso.' });
    }

    if (type === 'settings') {
        const validation = settingsSchema.safeParse(payload);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        }
        const settingsRef = doc(db, 'appState', 'settings');
        await setDoc(settingsRef, validation.data, { merge: true });
        return NextResponse.json({ success: true, message: 'Configuração salva com sucesso.' });
    }

    return NextResponse.json({ success: false, error: 'Tipo de requisição inválido.' }, { status: 400 });

  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
  }
}
