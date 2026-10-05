---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript

- Use named exports; route files under `app/` are the exception and default-export the screen.
- Import types with `import type`.
- Type untrusted values (RPC payloads, JSON, caught errors) as `unknown` and narrow them before use.
- Give exported service and repository functions explicit return types.
- Import across top-level folders with the `@/` alias; relative paths stay within a folder.
