import { TRPCError } from "@trpc/server";
import type { CategoryType, PrismaClient } from "../../../generated/prisma";

import { toTrpcError } from "~/server/controllers/trpc-errors";

type CategoryCreateInput = {
  userId: string;
  name: string;
  type: CategoryType;
};

type CategoryUpdateInput = {
  id: string;
  userId: string;
  name?: string;
  type?: CategoryType;
};

const ensureCategoryOwnership = async (
  db: PrismaClient,
  id: string,
  userId: string,
): Promise<void> => {
  const row = await db.category.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Category not found or access denied.",
    });
  }
};

export const categoryController = {
  getAll: async (db: PrismaClient, userId: string) => {
    try {
      return await db.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      throw toTrpcError(error, "Failed to load categories.");
    }
  },

  getById: async (db: PrismaClient, id: string, userId: string) => {
    try {
      const category = await db.category.findFirst({
        where: { id, userId },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found or access denied.",
        });
      }

      return category;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw toTrpcError(error, "Failed to load category.");
    }
  },

  getByType: async (db: PrismaClient, userId: string, type: CategoryType) => {
    try {
      return await db.category.findMany({
        where: { userId, type },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      throw toTrpcError(error, "Failed to load categories by type.");
    }
  },

  create: async (db: PrismaClient, input: CategoryCreateInput) => {
    try {
      return await db.category.create({ data: input });
    } catch (error) {
      throw toTrpcError(error, "Failed to create category.");
    }
  },

  update: async (db: PrismaClient, input: CategoryUpdateInput) => {
    try {
      await ensureCategoryOwnership(db, input.id, input.userId);

      const { id, userId, ...patch } = input;
      void userId;
      return await db.category.update({
        where: { id },
        data: patch,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw toTrpcError(error, "Failed to update category.");
    }
  },

  delete: async (db: PrismaClient, id: string, userId: string) => {
    try {
      await ensureCategoryOwnership(db, id, userId);

      return await db.category.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw toTrpcError(error, "Failed to delete category.");
    }
  },
};
