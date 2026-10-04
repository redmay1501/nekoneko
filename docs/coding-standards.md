# Neko Neko — Coding Standards & Maintainability Guide

> **Purpose:** This document defines how Neko Neko source code must be written so that the project remains easy to read, debug, extend, and hand over later.
>
> **Core principle:** Write code for the next developer who has to understand it — including the future version of yourself.

---

## 1. Golden Rules

1. **Readable before clever.**
2. **Small functions before giant functions.**
3. **One responsibility per file/component/function.**
4. **Do not duplicate business logic.**
5. **Do not put business logic directly inside UI components when it can live in a domain/service/hook.**
6. **Do not silently change product requirements from the specification.**
7. **Do not introduce a new library when the existing stack can solve the problem cleanly.**
8. **Prefer explicit names over abbreviations.**
9. **Comments explain WHY, not WHAT.**
10. **Every important business rule must have a clear home.**
11. **Do not create “magic” behavior that another developer cannot trace.**
12. **Before considering a task complete, run type-check, lint, test, and build where applicable.**

---

# 2. Technology Rules

Neko Neko uses:

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase
- TanStack Query
- Zustand
- Vercel

Do not introduce:

- Express/NestJS backend for MVP
- unnecessary microservices
- unnecessary state-management libraries
- unnecessary UI frameworks
- duplicated API layers

Supabase is the primary backend.

---

# 3. Folder Structure

Use a predictable structure.

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (app)/
│   └── api/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── home/
│   ├── roadmap/
│   ├── learning/
│   ├── memory/
│   └── garden/
│
├── features/
│   ├── auth/
│   ├── learning/
│   ├── memory/
│   ├── roadmap/
│   └── progress/
│
├── lib/
│   ├── supabase/
│   ├── api/
│   ├── utils/
│   └── constants/
│
├── hooks/
├── stores/
├── types/
└── config/
```

### Rule

When adding a file, ask:

> “Which domain owns this?”

Do not put everything into:

```text
components/
utils/
helpers/
```

just because those folders already exist.

---

# 4. Naming

## Files

Use clear names.

```text
MemorySurpriseCard.tsx
LearningSession.tsx
memory-engine.ts
session-engine.ts
useLearningSession.ts
```

Avoid:

```text
misc.ts
helper.ts
common2.ts
temp.ts
test2.ts
data.ts
```

unless the file genuinely has that responsibility.

## Components

Use PascalCase:

```tsx
<MemorySurpriseCard />
<LearningSession />
<KnowledgeCard />
```

## Functions

Use descriptive camelCase:

```ts
calculateMemoryScore()
getNextReviewDate()
buildLearningSession()
recordReviewEvent()
```

Avoid:

```ts
calc()
doThing()
process()
handleData()
```

unless the context makes the meaning completely obvious.

## Boolean variables

Use:

```ts
isCorrect
isLoading
isMastered
hasReview
canContinue
shouldShowHint
```

---

# 5. TypeScript

Avoid `any`.

Bad:

```ts
const data: any = response.data;
```

Good:

```ts
const data: MemoryItem = response.data;
```

When the type is uncertain, define it.

```ts
type MemoryStatus =
  | 'new'
  | 'learning'
  | 'strong'
  | 'mastered';
```

Prefer discriminated unions for complex states.

```ts
type SessionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'active'; sessionId: string }
  | { status: 'completed'; sessionId: string };
```

---

# 6. React Components

A component should primarily describe UI.

Good:

```tsx
function MemorySurpriseCard({
  item,
  onRecall,
}: MemorySurpriseCardProps) {
  return (
    <Card>
      <KnowledgeTitle item={item} />
      <RecallButton onClick={onRecall} />
    </Card>
  );
}
```

Avoid putting complex business logic directly inside:

```tsx
function MemorySurpriseCard() {
  // 200 lines of memory calculation...
}
```

Business logic belongs in the appropriate domain layer.

---

# 7. Component Size

If a component becomes difficult to understand, split it.

Example:

```text
LearningSession
├── SessionHeader
├── SessionProgress
├── SessionQuestion
├── SessionAnswer
├── SessionFeedback
└── SessionActions
```

Do not split components purely for the sake of creating many files.

The goal is:

> each component should have a clear reason to exist.

---

# 8. Business Logic

Business rules must have a clear location.

For example:

```text
features/memory/
├── memory-engine.ts
├── memory-rules.ts
├── memory-types.ts
├── memory-api.ts
└── hooks/
```

Memory rules must NOT be scattered across:

```text
HomePage.tsx
MemoryCard.tsx
LearningPage.tsx
Garden.tsx
```

The UI asks the domain for the result.

---

# 9. Memory Engine

This is one of the most important parts of Neko Neko.

The Memory Engine is deterministic.

It decides:

- memory score
- memory state
- next review
- forgetting risk
- review priority

Do NOT use AI to make these decisions.

Example architecture:

```text
User Answer
    ↓
Review Event
    ↓
Memory Engine
    ↓
New Memory State
    ↓
Next Review
    ↓
Database
```

Keep the calculation in one place.

```ts
calculateMemoryUpdate(...)
```

should not be duplicated in multiple screens.

---

# 10. Session Engine

Neko Neko uses one Learning Session Engine.

Modes such as:

- Học hôm nay
- Học nhanh 5 phút
- Học ngẫu nhiên
- Học thêm
- Ôn lại sau khi nghỉ
- Học liên tục
- Gặp lại kiến thức
- Khám phá
- Thực hành

must reuse the same engine.

The difference should mainly come from configuration/parameters.

Example:

```ts
const session = buildLearningSession({
  mode: 'quick5',
  targetMinutes: 5,
});
```

Avoid creating:

```text
quick-session.ts
random-session.ts
rescue-session.ts
flow-session.ts
```

with duplicated logic.

---

# 11. API Rules

The client must not directly modify critical business state.

Especially:

- memory score
- review schedule
- review events
- important progress calculations

Prefer:

```text
UI
 ↓
Hook
 ↓
API/service
 ↓
Supabase
```

For sensitive/business-critical operations:

```text
UI
 ↓
API / Edge Function
 ↓
Memory Engine
 ↓
Database
```

Never trust the browser to calculate authoritative memory state.

---

# 12. Supabase

Keep database access organized.

Example:

```text
lib/supabase/
├── client.ts
├── server.ts
└── admin.ts
```

Never expose service-role credentials to the browser.

Public:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Secret:

```text
SUPABASE_SERVICE_ROLE_KEY
AI_PROVIDER_API_KEY
```

Secrets must only be used server-side.

---

# 13. Database

Use the database as the source of truth for persistent learning data.

Examples:

```text
users
content
memory_items
review_events
learning_sessions
session_items
progress
```

Do not hard-code the complete learning curriculum directly into React components.

Content should be stored/imported into the database or seed data.

---

# 14. State Management

Use local React state for local UI state.

Use Zustand only for state that genuinely needs to be shared across the application.

Use TanStack Query for server state.

General rule:

```text
UI-only state      → useState
Server state       → TanStack Query
Shared client state → Zustand
Persistent data    → Supabase
```

Do not put everything into Zustand.

---

# 15. Server vs Client Components

Prefer Server Components by default.

Use `'use client'` only when needed, such as:

- interaction
- browser APIs
- local state
- event handlers
- audio playback
- animation requiring client execution

Do not add `'use client'` to an entire page unnecessarily.

---

# 16. Data Fetching

Avoid fetching the same data repeatedly from different components.

Prefer a clear data flow:

```text
Page
 ↓
Feature hook
 ↓
Query
 ↓
Supabase
```

Use query keys that are predictable:

```ts
['memory-items', userId]
['roadmap', userId]
['learning-session', sessionId]
```

---

# 17. Error Handling

Never silently swallow errors.

Bad:

```ts
try {
  await saveMemory();
} catch {
}
```

Good:

```ts
try {
  await saveMemory();
} catch (error) {
  logger.error('Failed to save memory update', error);
  throw error;
}
```

User-facing errors should be friendly and in Vietnamese.

Example:

> “Có chút trục trặc. Bạn thử lại nhé 🌸”

Developer logs should contain enough technical context to debug the problem.

---

# 18. Loading / Empty / Error States

Every important asynchronous UI should consider:

```text
Loading
Success
Empty
Error
```

Do not build only the happy path.

Example:

```tsx
if (isLoading) return <MemorySkeleton />;
if (error) return <MemoryError />;
if (!items.length) return <EmptyMemoryState />;

return <MemoryList items={items} />;
```

---

# 19. Comments

Comments should explain WHY.

Bad:

```ts
// Increase score by 5
score += 5;
```

Good:

```ts
// A successful recall slightly strengthens the memory,
// but repeated recalls should have diminishing returns.
score = increaseMemoryScore(score);
```

For complex algorithms, document:

- purpose
- assumptions
- inputs
- outputs
- important edge cases

---

# 20. Constants

Do not scatter magic numbers.

Bad:

```ts
if (score >= 90) {
```

Good:

```ts
const MASTERED_SCORE = 90;

if (score >= MASTERED_SCORE) {
```

Keep domain constants together.

```text
features/memory/memory-rules.ts
```

---

# 21. No Magic Strings

Bad:

```ts
if (mode === 'quick5') {
```

everywhere.

Prefer a central definition:

```ts
export const SESSION_MODES = {
  DAILY: 'daily',
  QUICK_5: 'quick5',
  RANDOM: 'random',
  MORE: 'more',
  RESCUE: 'rescue',
  FLOW: 'flow',
} as const;
```

Then use the constants consistently.

---

# 22. UI Text

All visible UI text must be Vietnamese.

Japanese is learning content.

Avoid mixing technical English into visible UI unless it is actual learning content.

Prefer:

```text
Học nhanh 5 phút
Ôn lại sau khi nghỉ
Gặp lại kiến thức
Kiến thức sắp quên
```

instead of:

```text
Quick Mode
Rescue Mode
Memory Radar
```

Internal code may use English names where appropriate.

---

# 23. Accessibility

Interactive elements must be usable by keyboard and touch.

Minimum touch target:

```text
44 × 44 px
```

Buttons need meaningful accessible labels.

Images need alt text where appropriate.

Do not rely only on color to communicate state.

---

# 24. Responsive Design

Neko Neko must work on:

- desktop
- iPad
- mobile

Do not build desktop first and “fix mobile later.”

Check at least:

```text
Mobile
iPad
Desktop
```

after major UI changes.

---

# 25. Performance

Avoid unnecessary:

- re-renders
- API requests
- large client bundles
- duplicated queries
- expensive calculations during render

Do not prematurely optimize.

First make the architecture clear, then optimize measured problems.

---

# 26. Testing

Important business logic must have unit tests.

Especially:

- memory score
- memory state transitions
- review scheduling
- forgetting radar
- session generation
- session mode parameters

Example:

```text
memory-engine.test.ts
session-engine.test.ts
```

Test edge cases, not only normal cases.

---

# 27. Git / Commit Rules

Commits should represent one meaningful change.

Good:

```text
feat(memory): implement review scheduling
fix(session): prevent duplicate session items
feat(home): add memory surprise card
refactor(memory): centralize score calculation
test(memory): add recall transition tests
```

Avoid:

```text
update
fix stuff
changes
final
final2
final-real
```

Do not mix unrelated features in one commit.

---

# 28. Before Creating a New File

Ask:

1. Does this responsibility already exist somewhere?
2. Can the existing component/function be reused?
3. Is this actually a new domain responsibility?
4. Will another developer understand why this file exists?

Avoid creating duplicate helpers.

---

# 29. Before Modifying Existing Code

Read the surrounding code first.

Understand:

```text
Who calls this?
What calls it?
What data enters?
What data leaves?
What side effects exist?
What tests depend on it?
```

Do not rewrite a working system simply because another implementation looks cleaner.

Prefer small, traceable changes.

---

# 30. Do Not Over-Engineer

Neko Neko is an MVP.

Do not introduce architecture merely because it looks impressive.

Avoid prematurely adding:

- microservices
- event buses
- complex CQRS
- Kubernetes
- separate backend services
- unnecessary abstraction layers

Use the simplest architecture that preserves the product requirements.

---

# 31. AI Engine

AI is optional and must remain separated from deterministic learning logic.

Correct:

```text
Memory Engine
    ↓
decides WHAT / WHEN

AI Engine
    ↓
decides HOW to explain / present
```

AI must not become the source of truth for memory state.

If AI is unavailable, the core learning experience must still work.

---

# 32. Debugging Rule

When a bug occurs:

1. Reproduce it.
2. Identify the layer where the state becomes incorrect.
3. Fix the root cause.
4. Add a regression test if appropriate.
5. Verify related flows.
6. Do not patch the symptom in multiple screens.

Example:

If memory score is wrong:

Do NOT patch:

```text
Home
Garden
Progress
Memory page
```

individually.

Find the problem in:

```text
Memory Engine / persistence flow
```

and fix it there.

---

# 33. Documentation

Important domain logic should have documentation.

At minimum maintain:

```text
README.md
docs/
├── architecture.md
├── coding-standards.md
├── memory-engine.md
├── session-engine.md
└── database.md
```

If a developer needs significant context to understand a system, document it.

---

# 34. Build Verification

Before declaring a phase complete:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If one of these scripts does not exist, either add the appropriate script or clearly document the equivalent command.

Do not claim “done” when the project does not build.

---

# 35. Claude/Coding Agent Behavior

When working on Neko Neko:

### Always

- inspect existing code before editing
- reuse existing components
- preserve established architecture
- explain major architectural decisions
- keep changes focused
- run validation after meaningful changes
- update documentation when architecture changes

### Never

- rewrite the whole project without a reason
- silently change requirements
- duplicate business logic
- introduce dependencies casually
- put secrets in client code
- hard-code production learning content into UI
- use AI for deterministic Memory Engine decisions
- create separate implementations for every Session Mode
- leave dead code after refactoring

---

# 36. How Code Should Be Explained

When a developer adds a complex feature, the code should be understandable through:

```text
Feature
  ↓
Entry point
  ↓
Hook / service
  ↓
Domain logic
  ↓
Database / API
```

Prefer obvious names and short functions so another developer can trace this flow without reading the entire project.

---

# 37. Definition of Done

A feature is DONE only when:

- [ ] Requirements are implemented
- [ ] Existing UX is preserved
- [ ] Types are correct
- [ ] No unnecessary duplication
- [ ] Loading/error/empty states are handled
- [ ] Responsive behavior is checked
- [ ] Relevant tests exist
- [ ] Lint passes
- [ ] Type-check passes
- [ ] Build passes
- [ ] Documentation is updated if needed
- [ ] No secrets are exposed
- [ ] No unrelated files were changed

---

# 38. Final Principle

Neko Neko should be a project that a developer can open six months later and still understand.

The goal is not:

> “Claude wrote a lot of code.”

The goal is:

> **“I can read the code and understand why the system works this way.”**

Every implementation decision should make that possible.
