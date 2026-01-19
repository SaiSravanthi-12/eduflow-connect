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

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  supportedLanguages: LanguageOption[];
  isLoading: boolean;
  subtitleLanguage: SupportedLanguage;
  setSubtitleLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

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

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

export default LanguageContext;
