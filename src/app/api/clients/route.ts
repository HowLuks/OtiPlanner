// src/app/api/clients/route.ts
'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
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

    await setDoc(doc(db, 'clients', newClientId), newClient);

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
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

        await deleteDoc(doc(db, 'clients', id));

        return NextResponse.json({ success: true, message: 'Cliente deletado com sucesso.' });
    } catch (error) {
        console.error("Erro ao deletar cliente:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    }
}
