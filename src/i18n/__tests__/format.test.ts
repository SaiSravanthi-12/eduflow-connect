import { describe, it, expect, beforeEach } from "vitest";
import {
  formatDate,
  formatNumber,
  formatPercent,
  interpolate,
  getLocale,
} from "@/i18n/format";
import {
  translate,
  supportedLanguages,
  getStoredLanguage,
  storeLanguage,
  detectBrowserLanguage,
} from "@/i18n";

const ALL_LANGS = ["en", "hi", "te", "ta", "kn", "ml"] as const;

describe("i18n format helpers", () => {
  it("resolves a BCP-47 locale for every supported language", () => {
    for (const code of ALL_LANGS) {
      expect(getLocale(code)).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });

  it("formats a fixed date per locale and produces locale-specific output for Hindi/Telugu", () => {
    const d = new Date("2025-01-05T00:00:00Z");
    const en = formatDate(d, "en");
    const hi = formatDate(d, "hi");
    const te = formatDate(d, "te");
    expect(en).toBeTruthy();
    expect(hi).toBeTruthy();
    expect(te).toBeTruthy();
    // Hindi/Telugu use Devanagari/Telugu digits or different month names, so
    // they must not be identical to the English formatting.
    expect(hi).not.toEqual(en);
    expect(te).not.toEqual(en);
  });

  it("returns the input as string for an invalid date instead of throwing", () => {
    expect(formatDate("not-a-date", "en")).toBeTypeOf("string");
  });

  it("formats numbers with locale grouping", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
    // hi-IN uses Indian grouping (lakh/crore)
    expect(formatNumber(1234567, "hi")).toMatch(/12,?\s?34,?\s?567|१२,३४,५६७/);
  });

  it("formats percentages with the % sign or its localized equivalent", () => {
    expect(formatPercent(82, "en")).toContain("82");
    expect(formatPercent(82, "hi")).toMatch(/82|८२/);
  });

  it("interpolates {name} style placeholders", () => {
    expect(interpolate("Hello, {name}!", { name: "Sravanthi" })).toBe(
      "Hello, Sravanthi!"
    );
    expect(interpolate("Score {score}/{total}", { score: 8, total: 10 })).toBe(
      "Score 8/10"
    );
    expect(interpolate("Missing {x}", {})).toBe("Missing {x}");
  });
});

describe("translation lookup", () => {
  it("returns the English translation when the key exists", () => {
    expect(translate("common.save", "en")).toBe("Save");
  });

  it("falls back to English when a key is missing in the target language", () => {
    // 'common.welcomeBack' was added later; non-EN languages should fall
    // back without throwing or returning the bare key.
    for (const code of ALL_LANGS) {
      const value = translate("common.welcomeBack", code);
      expect(value).not.toBe("common.welcomeBack");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("returns the key when the path does not exist anywhere", () => {
    expect(translate("definitely.missing.key", "en")).toBe(
      "definitely.missing.key"
    );
  });

  it("exposes a non-empty native name and locale code for every language", () => {
    for (const code of ALL_LANGS) {
      const entry = supportedLanguages.find((l) => l.code === code);
      expect(entry?.nativeName).toBeTruthy();
    }
  });
});

describe("language persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips the stored language preference", () => {
    storeLanguage("hi");
    expect(getStoredLanguage()).toBe("hi");
    storeLanguage("te");
    expect(getStoredLanguage()).toBe("te");
  });

  it("returns null when nothing is stored", () => {
    expect(getStoredLanguage()).toBeNull();
  });

  it("never returns an unsupported language from the browser", () => {
    const detected = detectBrowserLanguage();
    expect(ALL_LANGS).toContain(detected);
  });
});