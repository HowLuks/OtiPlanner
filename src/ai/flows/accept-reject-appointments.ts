'use server';

/**
 * @fileOverview This file defines a Genkit flow for accepting or rejecting appointment requests.
 *
 * - acceptRejectAppointment - A function that handles the appointment acceptance/rejection process.
 * - AcceptRejectAppointmentInput - The input type for the acceptRejectAppointment function.
 * - AcceptRejectAppointmentOutput - The return type for the acceptRejectAppointment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AcceptRejectAppointmentInputSchema = z.object({
  appointmentId: z.string().describe('The ID of the appointment to accept or reject.'),
  action: z.enum(['accept', 'reject']).describe('The action to take: accept or reject the appointment.'),
  reason: z.string().describe('The reason for accepting or rejecting the appointment.'),
});
export type AcceptRejectAppointmentInput = z.infer<typeof AcceptRejectAppointmentInputSchema>;

const AcceptRejectAppointmentOutputSchema = z.object({
  success: z.boolean().describe('Whether the appointment was successfully accepted or rejected.'),
  message: z.string().describe('A message indicating the result of the operation.'),
});
export type AcceptRejectAppointmentOutput = z.infer<typeof AcceptRejectAppointmentOutputSchema>;

export async function acceptRejectAppointment(
  input: AcceptRejectAppointmentInput
): Promise<AcceptRejectAppointmentOutput> {
  return acceptRejectAppointmentFlow(input);
}

const acceptRejectAppointmentPrompt = ai.definePrompt({
  name: 'acceptRejectAppointmentPrompt',
  input: {schema: AcceptRejectAppointmentInputSchema},
  output: {schema: AcceptRejectAppointmentOutputSchema},
  prompt: `You are an assistant helping a staff member manage appointments.

The staff member has requested to {{action}} appointment with ID {{appointmentId}}.

The reason provided is: {{reason}}

Respond with a JSON object with a "success" field indicating whether the appointment was successfully {{action}}ed, and a "message" field providing a confirmation message.
`,
});

const acceptRejectAppointmentFlow = ai.defineFlow(
  {
    name: 'acceptRejectAppointmentFlow',
    inputSchema: AcceptRejectAppointmentInputSchema,
    outputSchema: AcceptRejectAppointmentOutputSchema,
  },
  async input => {
    const {output} = await acceptRejectAppointmentPrompt(input);
    return output!;
  }
);
