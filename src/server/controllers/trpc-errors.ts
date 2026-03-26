import { TRPCError } from '@trpc/server';
import { Prisma } from '../../../generated/prisma';

export const toTrpcError = (
  error: unknown,
  fallbackMessage = 'Something went wrong'
): TRPCError => {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new TRPCError({
          code: 'CONFLICT',
          message: 'A record with this value already exists.',
          cause: error,
        });
      case 'P2025':
        return new TRPCError({
          code: 'NOT_FOUND',
          message: 'Record not found.',
          cause: error,
        });
      case 'P2003':
        return new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot complete operation due to related records.',
          cause: error,
        });
      default:
        break;
    }
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: fallbackMessage,
    cause: error,
  });
};
