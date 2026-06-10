import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "file:/Users/binary/code/myprojects/packages/prisma/dev.db";

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  datasources: { db: { url: DATABASE_URL } },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
