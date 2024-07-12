import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import dayjs from 'dayjs';
import { getMailClient } from '../lib/mail';
import { prisma } from '../lib/prisma';
import { ClientError } from '../errors/client-error';
import { env } from '../env';

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/confirm',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;

      try {
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          include: {
            participants: {
              where: { is_owner: false },
            }
          }
        });

        if (!trip) {
          app.log.error(`Trip with ID ${tripId} not found`);
          throw new ClientError('Trip not found.');
        }

        if (trip.is_confirmed) {
          app.log.info(`Trip with ID ${tripId} is already confirmed`);
          return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);
        }

        await prisma.trip.update({
          where: { id: tripId },
          data: { is_confirmed: true },
        });

        const formattedStartDate = dayjs(trip.starts_at).format('LL');
        const formattedEndDate = dayjs(trip.ends_at).format('LL');

        const mail = await getMailClient();

        await Promise.all(
          trip.participants.map(async (participant) => {
            const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`;

            const message = await mail.sendMail({
              from: {
                name: 'Equipe plann.er',
                address: 'oi@plann.er',
              },
              to: participant.email,
              subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartDate}`,
              html: `
              <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                <p>Você foi convidado(a) para participar de uma viagem para <strong>${trip.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
                <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
                <p><a href="${confirmationLink}">Confirmar viagem</a></p>
                <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
              </div>
            `.trim(),
            });

            app.log.info(`Confirmation email sent to ${participant.email}, URL: ${nodemailer.getTestMessageUrl(message)}`);
          })
        );

        app.log.info(`Trip with ID ${tripId} confirmed successfully`);
        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        app.log.error(`Error confirming trip with ID ${tripId}: ${errorMessage}`);
        throw error;
      }
    },
  );
}
