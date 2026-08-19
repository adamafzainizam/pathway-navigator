// Prisma client singleton.
//
// Prisma 7 no longer reads the connection string from `schema.prisma` — the
// runtime client is handed an explicit driver adapter instead. We use the Neon
// serverless driver so that serverless invocations don't each hold a TCP
// connection open; the free tier's connection ceiling is low.
//
// This is the ONLY module that should construct a PrismaClient. Everything in
// src/lib/ besides this file is meant to stay pure and I/O-free so it can be
// unit-tested without a database — see AGENTS.md §8.
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Thrown loudly rather than defaulted. A standalone script that forgets
    // `import "dotenv/config"` used to fall back to localhost:5432 silently and
    // "succeed" against nothing — see AGENTS.md §6.
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env, or pass it inline: " +
        'DATABASE_URL="postgres://..." npx tsx scripts/whatever.ts',
    );
  }

  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

// Next.js dev-server hot reload re-evaluates modules, which would otherwise
// build a new pool on every save until Neon refuses new connections.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
