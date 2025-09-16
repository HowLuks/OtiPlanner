'use server';

import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Funcionario, Service, Transaction, Appointment } from '@/lib/data';

/**
 * Updates the sales value and goal percentage for a given staff member.
 * @param staffMember The staff member to update.
 * @param service The service that was added or removed.
 * @param operation 'add' to increase sales, 'subtract' to decrease.
 */
export async function updateStaffSales(
  staffMember: Funcionario,
  service: Service,
  operation: 'add' | 'subtract'
) {
  if (!service || !staffMember) return;

  const price = service.price;
  
  const newSalesValue = operation === 'add'
    ? staffMember.salesValue + price
    : staffMember.salesValue - price;

  const newSalesGoal = staffMember.salesTarget > 0
    ? Math.round((newSalesValue / staffMember.salesTarget) * 100)
    : 0;

  const updatedFunc = { 
      ...staffMember, 
      salesValue: newSalesValue, 
      salesGoal: newSalesGoal 
  };

  const funcDocRef = doc(db, 'funcionarios', staffMember.id);
  await setDoc(funcDocRef, updatedFunc, { merge: true });
}

export async function createTransactionForAppointment(
    appointment: Appointment,
    service: Service,
    staff: Funcionario,
    saldoAtual: number
) {
    const transactionId = `trans-app-${appointment.id}`;
    const formattedDate = new Date(`${appointment.date}T00:00:00`).toLocaleDateString('pt-BR', {timeZone: 'UTC'});

    const newTransaction: Omit<Transaction, 'id'> = {
        date: appointment.date,
        description: `${service.name} - ${staff.name} - ${formattedDate}`,
        type: 'Entrada',
        value: service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        isIncome: true,
        appointmentId: appointment.id
    };

    const newSaldo = saldoAtual + service.price;

    const batch = writeBatch(db);
    batch.set(doc(db, 'transactions', transactionId), newTransaction);
    batch.set(doc(db, 'appState', 'saldoEmCaixa'), { value: newSaldo });

    await batch.commit();
}


export async function deleteTransactionForAppointment(
    appointmentId: string,
    servicePrice: number,
    saldoAtual: number
) {
    const transactionId = `trans-app-${appointmentId}`;
    const newSaldo = saldoAtual - servicePrice;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'transactions', transactionId));
    batch.set(doc(db, 'appState', 'saldoEmCaixa'), { value: newSaldo });
    
    await batch.commit();
}
