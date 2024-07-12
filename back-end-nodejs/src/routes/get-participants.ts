import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function getParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/participants',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params

      // Busca a viagem com os participantes selecionados
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { 
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              is_confirmed: true,
            }
          },
        },
      })

      // Verifica se a viagem existe
      if (!trip) {
        throw new ClientError('Trip not found')
      }

      // Retorna os participantes encontrados na viagem
      return { participants: trip.participants }
    },
  )
}
