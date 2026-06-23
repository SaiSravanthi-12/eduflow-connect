import en from './translations/en.json';
import hi from './translations/hi.json';
import te from './translations/te.json';
import ta from './translations/ta.json';
import kn from './translations/kn.json';
import ml from './translations/ml.json';

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag?: string;
}

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
];

type TranslationDict = typeof en;
export const translations: Record<SupportedLanguage, TranslationDict | Record<string, any>> = {
  en,
  hi,
  te,
  ta,
  kn,
  ml,
};

// Get nested value from object using dot notation
export const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return the path if translation not found (fallback)
    }
  }
  
  return typeof value === 'string' ? value : path;
};

// Translation function
export const translate = (key: string, language: SupportedLanguage = 'en'): string => {
  const translation = getNestedValue(translations[language], key);
  
  // Fallback to English if translation not found
  if (translation === key && language !== 'en') {
    return getNestedValue(translations.en, key);
  }
  
  return translation;
};

// Detect browser language
export const detectBrowserLanguage = (): SupportedLanguage => {
  if (typeof navigator === 'undefined') return 'en';
  
  const browserLang = navigator.language.split('-')[0];
  const supported = supportedLanguages.find(lang => lang.code === browserLang);
  
  return supported?.code || 'en';
};

// Get stored language preference
export const getStoredLanguage = (): SupportedLanguage | null => {
  if (typeof localStorage === 'undefined') return null;
  
  const stored = localStorage.getItem('app_language');
  if (stored && supportedLanguages.some(lang => lang.code === stored)) {
    return stored as SupportedLanguage;
  }
  
  return null;
};

// Store language preference
export const storeLanguage = (language: SupportedLanguage): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('app_language', language);
  }
};

export default translations;
