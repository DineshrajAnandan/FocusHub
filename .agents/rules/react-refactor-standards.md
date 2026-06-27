# React Production-Grade Standards

These rules apply to all React/TypeScript code in this workspace. Apply them to every file you touch during refactoring. Only change structure, quality, and safety — never silently change business behavior.

## Architecture & File Organization
- Organize by **feature/domain** (`features/checkout/`), not by type (no global dumping-ground `components/`, `hooks/`, `utils/` folders for everything).
- Each feature folder owns its own components, hooks, types, and tests. Shared/cross-cutting code goes in `shared/` or `lib/`.
- One component per file. File name matches the default export.
- No file should exceed ~250–300 lines — extract subcomponents, hooks, or helpers if it does.
- Use barrel files (`index.ts`) only at feature boundaries, not pervasively.

## Components
- Function components only, with explicit TypeScript prop types — no inline `any`.
- Split "container" (data/logic) from "presentational" (pure UI) components when a component does both fetching and rendering.
- No business logic inside JSX — extract to functions/hooks above the return statement.
- Wrap callbacks passed to memoized children in `useCallback`.
- Avoid prop drilling beyond 2–3 levels — use composition or context instead.
- Every component must explicitly handle loading, error, and empty states.

## State Management
- Local UI state → `useState`/`useReducer`.
- Derived state must never be stored in state — compute during render or via `useMemo`.
- Server data → a data-fetching library (TanStack Query/RTK Query/SWR), not raw `useEffect` + `fetch` + manual flags.
- Global/cross-feature state → one deliberate solution used consistently, not a mix of patterns.
- No state duplicated from props or other state.

## Hooks
- Extract non-trivial logic (>15 lines, or reused 2+ times) into custom hooks named `useXxx`.
- Respect the Rules of Hooks — no conditional or looped hook calls.
- `useEffect` deps must be correct — no disabling the lint rule without a comment explaining why.
- Clean up subscriptions/timers/listeners in effect cleanup functions.

## TypeScript / Type Safety
- No `any`. Use `unknown` + narrowing, or proper generics.
- No `@ts-ignore` without a comment explaining why.
- Define types for all API responses, props, and shared domain objects.
- Use discriminated unions for state shapes (`{status: 'loading'|'success'|'error'}`) instead of multiple booleans.

## Error Handling
- Wrap route/feature-level trees in Error Boundaries.
- All async calls handle rejected promises — no unhandled gaps.
- User-facing errors show actionable UI, never raw error objects.
- Never swallow errors silently (`catch {}` is a defect).

## Performance
- Memoize expensive computations and stable callbacks — don't over-memoize trivial values.
- Lazy-load routes/heavy components with `React.lazy` + `Suspense`.
- Watch for unstable object/array literals or unmemoized context values causing re-renders.
- Lists use stable unique `key`s, never array index if order/filter can change.

## Code Quality
- ESLint + Prettier enforced (`eslint-plugin-react-hooks`, `eslint-plugin-react`, import sorting).
- No dead code, commented-out blocks, unused imports/vars.
- No magic strings/numbers — use named constants/enums.
- Naming: `camelCase` vars/functions, `PascalCase` components/types, `SCREAMING_SNAKE_CASE` constants.
- No `console.log` in committed code.

## Testing
- Every extracted hook/util gets a unit test.
- Every critical user flow (checkout, auth, form submit) gets an integration test (React Testing Library).
- Tests assert behavior/output, not internal implementation details.

## Security & Config
- No secrets/keys/tokens hardcoded — use environment variables.
- Sanitize user input before rendering; avoid `dangerouslySetInnerHTML` unless sanitized.
- Centralize API base URLs/config — no scattered hardcoded URLs.

## Accessibility
- Semantic HTML over generic `div`/`span` with click handlers.
- Interactive elements are keyboard-accessible with appropriate `aria-*` attributes.
- Form inputs have associated labels.

## Documentation
- Non-obvious functions/hooks get a short comment explaining *why*, not *what*.
- Feature folders get a short `README.md` if logic isn't self-evident.

## Non-negotiable
**Never change business logic/behavior while refactoring structure.** If you spot an actual bug while refactoring, flag it separately and ask before fixing it — don't bundle a behavior change inside a structural refactor.
