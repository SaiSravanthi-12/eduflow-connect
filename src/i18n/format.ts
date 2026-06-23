import { SupportedLanguage } from './index';

const localeMap: Record<SupportedLanguage, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
};

export const getLocale = (lang: SupportedLanguage): string => localeMap[lang] || 'en-US';

export const formatDate = (
  date: Date | string | number,
  lang: SupportedLanguage,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string => {
  try {
    return new Intl.DateTimeFormat(getLocale(lang), options).format(new Date(date));
  } catch {
    return String(date);
  }
};

export const formatTime = (
  date: Date | string | number,
  lang: SupportedLanguage
): string => formatDate(date, lang, { hour: '2-digit', minute: '2-digit' });

export const formatNumber = (
  value: number,
  lang: SupportedLanguage,
  options: Intl.NumberFormatOptions = {}
): string => {
  try {
    return new Intl.NumberFormat(getLocale(lang), options).format(value);
  } catch {
    return String(value);
  }
};

export const formatPercent = (value: number, lang: SupportedLanguage): string =>
  formatNumber(value / 100, lang, { style: 'percent', maximumFractionDigits: 0 });

export const interpolate = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));