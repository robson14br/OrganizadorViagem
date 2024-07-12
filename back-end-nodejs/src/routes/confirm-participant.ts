import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ClientError } from '../errors/client-error';
import { env } from '../env';

export async function confirmParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId/confirm',
    {
      schema: {
        params: z.object({
          participantId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { participantId } = request.params;

      try {
        const participant = await prisma.participant.findUnique({
          where: {
            id: participantId,
          }
        });

        if (!participant) {
          app.log.error(`Participant with ID ${participantId} not found`);
          throw new ClientError('Participant not found.');
        }

        if (participant.is_confirmed) {
          app.log.info(`Participant with ID ${participantId} is already confirmed`);
          return reply.redirect(`${env.WEB_BASE_URL}/trips/${participant.trip_id}`);
        }

        await prisma.participant.update({
          where: { id: participantId },
          data: { is_confirmed: true }
        });

        app.log.info(`Participant with ID ${participantId} confirmed successfully`);
        return reply.redirect(`${env.WEB_BASE_URL}/trips/${participant.trip_id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        app.log.error(`Error confirming participant with ID ${participantId}: ${errorMessage}`);
        throw error;
      }
    },
  );
}
