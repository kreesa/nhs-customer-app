import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Pressable style={styles.container} onPress={toggleLanguage}>
      <Text style={[styles.label, language === 'en' && styles.active]}>EN</Text>
      <Text style={styles.divider}>|</Text>
      <Text style={[styles.label, language === 'ne' && styles.active]}>ने</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    paddingHorizontal: 4,
  },
  active: {
    color: '#000',
    fontWeight: '700',
  },
  divider: {
    color: '#ccc',
    marginHorizontal: 2,
  },
});