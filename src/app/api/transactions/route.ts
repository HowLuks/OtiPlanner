// src/app/api/transactions/route.ts
'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { Transaction } from '@/lib/data';
import { z } from 'zod';

const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  description: z.string(),
  type: z.enum(['Entrada', 'Saída']),
  value: z.string(),
  isIncome: z.boolean(),
  numericValue: z.number(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = transactionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
        }
        
        const { id, numericValue, ...transactionData } = validation.data;
        const transactionId = id || `trans-${Date.now()}`;
        
        const batch = writeBatch(db);
        const transactionRef = doc(db, 'transactions', transactionId);
        const saldoRef = doc(db, 'appState', 'saldoEmCaixa');

        const saldoSnap = await getDoc(saldoRef);
        let saldoAtual = saldoSnap.exists() ? saldoSnap.data().value : 0;
        
        let newSaldo = saldoAtual;

        if (id) { // Editing existing transaction
            const originalTransactionSnap = await getDoc(transactionRef);
            if (originalTransactionSnap.exists()) {
                const originalTransaction = originalTransactionSnap.data() as Transaction;
                const originalValue = parseFloat(originalTransaction.value.replace(/[^0-9,.]/g, '').replace('.', '').replace(',', '.'));
                newSaldo -= originalTransaction.isIncome ? originalValue : -originalValue;
            }
        }
        
        newSaldo += transactionData.isIncome ? numericValue : -numericValue;
        
        batch.set(transactionRef, {id: transactionId, ...transactionData}, { merge: true });
        batch.set(saldoRef, { value: newSaldo });
        
        await batch.commit();

        return NextResponse.json({ success: true, transactionId }, { status: 201 });

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
            return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
        }
        
        const transactionRef = doc(db, 'transactions', id);
        const transactionSnap = await getDoc(transactionRef);

        if (!transactionSnap.exists()) {
            return NextResponse.json({ success: false, error: 'Transação não encontrada.' }, { status: 404 });
        }
        const transaction = transactionSnap.data() as Transaction;

        const batch = writeBatch(db);
        const saldoRef = doc(db, 'appState', 'saldoEmCaixa');
        const saldoSnap = await getDoc(saldoRef);
        const saldoAtual = saldoSnap.exists() ? saldoSnap.data().value : 0;

        const value = parseFloat(transaction.value.replace(/[^0-9,.]/g, '').replace('.', '').replace(',', '.'));
        const newSaldo = saldoAtual - (transaction.isIncome ? value : -value);

        batch.delete(transactionRef);
        batch.set(saldoRef, { value: newSaldo });
        await batch.commit();

        return NextResponse.json({ success: true, message: 'Transação deletada com sucesso.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: 'Server error: ' + errorMessage }, { status: 500 });
    }
}
