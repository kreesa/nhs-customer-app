import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠', path: '/home' },
  { key: 'request', label: 'Request', icon: '➕', path: '/request' },
];

export default function BottomBar() {
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && { opacity: 1 }]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            {isActive && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 62,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.09)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  icon: { fontSize: 20, opacity: 0.5 },
  label: { fontSize: 10, fontWeight: '500', color: '#9A9A9A' },
  labelActive: { color: '#185FA5' },
  indicator: {
    position: 'absolute',
    bottom: -8,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#185FA5',
  },
});