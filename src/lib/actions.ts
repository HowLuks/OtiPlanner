'use server';

import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Funcionario, Service } from '@/lib/data';

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

