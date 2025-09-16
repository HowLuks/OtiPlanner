// src/app/api/appointments/trigger-reminders/route.ts
'use server';

import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Appointment, AppSettings } from '@/lib/data';
import { format, addDays } from 'date-fns';

async function getAppSettings(): Promise<AppSettings | null> {
    const settingsDoc = await getDoc(doc(db, 'appState', 'settings'));
    return settingsDoc.exists() ? settingsDoc.data() as AppSettings : null;
}

export async function POST(request: Request) {
    try {
        const appSettings = await getAppSettings();
        const webhookUrl = appSettings?.appointmentWebhookUrl;

        if (!webhookUrl) {
            console.log('Webhook URL for reminders is not configured.');
            return NextResponse.json({ success: false, message: 'Webhook URL not configured.' }, { status: 400 });
        }

        const tomorrow = addDays(new Date(), 1);
        const tomorrowDateString = format(tomorrow, 'yyyy-MM-dd');

        const appointmentsRef = collection(db, 'confirmedAppointments');
        const q = query(appointmentsRef, where('date', '==', tomorrowDateString));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`No appointments found for tomorrow (${tomorrowDateString}).`);
            return NextResponse.json({ success: true, message: 'No appointments for tomorrow.', sent: 0 });
        }

        const appointments = querySnapshot.docs.map(doc => doc.data() as Appointment);
        let sentCount = 0;
        const errors = [];

        for (const appointment of appointments) {
            const payload = {
                clientName: appointment.client,
                clientWhatsapp: appointment.clientWhatsapp,
                time: appointment.time,
            };

            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    sentCount++;
                } else {
                    const errorBody = await response.text();
                    console.error(`Failed to send webhook for appointment ${appointment.id}: ${response.status} ${response.statusText}`, errorBody);
                    errors.push({ appointmentId: appointment.id, status: response.status, error: errorBody });
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Error sending webhook for appointment ${appointment.id}:`, errorMessage);
                errors.push({ appointmentId: appointment.id, error: errorMessage });
            }
        }
        
        console.log(`${sentCount} reminders sent. ${errors.length} failed.`);
        return NextResponse.json({ 
            success: errors.length === 0, 
            message: `${sentCount} reminders sent. ${errors.length} failed.`,
            sent: sentCount,
            failed: errors.length,
            errors: errors,
        }, { status: 200 });

    } catch (error) {
        console.error('Error in trigger-reminders endpoint:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
