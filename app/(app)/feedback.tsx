import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, CommonStyles, Radius, Spacing } from "../src/components/theme";
import {
  AppButton,
  Avatar,
  Card,
  StarRating,
  PageHeader
} from "../src/components/ui";
import { useLanguage } from "../src/context/LanguageContext";
import { feedbackApi } from "../src/services/api";
import { TopQuality } from "../types";

const QUALITY_OPTIONS: TopQuality[] = [
  "Punctual",
  "Polite",
  "Skilled",
  "Honest",
  "Clean Work",
  "Quick Response",
  "Reliable",
];

export default function Feedback() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const servId = Number(serviceId);

  const { t } = useLanguage();

  const [overallRating, setOverallRating] = useState(5);
  const [selectedQualities, setSelectedQualities] = useState<TopQuality[]>([]);
  const [useAgain, setUseAgain] = useState<boolean | null>(null);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleQuality = (q: TopQuality) => {
    setSelectedQualities((prev) =>
      prev.includes(q)
        ? prev.filter((x) => x !== q)
        : prev.length < 3
          ? [...prev, q]
          : prev,
    );
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert("Error", "Please give an overall rating.");
      return;
    }
    setLoading(true);
    try {
      await feedbackApi.submit({
        service_id: servId,
        technician_id: technicianId,
        overall_rating: overallRating,
        top_qualities: selectedQualities,
        use_service_again: useAgain ?? true,
        remark: remark.trim() || undefined,
      });
      router.push("/home");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={CommonStyles.screen}>
      <PageHeader title={t("rateExperience")} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Text style={{ fontSize: 32 }}>✅</Text>
          </View>
          <Text style={styles.successTitle}>{t("jobCompleted")}</Text>
          <Text style={styles.successSub}>
            {t("paymentConfirmed", { amount: amount.toLocaleString() })}
          </Text>
        </View>

        {/* Rate Technician */}
        <Card label={t("rateTechnician")}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Avatar initials="RB" size={44} />
            <View>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: Colors.text }}
              >
                Technician
              </Text>
              <Text style={{ fontSize: 12, color: Colors.text2, marginTop: 2 }}>
                Specialist
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              size="lg"
            />
            <Text style={{ fontSize: 11, color: Colors.text3, marginTop: 6 }}>
              {t("tapAdjust")}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t("writeReview")}</Text>
            <TextInput
              style={[
                CommonStyles.input,
                { height: 80, textAlignVertical: "top", paddingTop: 10 },
              ]}
              placeholder={t("reviewPlaceholder")}
              value={remark}
              onChangeText={setRemark}
              multiline
              placeholderTextColor={Colors.text3}
            />
          </View>
        </Card>

        {/* Top Qualities */}
        <Card label={t("topQualities")}>
          <Text style={{ fontSize: 11, color: Colors.text3, marginBottom: 10 }}>
            Select up to 3
          </Text>
          <View style={styles.qualityGrid}>
            {QUALITY_OPTIONS.map((q) => {
              const selected = selectedQualities.includes(q);
              return (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.qualityChip,
                    selected && styles.qualityChipSelected,
                  ]}
                  onPress={() => toggleQuality(q)}
                >
                  <Text
                    style={[
                      styles.qualityChipText,
                      selected && styles.qualityChipTextSelected,
                    ]}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Rate Overall */}
        <Card label={t("rateService")}>
          <View style={styles.rateGrid}>
            {[
              { label: t("punctuality"), stars: 5 },
              { label: t("workQuality"), stars: 5 },
              { label: t("communication"), stars: 4 },
              { label: t("valueForMoney"), stars: 4 },
            ].map(({ label, stars }) => (
              <View key={label} style={styles.rateCell}>
                <Text
                  style={{ fontSize: 11, color: Colors.text3, marginBottom: 4 }}
                >
                  {label}
                </Text>
                <StarRating value={stars} size="sm" />
              </View>
            ))}
          </View>
        </Card>

        {/* Use Again */}
        <Card label={t("useAgain")}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={[
                styles.yesNoBtn,
                useAgain === true && styles.yesNoBtnSelected,
              ]}
              onPress={() => setUseAgain(true)}
            >
              <Text style={{ fontSize: 20, marginBottom: 4 }}>👍</Text>
              <Text
                style={[
                  styles.yesNoBtnText,
                  useAgain === true && { color: Colors.brand },
                ]}
              >
                {t("yes")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.yesNoBtn,
                useAgain === false && styles.yesNoBtnDanger,
              ]}
              onPress={() => setUseAgain(false)}
            >
              <Text style={{ fontSize: 20, marginBottom: 4 }}>👎</Text>
              <Text
                style={[
                  styles.yesNoBtnText,
                  useAgain === false && { color: Colors.red },
                ]}
              >
                {t("no")}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <AppButton
          label={t("submitFeedback")}
          onPress={handleSubmit}
          loading={loading}
        />
        <AppButton
          label={t("skipForNow")}
          onPress={() => router.push("/home")}
          variant="outline"
          style={{ marginTop: 0 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },
  successHeader: { alignItems: "center", paddingVertical: 16 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.greenBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  successTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  successSub: { fontSize: 14, color: Colors.text2, marginTop: 4 },
  field: { marginBottom: 12 },
  rateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rateCell: {
    width: "47%",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 10,
    alignItems: "center",
  },
  qualityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  qualityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderMd,
    backgroundColor: Colors.pageBg,
  },
  qualityChipSelected: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandBg,
  },
  qualityChipText: { fontSize: 12, fontWeight: "500", color: Colors.text2 },
  qualityChipTextSelected: { color: Colors.brandDark },
  yesNoBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.borderMd,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: "center",
  },
  yesNoBtnSelected: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandBg,
  },
  yesNoBtnDanger: { borderColor: Colors.red, backgroundColor: Colors.redBg },
  yesNoBtnText: { fontSize: 14, fontWeight: "600", color: Colors.text2 },
});
