This work is large enough that it needs to be sequenced. I'll deliver it in three phases so each lands cleanly and you can verify in the preview between phases.

## Phase 1 — Foundation + automated checks (this turn)

- Add a Vitest unit suite for the i18n format helpers covering `formatDate`, `formatNumber`, `formatPercent`, `interpolate`, and locale resolution for all six languages (en/hi/te/ta/kn/ml), plus persistence (localStorage roundtrip) and fallback when a key is missing.
- Add a `scripts/i18n-scan.mjs` linter run via `bun scripts/i18n-scan.mjs` that walks `src/**/*.{tsx,ts}` and flags JSX text nodes, `placeholder=`, `title=`, `aria-label=`, `toast(...)` string args, and `setError('...')` literals that are still hardcoded English. Output is a path:line report and a non-zero exit so it can gate future work.
- Add a small `useFormatters` re-export so new components have one obvious import for locale-aware values, and document the pattern in a short `src/i18n/README.md`.
- Expand `en/hi/te.json` with the shared keys needed by Phases 2 and 3 (forms, dialogs, CRUD verbs, empty states, validation, toast variants). Other languages fall back to English automatically.

## Phase 2 — Admin, Institution, and Content Manager screens

- Migrate Admin dashboard, `InstitutionsPage`, and the new-institution form to `t()` / `tv()` / `formatNumber` / `formatDate`: page titles, table headers, form labels, placeholders, validation messages, confirm dialogs (delete/edit), and success/error toasts.
- Migrate Institution screens (`InstitutionDashboard`, `ContentManagersPage`, `StudentsPage`, `CoursesPage`, `EnrollmentRequestsPage`, `ProfilePage`) the same way, including approve/reject confirmations.
- Migrate Content Manager screens (`TeacherDashboard`, `TeacherCoursesPage`, `TeacherStudentsPage`, `TeacherResultsPage`, `ContentManagerCourseSyllabusPage`, `TeacherProfilePage`) covering student mapping flows, result upload validation, stats cards, and every toast.

## Phase 3 — Student-facing content surfaces

- Migrate Courses, Materials, Quizzes, Assignments, Exams, Browse Courses, and Profile pages: labels, buttons, placeholders, empty states, locked/completed badges, score and percent display via `formatPercent`, deadline dates via `formatDate`.
- Re-run the i18n scanner and drive its report to zero hardcoded English in `src/pages/**` and `src/components/{course,exam,video}/**`.
- Add a Playwright smoke that signs in as each role, switches language to Hindi, navigates the main routes, and asserts the sidebar + page header are no longer in English (uses a known translated string per route).

## Technical details

- The scanner uses a small AST walk via `@babel/parser` (already transitively present) — falls back to regex if parsing fails — and respects an allowlist of identifiers (brand name "Tec-You UpSkill" when intentional, demo email strings, single-character symbols).
- Translation keys follow the existing namespace convention: `admin.*`, `institution.*`, `teacher.*`, `student.*`, plus shared `forms.*`, `dialogs.*`, `validation.*`, `empty.*`.
- All number/percent/date rendering routes through `useLanguage()` formatters so role switches and refreshes pick up the persisted locale automatically (already wired via localStorage + profile).
- No database schema changes are required.

## Out of scope

- Translating dynamically authored content (course titles, syllabus text, quiz questions stored in DB). Those need per-row localized columns or a translation service — happy to plan that separately if you want it.
- Right-to-left layout (none of the six supported languages need it).

Reply "go" or tell me which phase to start with and I'll begin implementing immediately.