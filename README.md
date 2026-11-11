# portfolio

lives at [pybash.xyz](https://pybash.xyz)

## Development

Needs Node.js 22.23.4+ (Astro's minimum) and Bun.

```sh
bun install
cp .env.example .env.local   # fill in the secrets
bun run dev                  # http://localhost:4321
```

Astro + React + Tailwind, deployed to Vercel. `/` is the desk; `/inspo` is the
inspiration board. The board's items live in PostgreSQL (`inspo` schema), and
its uploads live in S3. The owner signs in through Authentik to add or delete
items. The ticket's visitor count uses CountAPI in the background and counts a
browser once while its cookie remains available. The desk renders without
waiting for the counter; the ticket starts with a numeric fallback and uses a
locally cached count on return visits.

## Database

Schema changes go through Drizzle: edit `src/server/db/schema.ts`, then

```sh
bun run db:generate   # write the SQL migration into drizzle/
bun run db:migrate    # apply it (needs DATABASE_MIGRATION_URL in .env.migrations.local)
```

`bun run db:studio` opens the data for inspection.

## Rendered hardware

The pen and breadboard sprites in `public/hardware/` are Blender renders from
`scripts/pen-render/` and `scripts/breadboard-render/` (`render-angles.sh`).
