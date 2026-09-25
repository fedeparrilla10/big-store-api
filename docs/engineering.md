# Engineering

## Architecture

- Organize new code by business area in `src/modules/<module>/`; each module contains its routes, rules, and data access when needed.
- For example, `src/modules/products/` might contain `products.routes.ts`, `products.controller.ts`, and `products.service.ts`; add `products.repository.ts` only if persistence is needed. These names illustrate responsibilities; they do not require creating every file.
- Use `src/app.ts` to configure Express and mount routes; `src/index.ts` only starts the server. Keep business logic out of these files.
- Keep controllers responsible for HTTP (requests and responses) and business rules in the module, separate from the transport layer when there is enough logic to justify it.
- Types and interfaces should be defined in the module that uses them; extract shared types only when they are actually reused. Put them in `src/types/` only if they are used across multiple modules.

## Conventions

- Prefer simple, explicit code: do not create layers, abstractions, or empty files in advance.
- Validate data at input boundaries before applying business rules; return clear HTTP errors without exposing internal details.
- Keep persistence and integration code close to the module that uses it; extract shared code only when it is actually reused.
- Add tests for business rules and relevant error cases for each change; run `pnpm run typecheck` and `pnpm run build` before delivery.
- Apply these rules to new code; adapt existing code only when the current feature requires it.
- Use ECMAScript modules and TypeScript; avoid CommonJS, Babel, or other transpilers.
- Use arrow functions instead of `function` declarations; use `const` instead of `let` when possible.
- All tables in the database must have timestamps, both `createdAt` and `updatedAt`.

## Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages.

## Tests

- Full suite: `pnpm test`.
- Typecheck: `pnpm run typecheck`.
