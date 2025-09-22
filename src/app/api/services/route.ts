// src/app/api/services/route.ts
'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Service } from '@/lib/data';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  duration: z.number().positive(),
  roleId: z.string().min(1),
});

export async function POST(request: Request) {
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
    
    await setDoc(doc(db, 'services', newServiceId), newService);
    
    return NextResponse.json({ success: true, service: newService }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });
        }
        
        const batch = writeBatch(db);
        const serviceRef = doc(db, 'services', id);
        batch.delete(serviceRef);

        const confirmedQuery = query(collection(db, 'confirmedAppointments'), where('serviceId', '==', id));
        const confirmedSnapshot = await getDocs(confirmedQuery);
        confirmedSnapshot.forEach(doc => batch.delete(doc.ref));

        const pendingQuery = query(collection(db, 'pendingAppointments'), where('serviceId', '==', id));
        const pendingSnapshot = await getDocs(pendingQuery);
        pendingSnapshot.forEach(doc => batch.delete(doc.ref));
        
        await batch.commit();
        
        return NextResponse.json({ success: true, message: 'Serviço e agendamentos associados foram deletados.' });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    }
}
