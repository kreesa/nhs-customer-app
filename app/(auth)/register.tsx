import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { authApi } from "../src/services/api";
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from "../src/context/LanguageContext";
import { Colors } from '../src/components/theme';

import { AppHeader } from "../src/components/AppHeader";

export default function RegisterScreen() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const handleRegister = async () => {
    if (!firstName.trim()) {
      Alert.alert("First Name is required");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Last Name is required");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Email is required");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Phone number is required");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phoneNumber,
      // profile_photo: profilePhoto,
      password,
      password_confirmation: confirmPassword,
      device_name: "customer-app",
    };

    console.log("Register Payload:", payload);

    try {
      setLoading(true);

      const response = await authApi.register(payload);

      console.log("Register Response:", response);

      Alert.alert("Success", "Registration successful");

      // Example:
      // navigation.navigate("Login");
    } catch (error: any) {
      console.error(error);

      Alert.alert(
        "Registration Failed",
        error?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* AppHeader */}
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconCircle}>
          <Ionicons name="construct" size={28} color="#fff" />
        </View>

        <Text style={styles.createAccount}>{t('createAccount')}</Text>
        <Text style={styles.welcomeSubtitle}>{t('tagline')}</Text>
        

        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.tabInactiveText}>{t('signIn')}</Text>
            </TouchableOpacity>
            <View style={[styles.tab, styles.tabActive]}>
              <Text style={styles.tabActiveText}>{t('register')}</Text>
            </View>
          </View>

          <Text style={styles.label}>{t('firstName')}</Text>
          <TextInput
            placeholder="Sarah"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text style={styles.label}>{t('lastName')}</Text>
          <TextInput
            placeholder="Karki"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            placeholder="sarah.k@email.com"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
          />

          <Text style={styles.label}>{t('phone')}</Text>
          <TextInput
            placeholder="98XXXXXXXX"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <TouchableOpacity
            style={styles.photoButton}
            onPress={() =>
              Alert.alert("Later", "Image picker will be added next.")
            }
          >
            <Ionicons name="camera-outline" size={18} color="#6B7280" />
            <Text style={styles.photoButtonText}>Select Profile Photo</Text>
          </TouchableOpacity>

          <Text style={styles.label}>{t('password')}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              style={styles.passwordInput}
              secureTextEntry={securePassword}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={() => setSecurePassword(!securePassword)}
            >
              <Ionicons
                name={securePassword ? "eye-off" : "eye"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('confirmPassword')}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              style={styles.passwordInput}
              secureTextEntry={secureConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              onPress={() => setSecureConfirm(!secureConfirm)}
            >
              <Ionicons
                name={secureConfirm ? "eye-off" : "eye"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { marginTop: 8 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "..." : t('register')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          <Text style={styles.termsText}>{t('termsText')}</Text>{" "}
          <Text style={styles.linkText}>{t('terms')}</Text> &{" "}
          <Text style={styles.linkText}>{t('privacyPolicy')}</Text>
        </Text>

      </ScrollView>
    </View>
  );
}

const COLORS = {
  headerBg: "#1B4F72",
  accent: "#2E75B6",
  background: "#EFEDE7",
  cardBg: "#FFFFFF",
  border: "#E5E1D8",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  tabBg: "#F1EFE9",
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerSafeArea: {
    backgroundColor: COLORS.headerBg,
  },

  header: {
    backgroundColor: COLORS.headerBg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  headerLang: {
    color: "#E5EDF5",
    fontSize: 13,
  },

  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  createAccount: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },

  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },

  card: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.tabBg,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },

  tabActiveText: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 14,
  },

  tabInactiveText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },

  label: {
    fontSize: 13,
    color: COLORS.textDark,
    marginBottom: 6,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FAFAF7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    color: COLORS.textDark,
  },

  photoButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FAFAF7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  photoButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FAFAF7",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.textDark,
  },

  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
    borderRadius: 10,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },

  termsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },

  linkText: {
    color: COLORS.accent,
    fontWeight: "600",
  },

  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.red,
    position: 'absolute', top: 0, right: 0,
  },

});
