---
paths:
  - "app/**"
  - "components/**"
---

# UI

- Style with NativeWind `className`.
- Take colors from the tokens in `tailwind.config.js`. `constants/theme.ts` duplicates some hex values (known gap); prefer the Tailwind token when both exist.
- Write user-facing copy in Spanish, using the terms in `CONTEXT.md` (for example "Fortaleza", "Batalla", "Botín de Guerra").
- In new or rewritten screens, get data through hooks in `hooks/`; screens compose hooks and components.
- Keep components in `components/` presentational: data and callbacks arrive as props.
- Render long or unbounded lists with `FlashList` from `@shopify/flash-list`.
- Route files default-export the screen; components use named exports.
