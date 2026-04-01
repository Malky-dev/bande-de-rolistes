# Code standards — Bande de Rôlistes

## Scope

These rules apply to all work on this project unless a verified exception is documented in the current archive or codebase.

## Source of truth

- Work only from the current real archive / current repository state.
- Do not reuse diagnostics from an older archive or prior conversation without revalidating them in the current codebase.
- No assumptions about code that has not been verified directly.

## Priorities

Prioritize:

- robustness
- consistency
- clarity
- useful cleanup

Avoid:

- decorative abstraction
- speculative refactors
- cosmetic-only churn
- structural rewrites without a solid, verified reason

## TypeScript rules

- No `any` in source code.
- No `unknown` in source code.
- `unknown` is tolerated in tests only if there is no reasonable alternative.
- Keep types explicit and domain-oriented.
- Prefer narrowing and validated parsing over loose typing.
- Do not export types, guards, or helpers unless they have an actual external consumer in the current codebase.

## React rules

- Use simple business-oriented component names.
- Do not add unnecessary technical suffixes to component names.
- Keep components focused and readable.
- Do not introduce abstraction layers unless they remove verified duplication or improve robustness.
- Do not reopen stable closed areas without a serious verified reason.

## Imports

- Prefer `@/` imports when consistent with the existing project conventions.
- Do not rewrite imports gratuitously if the current local import is clearer or already coherent in context.

## Cleanup policy

Cleanup must be justified by the current codebase state.

Classify findings explicitly as:

- really dead
- test-only
- optional
- false problem
- keep

Only propose deletions when they are solidly verified.

Proceed in small coherent batches:

- dead files
- dead exports
- test-only exports
- orphan helpers/guards
- dead CSS selectors

If there is nothing solid to remove, say so clearly.

## Closed areas

The following structural areas are considered closed unless the current codebase proves otherwise:

- QuotesPanel
- RpgTablesView
- AdminPanel
- RpgTableForm
- AuthForms
- UpsertRpgTableView
- polls structural batch
- `App.tsx` must not be reopened without a serious verified reason

## Style of change

- Prefer the smallest correct change.
- Do not mix unrelated changes in the same batch.
- Keep patches easy to review.
- Preserve behavior unless the change explicitly fixes a verified bug.
- For cleanup work, prefer unexporting before deleting when a symbol is still used internally.
- For CSS cleanup, remove only selectors that are verified unused in the current archive.

## Validation

Before considering a batch done:

- revalidate against the current repository state
- run the relevant checks
- confirm that the diagnosis still holds after edits

## Communication / review expectations

When proposing work:

- provide exact files
- justify each deletion
- separate solid findings from optional ones
- do not provide a patch prematurely
- if the best decision is to keep the code as-is, state it clearly
