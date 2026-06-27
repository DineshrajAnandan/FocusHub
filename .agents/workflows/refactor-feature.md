# Refactor Feature

Act as a senior React engineer refactoring this codebase to the production-grade standards defined in the workspace rules. Work incrementally on one feature/folder/file at a time — never the whole repo in one pass.

## Steps

1. **Audit.** Scan the target I specify and give me a short audit covering:
   - structural issues (file size, mixed concerns, prop drilling)
   - type-safety issues (`any`, missing types)
   - state management smells (duplicated/derived state, effect misuse)
   - missing error/loading/empty states
   - dead code, console.logs, magic strings

2. **Plan.** Propose a refactor plan as a numbered list of small, discrete, reviewable steps (e.g. "extract `useCheckoutForm` hook", "split `CheckoutPage` into Container + View"). Do not write code yet. Wait for my approval, or proceed only on the steps I explicitly approve.

3. **Execute one step at a time.** For each approved step:
   - Make ONLY that change.
   - Preserve existing behavior exactly — no scope creep, no "while I was in there" fixes.
   - Show a short summary of what changed and why.
   - If you spot an actual bug (not a style/structure issue), flag it separately and ask before fixing — do not bundle it into this refactor.

4. **Tests.** After the structural refactor for this target is done, suggest tests for newly extracted hooks/logic and critical flows. Don't add them automatically — ask first.

## Target for this run
[Tell me which feature/folder/file to refactor, or I'll ask you to pick the highest-traffic or most fragile one first.]
