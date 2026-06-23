import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Convenience hook for components that only need locale-aware
 * formatters (no translation lookup). Re-exported from the same
 * source of truth as useLanguage so behavior stays consistent.
 */
export const useFormatters = () => {
  const { formatDate, formatNumber, formatPercent, language } = useLanguage();
  return { formatDate, formatNumber, formatPercent, language };
};