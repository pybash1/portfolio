# portfolio

lives at [pybash.xyz](https://pybash.xyz)

## Development

```sh
bun install
cp .env.example .env.local   # fill in the secrets
bun run dev                  # http://localhost:4321
```

Astro + React + Tailwind, deployed to Vercel. `/` is the desk; `/inspo` is the
inspiration board. The board's items live only in PostgreSQL (`inspo.items`) and
its uploads in S3; the owner signs in through Authentik to add or delete items.

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
