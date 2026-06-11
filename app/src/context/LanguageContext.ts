import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, TranslationKey, t as translate } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const defaultContext: LanguageContextType = {
  language: 'en',
  toggleLanguage: () => {},
  t: (key) => key,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = async () => {
    const next: Language = language === 'en' ? 'ne' : 'en';
    setLanguage(next);
    await AsyncStorage.setItem('app_language', next);
  };

  // Load saved language on mount
  React.useEffect(() => {
    AsyncStorage.getItem('app_language').then((saved) => {
      if (saved === 'en' || saved === 'ne') setLanguage(saved);
    });
  }, []);

  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(language, key, params);

  return null;
};

export const useLanguage = () => useContext(LanguageContext);
