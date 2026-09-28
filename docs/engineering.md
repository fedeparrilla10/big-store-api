# Engineering

## Architecture

- System's architecture is based on modules organized by business domain.

## Conventions

- Prefer simple, explicit code: do not create layers, abstractions, or empty files in advance.
- Validate data at input boundaries before applying business rules; return clear HTTP errors without exposing internal details.
- Keep persistence and integration code close to the module that uses it; extract shared code only when it is actually reused.
- Add tests for business rules and relevant error cases for each change; run `pnpm run typecheck` and `pnpm run build` before delivery.
- Apply these rules to new code; adapt existing code only when the current feature requires it.
- Use ECMAScript modules and TypeScript; avoid CommonJS, Babel, or other transpilers.
- Use arrow functions instead of `function` declarations; use `const` instead of `let` when possible.
- All tables in the database must have timestamps, both `createdAt` and `updatedAt`.
- Validations are made with Zod.
