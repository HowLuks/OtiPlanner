import { NextResponse } from 'next/server';
import { z } from 'zod';
import { initialServices, Service } from '@/lib/data';

// This is a simplified in-memory store. 
// In a real application, you would use a database.
// We are simulating a shared store that can be accessed by the API route.
// NOTE: This will reset on every server restart in a development environment.
interface SimpleStore {
    pendingAppointments: any[];
}

const globalStore: SimpleStore = {
    pendingAppointments: [],
};

// Zod schema for input validation
const appointmentSchema = z.object({
  client: z.string().min(1, { message: "Client name is required." }),
  clientWhatsapp: z.string().optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, { message: "Time must be in HH:MM format." }),
  service: z.string().min(1, { message: "Service is required." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = appointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }

    const { client, clientWhatsapp, time, service } = validation.data;

    const serviceObject = initialServices.find(s => s.name.toLowerCase() === service.toLowerCase());

    if (!serviceObject) {
         return NextResponse.json({ success: false, error: `Service '${service}' not found.` }, { status: 400 });
    }
    
    // In a real app, you'd get the `pendingAppointments` from a shared data source
    // or from the localStorage on the client side. Here we use a simulated global store.
    // We cannot directly access localStorage from the server-side route.
    // The webhook needs to add to a persistent data store (e.g., a database)
    // and the client would then fetch from that store.
    
    const newAppointment = {
        id: `p${globalStore.pendingAppointments.length + Date.now()}`,
        client,
        clientWhatsapp,
        time,
        service: serviceObject,
    };

    // Add to our simulated store
    globalStore.pendingAppointments.push(newAppointment);

    console.log('New pending appointment added via webhook:', newAppointment);
    console.log('Current pending appointments:', globalStore.pendingAppointments);

    // To make this work with the current localStorage setup, you'd need a mechanism
    // for the client to poll for updates or use something like WebSockets.
    // This webhook currently only adds to a server-side in-memory array.

    return NextResponse.json({ success: true, appointment: newAppointment }, { status: 201 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, error: 'Invalid request body or server error' }, { status: 500 });
  }
}
