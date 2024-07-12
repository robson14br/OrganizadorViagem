import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function getLinks(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/links',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params

      // Busca a viagem com os links associados
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { 
          links: true,
        },
      })

      // Verifica se a viagem existe
      if (!trip) {
        throw new ClientError('Trip not found')
      }

      // Retorna os links associados à viagem encontrada
      return { links: trip.links }
    },
  )
}
