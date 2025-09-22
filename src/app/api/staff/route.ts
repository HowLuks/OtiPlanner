// src/app/api/staff/route.ts
'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { Role, Funcionario, Block, Service, Appointment } from '@/lib/data';
import { z } from 'zod';

const roleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome da função é obrigatório"),
});

const employeeSchema = z.object({
    id: z.string(),
    name: z.string(),
    roleId: z.string(),
    avatarUrl: z.string(),
    avatarHint: z.string(),
    salesGoal: z.number(),
    salesValue: z.number(),
    salesTarget: z.number(),
});

const blockSchema = z.object({
    id: z.string(),
    staffId: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
});


// ROLE HANDLING
export async function POST(request: Request) {
    const { type, payload } = await request.json();

    if (type === 'role') {
        const validation = roleSchema.safeParse(payload);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        }
        const { id, name } = validation.data;
        const roleId = id || `role-${Date.now()}`;
        const roleRef = doc(db, 'roles', roleId);
        await setDoc(roleRef, { id: roleId, name }, { merge: true });
        return NextResponse.json({ success: true, role: { id: roleId, name } }, { status: 201 });
    }

    if (type === 'employee') {
        const validation = employeeSchema.safeParse(payload);
        if(!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        }
        const employeeRef = doc(db, 'funcionarios', validation.data.id);
        await setDoc(employeeRef, validation.data, { merge: true });
        return NextResponse.json({ success: true, employee: validation.data }, { status: 201 });
    }

     if (type === 'block') {
        const validation = blockSchema.safeParse(payload);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        }
        const block = validation.data;

        // Check for conflicts before saving
        const blockStart = new Date(`${block.date}T${block.startTime}`).getTime();
        const blockEnd = new Date(`${block.date}T${block.endTime}`).getTime();

        const appointmentsQuery = query(collection(db, 'confirmedAppointments'), where('staffId', '==', block.staffId), where('date', '==', block.date));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

        const hasConflict = appointmentsSnapshot.docs.some(doc => {
            const app = doc.data() as Appointment;
            const service = services.find(s => s.id === app.serviceId);
            if (!service) return false;

            const appStart = new Date(`${app.date}T${app.time}`).getTime();
            const appEnd = appStart + service.duration * 60 * 1000;
            return (blockStart < appEnd && blockEnd > appStart);
        });
        
        if(hasConflict) {
            return NextResponse.json({ success: false, error: "Conflito detectado. O funcionário já tem um agendamento neste horário." }, { status: 409 });
        }

        await setDoc(doc(db, 'blocks', block.id), block);
        return NextResponse.json({ success: true, block });
    }
    
    return NextResponse.json({ success: false, error: 'Tipo de requisição inválido.' }, { status: 400 });
}


export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
        return NextResponse.json({ success: false, error: 'ID e tipo são obrigatórios' }, { status: 400 });
    }

    try {
        if (type === 'role') {
            const staffQuery = query(collection(db, 'funcionarios'), where('roleId', '==', id));
            const servicesQuery = query(collection(db, 'services'), where('roleId', '==', id));
            const [staffSnapshot, servicesSnapshot] = await Promise.all([getDocs(staffQuery), getDocs(servicesQuery)]);

            if (!staffSnapshot.empty || !servicesSnapshot.empty) {
                return NextResponse.json({ success: false, error: 'Função em uso por funcionários ou serviços.' }, { status: 409 });
            }
            await deleteDoc(doc(db, 'roles', id));
            return NextResponse.json({ success: true, message: 'Função deletada com sucesso.' });
        }

        if (type === 'employee') {
            await deleteDoc(doc(db, 'funcionarios', id));
            return NextResponse.json({ success: true, message: 'Funcionário deletado com sucesso.' });
        }

        return NextResponse.json({ success: false, error: 'Tipo inválido.' }, { status: 400 });

    } catch (error) {
        console.error(`Erro ao deletar ${type}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    }
}
