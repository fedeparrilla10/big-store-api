# Engineering

## Architecture

- Organize new code by business area in `src/modules/<module>/`; each module contains its routes, rules, and data access when needed.
- For example, `src/modules/products/` might contain `products.routes.ts`, `products.controller.ts`, and `products.service.ts`; add `products.repository.ts` only if persistence is needed. These names illustrate responsibilities; they do not require creating every file.
- Use `src/app.ts` to configure Express and mount routes; `src/index.ts` only starts the server. Keep business logic out of these files.
- Keep controllers responsible for HTTP (requests and responses) and business rules in the module, separate from the transport layer when there is enough logic to justify it.

## Conventions

- Prefer simple, explicit code: do not create layers, abstractions, or empty files in advance.
- Validate data at input boundaries before applying business rules; return clear HTTP errors without exposing internal details.
- Keep persistence and integration code close to the module that uses it; extract shared code only when it is actually reused.
- Add tests for business rules and relevant error cases for each change; run `pnpm run typecheck` and `pnpm run build` before delivery.
- Apply these rules to new code; adapt existing code only when the current feature requires it.

## Tests

- Full suite: `pnpm test`.
- Typecheck: `pnpm run typecheck`.
- Linter: no command is defined.
