import { TRPCError } from '@trpc/server';
import type { AssetType, PrismaClient } from '../../../generated/prisma';

import { toTrpcError } from '~/server/controllers/trpc-errors';

type AssetCreateInput = {
  name: string;
  symbol?: string;
  type: AssetType;
};

type AssetUpdateInput = {
  id: string;
  name?: string;
  symbol?: string;
  type?: AssetType;
};

type AssetPriceCreateInput = {
  assetId: string;
  price: number;
  priceDate: Date;
};

export const assetController = {
  getAll: async (db: PrismaClient) => {
    try {
      return await db.asset.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw toTrpcError(error, 'Failed to load assets.');
    }
  },

  getById: async (db: PrismaClient, id: string) => {
    try {
      const asset = await db.asset.findUnique({
        where: { id },
        include: {
          assetPrices: {
            orderBy: { priceDate: 'desc' },
            take: 1,
          },
        },
      });

      if (!asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Asset not found.',
        });
      }

      return asset;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw toTrpcError(error, 'Failed to load asset.');
    }
  },

  create: async (db: PrismaClient, input: AssetCreateInput) => {
    try {
      return await db.asset.create({ data: input });
    } catch (error) {
      throw toTrpcError(error, 'Failed to create asset.');
    }
  },

  update: async (db: PrismaClient, input: AssetUpdateInput) => {
    try {
      const { id, ...data } = input;
      return await db.asset.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw toTrpcError(error, 'Failed to update asset.');
    }
  },

  delete: async (db: PrismaClient, id: string) => {
    try {
      return await db.asset.delete({
        where: { id },
      });
    } catch (error) {
      throw toTrpcError(error, 'Failed to delete asset.');
    }
  },

  updatePrice: async (db: PrismaClient, input: AssetPriceCreateInput) => {
    try {
      const asset = await db.asset.findUnique({
        where: { id: input.assetId },
        select: { id: true },
      });

      if (!asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Asset not found.',
        });
      }

      return await db.assetPrice.create({
        data: {
          assetId: input.assetId,
          price: input.price,
          priceDate: input.priceDate,
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw toTrpcError(error, 'Failed to record asset price.');
    }
  },

  getPriceHistory: async (
    db: PrismaClient,
    assetId: string,
    limit: number
  ) => {
    try {
      return await db.assetPrice.findMany({
        where: { assetId },
        orderBy: { priceDate: 'desc' },
        take: limit,
      });
    } catch (error) {
      throw toTrpcError(error, 'Failed to load price history.');
    }
  },
};
