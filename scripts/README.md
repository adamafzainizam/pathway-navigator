# `scripts/` — standalone tooling

## Read this before writing a script

Any script here will **silently target the development database** unless
`DATABASE_URL` is overridden inline on the command line. `dotenv` loads `.env`
(which describes development) and does not overwrite an already-set variable.

```bash
# Targets development, whatever you intended:
npx tsx scripts/whatever.ts

# Targets what you actually meant:
DATABASE_URL="postgres://...prod..." npx tsx scripts/whatever.ts
```

This cost real time in the predecessor project. The failure is silent — the
script runs fine, against the wrong database.

Every script must `import "dotenv/config"` as its first line, or `DATABASE_URL`
falls back to `localhost:5432` under Prisma 7.

## Expected scripts

- `import-mqr.ts` — pull programme/accreditation data from the Malaysian
  Qualifications Register
- `recheck-queue.ts` — list rules past their `recheckDueOn` date
- `coverage.ts` — report which qualification × institution pairs have no rules yet
