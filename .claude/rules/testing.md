---
paths:
  - "__tests__/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "jest.*"
---

# Testing

- Tests run on jest-expo with React Native Testing Library; shared mocks live in `jest.setup.ts`.
- Put tests in the flat `__tests__/` folder. Screen tests are `<screen>.smoke.test.tsx` and render the route with its dependencies mocked.
- Mock collaborators with `jest.mock("@/<module>")` at the module boundary (services, repositories, stores).
- Name each test as a sentence describing the behaviour, e.g. `it("keeps the operation queued when the server does not acknowledge it")`.
- Cover every failure branch a new or changed function adds (rejected RPC, offline, missing row, validation error).
- Control time with Jest fake timers (`jest.useFakeTimers()`, `jest.advanceTimersByTime`) instead of real waits.
