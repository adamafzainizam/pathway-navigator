// Prisma 7 moved connection configuration out of `schema.prisma` and into this
// file. The `datasource` block in the schema now declares only the provider.
//
// `dotenv/config` is imported explicitly: the Prisma 7 CLI does NOT load `.env`
// by itself. Without this line, DATABASE_URL is simply undefined and `env()`
// below throws — see AGENTS.md §6.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: env("DATABASE_URL"),
  },

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
