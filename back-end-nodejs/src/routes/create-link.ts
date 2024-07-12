import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function createLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/links',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          url: z.string().url(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params
      const { title, url } = request.body

      // Verifica se a viagem existe
      const trip = await prisma.trip.findUnique({
        where: { id: tripId }
      })

      // Se a viagem não existe, lança um erro
      if (!trip) {
        throw new ClientError('Trip not found')
      }

      // Cria o link associado à viagem encontrada
      const link = await prisma.link.create({
        data: {
          title,
          url,
          trip_id: tripId,
        }
      })

      // Retorna o ID do link criado
      return { linkId: link.id }
    },
  )
}
