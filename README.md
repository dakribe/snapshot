# Snapshot

Live hockey scores, a gamecenter with live updates, 0–10 player ratings for every game, and a Team of the Week. NHL first; PWHL and AHL later.

Unofficial. Not affiliated with or endorsed by the NHL.

## Stack

- [TanStack Start](https://tanstack.com/start) (React, TypeScript)
- [Tailwind CSS](https://tailwindcss.com) v4
- [Cloudflare Workers](https://workers.cloudflare.com), deployed with [Alchemy](https://alchemy.run)
- [Bun](https://bun.sh)

## Development

```sh
bun install
bun run dev        # http://localhost:3000
bun run typecheck
bun run lint
```

## Deploy

Needs a Cloudflare account. Sign in once with `bunx alchemy profile login`, then:

```sh
bun run deploy     # prints the site URL
bun run destroy    # removes everything the deploy created
```
