import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors, CommonStyles, Radius, Spacing } from "../src/components/theme";
import { AppButton, Card, Topbar } from "../src/components/ui";
import { useAuth } from "../src/context/AuthContext";
import { useLanguage } from "../src/context/LanguageContext";
import { profileApi } from "../src/services/api";
import { Profile } from "../src/types";

const TIME_SLOTS = [
  "8:00 – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 – 2:00 PM",
  "2:00 – 4:00 PM",
];

export default function Profile() {
  // Editing not allowed for now
  const EDITING_ENABLED = false;

  const { user, signOut } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone_number, setPhone] = useState("");

  useEffect(() => {
    profileApi
      .getProfile()
      .then((res) => {
        console.log(res);
        const p = res as Profile;
        setProfile(p);
        setName(p.name);
        setEmail(p.email);
        setPhone(p.phone_number);
      })
      .catch((err) => {
        console.log(err);
        console.log(err.response);
        console.log(err.message);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile({
        name,
        email,
        phone_number,
      });
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t("signOut"), "Are you sure?", [
      { text: t("cancel"), style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: signOut },
    ]);
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";
  const inputStyle = (key: string) => [
    CommonStyles.input,
    focused === key && { borderColor: Colors.brand },
  ];

  return (
    <View style={CommonStyles.screen}>
      <Topbar title={t("myProfileTitle")} onBack={() => router.back()} />

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
          <Text style={styles.sinceText}>Customer since Jan 2025</Text>
        </View>

        {/* Personal Info */}
        <Card label={t("personalInfo")}>
          {[
            {
              key: "name",
              label: t("fullName"),
              value: name,
              set: setName,
              type: "default",
            },
            {
              key: "email",
              label: t("email"),
              value: email,
              set: setEmail,
              type: "email-address",
            },
            {
              key: "phone_number",
              label: t("phone"),
              value: phone_number,
              set: setPhone,
              type: "phone-pad",
            },
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
                autoCapitalize={key === "email" ? "none" : "words"}
                placeholderTextColor={Colors.text3}
                editable={EDITING_ENABLED}
              />
            </View>
          ))}
        </Card>

        {/* Service Summary */}
        {/* <Card label={t('serviceSummary')}>
          <RowKV label={t('totalJobsBooked')} value={String(profile?.id ? 14 : 0)} />
          <RowKV label={t('amountSpent')} value="NPR 18,420" />
          <RowKV label={t('avgRating')} value="4.7 ★" />
          <RowKV label={t('memberSince')} value={profile?.created_at?.slice(0, 7) ?? 'Jan 2025'} last />
        </Card> */}

        <AppButton
          label={t("saveChanges")}
          onPress={handleSave}
          loading={saving}
          disabled={!EDITING_ENABLED}
        />

        <AppButton
          label={t("signOut")}
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
  avatarSection: { alignItems: "center", paddingVertical: 16 },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brandBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 26, fontWeight: "700", color: Colors.brandDark },
  nameText: { fontSize: 18, fontWeight: "700", color: Colors.text },
  sinceText: { fontSize: 13, color: Colors.text2, marginTop: 3 },
  langBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.brandBg,
    borderRadius: Radius.full,
  },
  langBtnText: { fontSize: 13, color: Colors.brand, fontWeight: "600" },
  field: { marginBottom: 12 },
  optionList: {
    borderWidth: 1,
    borderColor: Colors.borderMd,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.pageBg,
  },
  optionItemSelected: { backgroundColor: Colors.brandBg },
  optionText: { fontSize: 13, color: Colors.text2, fontWeight: "500" },
  inputDisabled: {
    backgroundColor: Colors.border,
    color: Colors.text2,
  },
});
