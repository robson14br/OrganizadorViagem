import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import dayjs from 'dayjs'; // Corrigido o import para 'dayjs'
import { ClientError } from '../errors/client-error';

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/activities',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          occurs_at: z.coerce.date(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;
      const { title, occurs_at } = request.body;

      try {
        const trip = await prisma.trip.findUnique({
          where: { id: tripId }
        });

        if (!trip) {
          app.log.error(`Trip with ID ${tripId} not found`);
          throw new ClientError('Trip not found');
        }

        if (dayjs(occurs_at).isBefore(trip.starts_at)) {
          app.log.error(`Invalid activity date: occurs_at ${occurs_at} is before trip start date ${trip.starts_at}`);
          throw new ClientError('Invalid activity date.');
        }

        if (dayjs(occurs_at).isAfter(trip.ends_at)) {
          app.log.error(`Invalid activity date: occurs_at ${occurs_at} is after trip end date ${trip.ends_at}`);
          throw new ClientError('Invalid activity date.');
        }

        const activity = await prisma.activity.create({
          data: {
            title,
            occurs_at,
            trip_id: tripId,
          }
        });

        app.log.info(`Activity created successfully with ID ${activity.id}`);
        return { activityId: activity.id };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        app.log.error(`Error creating activity for trip ID ${tripId}: ${errorMessage}`);
        reply.status(500).send({ error: errorMessage });
      }
    },
  );
}
