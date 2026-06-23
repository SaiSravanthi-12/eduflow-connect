# i18n Pattern

All visible text in the app must come from the translation system.

## Use in components

```tsx
import { useLanguage } from "@/contexts/LanguageContext";

function MyCard() {
  const { t, tv, formatDate, formatNumber, formatPercent } = useLanguage();

  return (
    <div>
      <h2>{t("dashboard.courseProgress")}</h2>
      <p>{tv("dashboard.studentTitle", { name: "Sravanthi" })}</p>
      <span>{formatNumber(1234)}</span>
      <span>{formatPercent(82)}</span>
      <span>{formatDate(new Date())}</span>
    </div>
  );
}
```

## Rules

1. **No hardcoded English** in JSX text, `placeholder`, `title`, `aria-label`,
   `toast(...)`, or thrown `Error` messages. Add the string to
   `src/i18n/translations/en.json` and look it up with `t()`.
2. **Numbers, percents, currency and dates** go through `formatNumber`,
   `formatPercent`, `formatDate` so the active locale picks the right
   grouping, digits and month names.
3. **Dynamic values** belong in `tv("namespace.key", { name, count })`.
   Templates use `{var}` placeholders.
4. **Adding a language**: add a JSON file under `src/i18n/translations/`,
   import it in `src/i18n/index.ts`, and register it in
   `supportedLanguages`. Missing keys fall back to English automatically.

## Automated checks

- `bun vitest run src/i18n` — unit tests for formatters, fallback,
  persistence and locale resolution.
- `bun scripts/i18n-scan.mjs` — scans `src/**/*.{ts,tsx}` and reports any
  remaining hardcoded English in user-facing slots. Exits non-zero when
  it finds anything, so it can gate CI.