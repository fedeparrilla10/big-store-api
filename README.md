# Bigstore API

Basic API built with Node.js, Express, and TypeScript. Requires Node.js 22.12 or later on a supported even-numbered release.

## Usage

```bash
pnpm install
pnpm run dev
```

The API will be available at `http://localhost:3000`. Check its status at `GET /health`.

## Commands

- `pnpm run dev`: development with automatic reloads.
- `pnpm run typecheck`: checks types.
- `pnpm run build`: compiles to `dist/`.
- `pnpm start`: runs the compiled version.
- `pnpm test`: runs tests with Vitest and Supertest.
- `pnpm run db:generate`: generates the Prisma client.

To change the port, set the `PORT` environment variable.
