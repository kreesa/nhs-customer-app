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
import { Colors, CommonStyles, Spacing } from "../src/components/theme";
import { AppButton, Card, Topbar } from "../src/components/ui";
import { useAuth } from "../src/context/AuthContext";
import { useLanguage } from "../src/context/LanguageContext";
import { profileApi } from "../src/services/api";
import { Profile } from "../src/types";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res: any = await profileApi.getProfile();

        // Works whether request() returns profile directly
        // or { data: profile }
        const p: Profile = res.data ?? res;

        setProfile(p);
      } catch (err) {
        console.error("Profile Error:", err);
        Alert.alert("Error", "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSignOut = () => {
    Alert.alert(t("signOut"), "Are you sure?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("signOut"),
        style: "destructive",
        onPress : () => {
          signOut();
        },
      },
    ]);
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <View style={CommonStyles.screen}>
      <Topbar title={t("myProfileTitle")} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.nameText}>
            {loading ? "Loading..." : (profile?.name ?? "-")}
          </Text>

          <Text style={styles.sinceText}>Customer since Jan 2025</Text>
        </View>

        <Card label={t("personalInfo")}>
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t("fullName")}</Text>
            <TextInput
              style={[CommonStyles.input, styles.inputDisabled]}
              value={profile?.name ?? ""}
              editable={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t("email")}</Text>
            <TextInput
              style={[CommonStyles.input, styles.inputDisabled]}
              value={profile?.email ?? ""}
              editable={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t("phone")}</Text>
            <TextInput
              style={[CommonStyles.input, styles.inputDisabled]}
              value={profile?.phone_number ?? ""}
              editable={false}
              keyboardType="phone-pad"
            />
          </View>

        </Card>

        <AppButton
          label={t("signOut")}
          onPress={handleSignOut}
          variant="danger"
        />

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 90,
    gap: 12,
  },

  avatarSection: {
    alignItems: "center",
    paddingVertical: 16,
  },

  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brandBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  avatarText: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.brandDark,
  },

  nameText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  sinceText: {
    fontSize: 13,
    color: Colors.text2,
    marginTop: 3,
  },

  field: {
    marginBottom: 12,
  },

  inputDisabled: {
    backgroundColor: Colors.border,
    color: Colors.text2,
  },
});
