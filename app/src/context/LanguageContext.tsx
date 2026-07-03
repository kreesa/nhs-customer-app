import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, TranslationKey, t as translate } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const defaultContext: LanguageContextType = {
  language: 'en',
  toggleLanguage: () => {},
  setLanguage: () => {},
  t: (key) => key,
  isLoading: true,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  React.useEffect(() => {
    AsyncStorage.getItem('app_language')
      .then((saved) => {
        if (saved === 'en' || saved === 'ne') setLanguageState(saved);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  const toggleLanguage = async () => {
    const next: Language = language === 'en' ? 'ne' : 'en';
    await setLanguage(next);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(language, key, params);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);