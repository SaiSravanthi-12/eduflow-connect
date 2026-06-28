import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  SupportedLanguage, 
  supportedLanguages, 
  translate as translateFn, 
  detectBrowserLanguage, 
  getStoredLanguage, 
  storeLanguage,
  LanguageOption 
} from '@/i18n';
import { toast } from 'sonner';
import { formatDate as fmtDate, formatNumber as fmtNumber, formatPercent as fmtPercent, interpolate } from '@/i18n/format';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  tv: (key: string, vars: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number) => string;
  supportedLanguages: LanguageOption[];
  isLoading: boolean;
  subtitleLanguage: SupportedLanguage;
  setSubtitleLanguage: (lang: SupportedLanguage) => void;
}

// Build a safe default so consumers rendered outside the provider (or against a
// stale HMR module reference) still receive a working context instead of
// crashing the entire app with a blank screen.
const createDefaultContext = (): LanguageContextType => {
  const lang: SupportedLanguage = (typeof window !== 'undefined' && getStoredLanguage()) || 'en';
  return {
    language: lang,
    setLanguage: () => {
      if (typeof window !== 'undefined') {
        console.warn('[i18n] setLanguage called outside <LanguageProvider>. Ignoring.');
      }
    },
    t: (key: string) => translateFn(key, lang),
    tv: (key, vars) => interpolate(translateFn(key, lang), vars),
    formatDate: (date, options) => fmtDate(date, lang, options),
    formatNumber: (value, options) => fmtNumber(value, lang, options),
    formatPercent: (value) => fmtPercent(value, lang),
    supportedLanguages,
    isLoading: false,
    subtitleLanguage: lang,
    setSubtitleLanguage: () => {},
  };
};

// Reuse the same context instance across HMR reloads so that providers and
// consumers from differently-cached module instances still talk to each other.
const GLOBAL_KEY = '__LOVABLE_LANGUAGE_CONTEXT__';
const globalAny = globalThis as any;
const LanguageContext: React.Context<LanguageContextType> =
  globalAny[GLOBAL_KEY] ??
  (globalAny[GLOBAL_KEY] = createContext<LanguageContextType>(createDefaultContext()));
LanguageContext.displayName = 'LanguageContext';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [subtitleLanguage, setSubtitleLanguageState] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true);
      
      try {
        // First check localStorage
        const storedLang = getStoredLanguage();
        
        if (storedLang) {
          setLanguageState(storedLang);
        } else {
          // Check if user is logged in and has a preference
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            setUserId(user.id);
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('language_preference')
              .eq('id', user.id)
              .single();
            
            if (profile?.language_preference && 
                supportedLanguages.some(l => l.code === profile.language_preference)) {
              const userLang = profile.language_preference as SupportedLanguage;
              setLanguageState(userLang);
              storeLanguage(userLang);
            } else {
              // Fallback to browser language
              const browserLang = detectBrowserLanguage();
              setLanguageState(browserLang);
              storeLanguage(browserLang);
            }
          } else {
            // Not logged in, use browser language
            const browserLang = detectBrowserLanguage();
            setLanguageState(browserLang);
            storeLanguage(browserLang);
          }
        }
        
        // Load subtitle language preference
        const storedSubtitleLang = localStorage.getItem('subtitle_language');
        if (storedSubtitleLang && supportedLanguages.some(l => l.code === storedSubtitleLang)) {
          setSubtitleLanguageState(storedSubtitleLang as SupportedLanguage);
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        setLanguageState(detectBrowserLanguage());
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        
        // Load user's language preference
        const { data: profile } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.language_preference && 
            supportedLanguages.some(l => l.code === profile.language_preference)) {
          const userLang = profile.language_preference as SupportedLanguage;
          setLanguageState(userLang);
          storeLanguage(userLang);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Set language and persist
  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    storeLanguage(lang);
    
    // Update in database if user is logged in
    if (userId) {
      try {
        await supabase
          .from('profiles')
          .update({ language_preference: lang })
          .eq('id', userId);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
    
    const langName = supportedLanguages.find(l => l.code === lang)?.nativeName || lang;
    toast.success(`${translateFn('notifications.languageChanged', lang)} ${langName}`);
  }, [userId]);

  // Set subtitle language
  const setSubtitleLanguage = useCallback((lang: SupportedLanguage) => {
    setSubtitleLanguageState(lang);
    localStorage.setItem('subtitle_language', lang);
  }, []);

  // Translation function bound to current language
  const t = useCallback((key: string): string => {
    return translateFn(key, language);
  }, [language]);

  const tv = useCallback((key: string, vars: Record<string, string | number>): string => {
    return interpolate(translateFn(key, language), vars);
  }, [language]);

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => fmtDate(date, language, options),
    [language]
  );
  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => fmtNumber(value, language, options),
    [language]
  );
  const formatPercent = useCallback((value: number) => fmtPercent(value, language), [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    tv,
    formatDate,
    formatNumber,
    formatPercent,
    supportedLanguages,
    isLoading,
    subtitleLanguage,
    setSubtitleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);

  if (!context) {
    // Defensive fallback — should not happen because the context now has a
    // default value, but protects against bundler edge cases during HMR.
    if (typeof window !== 'undefined') {
      console.warn('[i18n] useLanguage used without a LanguageProvider; using fallback.');
    }
    return createDefaultContext();
  }

  return context;
};

export default LanguageContext;
