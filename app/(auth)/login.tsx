import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from "react-native";

import { login, saveToken } from "../src/services/api";
import { getDeviceName } from "../src/services/device";
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from "../src/context/LanguageContext";
import { Colors } from '../src/components/theme';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { t } = useLanguage();

  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [secureText, setSecureText] = useState(true);


  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (pass: string) => pass.length >= 8;

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      Alert.alert("Invalid email");
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert("Password must be 8+ characters");
      return;
    }

    try {
      setLoading(true);

      const device_name = await getDeviceName();

      const data = await login(email, password, device_name);

      // console.log('Login response:', JSON.stringify(data, null, 2));

      // To be updated : proper sign in
      // await signIn(data.token, data.user);

      // quick fix : store user id and pass
      await saveToken(data.token);

      // console.log('user_id:',data.user.id);

      await AsyncStorage.setItem('user_id', String(data.user.id));
      router.replace('/home');

    } catch (err: any) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="construct" size={28} color="#fff" />
        </View>

        <Text style={styles.appName}>{t('appName')}</Text>

        <Text style={styles.welcomeSubtitle}>{t('tagline')}</Text>

        <Text style={styles.welcomeTitle}>{t('welcomeBack')}</Text>

        <View style={styles.card}>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <View style={[styles.tab, styles.tabActive]}>
              <Text style={styles.tabActiveText}>{t('signIn')}</Text>
            </View>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => router.replace('/register')}
            >
              <Text style={styles.tabInactiveText}>{t('register')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            placeholder="sarah.k@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>{t('password')}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              style={styles.passwordInput}
            />

            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Ionicons
                name={secureText ? "eye-off" : "eye"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "..." : t('signIn')}
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

  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.headerBg,
    marginBottom: 4,
  },

  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },

  welcomeTitle: {
    fontSize: 18,
    color: COLORS.textDark,
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

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FAFAF7",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.textDark,
  },

  forgotWrap: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },

  forgotText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "600",
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
