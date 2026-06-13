import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from "expo-router";
import { Colors, CommonStyles, Radius, Spacing } from '../src/components/theme';
import { AppButton, Card, RowKV, Topbar } from '../src/components/ui';
import { useAuth, AuthProvider } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { customerApi } from '../src/services/api';
import { Customer, RootStackParamList } from '../types';

const TIME_SLOTS = [
  '8:00 – 10:00 AM', '10:00 AM – 12:00 PM',
  '12:00 – 2:00 PM', '2:00 – 4:00 PM',
];

const NOTIF_OPTIONS = ['SMS + Push notification', 'Push only', 'SMS only'];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();

  const [profile, setProfile] = useState<Customer | null>(user);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.service_address ?? '');
  // const [prefSlot, setPrefSlot] = useState(user?.preferred_timeslot ?? TIME_SLOTS[1]);
  const [notifPref, setNotifPref] = useState(user?.notification_preference ?? NOTIF_OPTIONS[0]);

  useEffect(() => {
    customerApi.getProfile()
      .then((p) => {
        setProfile(p);
        setName(p.full_name);
        setEmail(p.email);
        setPhone(p.phone);
        setAddress(p.service_address ?? '');
        // setPrefSlot(p.preferred_timeslot ?? TIME_SLOTS[1]);
        setNotifPref(p.notification_preference ?? NOTIF_OPTIONS[0]);
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await customerApi.updateProfile({
        full_name: name,
        email,
        phone,
        service_address: address,
        // preferred_timeslot: prefSlot,
        notification_preference: notifPref,
      });
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t('signOut'), 'Are you sure?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const inputStyle = (key: string) => [
    CommonStyles.input,
    focused === key && { borderColor: Colors.brand },
  ];

  return (
    <View style={CommonStyles.screen}>
      <Topbar title={t('myProfileTitle')} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.sinceText}>
            {t('customerSince')} {profile?.created_at?.slice(0, 7) ?? 'Jan 2025'}
          </Text>
          {/* Language toggle */}
          <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
            <Text style={styles.langBtnText}>🌐 {t('switchLanguage')}</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Info */}
        <Card label={t('personalInfo')}>
          {[
            { key: 'name', label: t('fullName'), value: name, set: setName, type: 'default' },
            { key: 'email', label: t('email'), value: email, set: setEmail, type: 'email-address' },
            { key: 'phone', label: t('phone'), value: phone, set: setPhone, type: 'phone-pad' },
            { key: 'addr', label: t('serviceAddress'), value: address, set: setAddress, type: 'default' },
          ].map(({ key, label, value, set, type }) => (
            <View key={key} style={styles.field}>
              <Text style={CommonStyles.fieldLabel}>{label}</Text>
              <TextInput
                style={inputStyle(key)}
                value={value}
                onChangeText={set}
                onFocus={() => setFocused(key)}
                onBlur={() => setFocused(null)}
                keyboardType={type as any}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
                placeholderTextColor={Colors.text3}
              />
            </View>
          ))}
        </Card>

        {/* Preferences */}
        <Card label={t('preferences')}>
          
          {/* To be Updated Later -> Add office time and Extra Time later*/}
          {/*<View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t('preferredTimeSlot')}</Text>
            <View style={styles.optionList}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.optionItem, prefSlot === slot && styles.optionItemSelected]}
                  onPress={() => setPrefSlot(slot)}
                >
                  <Text style={[styles.optionText, prefSlot === slot && { color: Colors.brand }]}>
                    {slot}
                  </Text>
                  {prefSlot === slot && <Text style={{ color: Colors.brand }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View> */}

          {/*<View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t('notificationPref')}</Text>
            <View style={styles.optionList}>
              {NOTIF_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionItem, notifPref === opt && styles.optionItemSelected]}
                  onPress={() => setNotifPref(opt)}
                >
                  <Text style={[styles.optionText, notifPref === opt && { color: Colors.brand }]}>
                    {opt}
                  </Text>
                  {notifPref === opt && <Text style={{ color: Colors.brand }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          */}
        </Card>

        {/* Service Summary */}
        <Card label={t('serviceSummary')}>
          <RowKV label={t('totalJobsBooked')} value={String(profile?.id ? 14 : 0)} />
          <RowKV label={t('amountSpent')} value="NPR 18,420" />
          <RowKV label={t('avgRating')} value="4.7 ★" />
          <RowKV label={t('memberSince')} value={profile?.created_at?.slice(0, 7) ?? 'Jan 2025'} last />
        </Card>

        <AppButton label={t('saveChanges')} onPress={handleSave} loading={saving} />
        <AppButton
          label={t('signOut')}
          onPress={handleSignOut}
          variant="danger"
          style={{ marginTop: 0 }}
        />
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 90, gap: 12 },
  avatarSection: { alignItems: 'center', paddingVertical: 16 },
  avatarBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.brandBg, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: Colors.brandDark },
  nameText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sinceText: { fontSize: 13, color: Colors.text2, marginTop: 3 },
  langBtn: {
    marginTop: 10, paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: Colors.brandBg, borderRadius: Radius.full,
  },
  langBtnText: { fontSize: 13, color: Colors.brand, fontWeight: '600' },
  field: { marginBottom: 12 },
  optionList: {
    borderWidth: 1, borderColor: Colors.borderMd,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    backgroundColor: Colors.pageBg,
  },
  optionItemSelected: { backgroundColor: Colors.brandBg },
  optionText: { fontSize: 13, color: Colors.text2, fontWeight: '500' },
});
