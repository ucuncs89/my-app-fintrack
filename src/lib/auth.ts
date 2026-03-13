import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "~/env";
import { db } from "~/server/db";

const baseUrl = env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    modelName: "authSession",
  },
  account: {
    modelName: "authAccount",
  },
  trustedOrigins: [baseUrl],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: baseUrl,
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});
