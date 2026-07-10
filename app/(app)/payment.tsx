import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, CommonStyles, Radius, Spacing } from "../src/components/theme";
import {
  AppButton,
  PageHeader,
  Card,
  Divider,
  InvoiceTotal,
  RowKV
} from "../src/components/ui";
import { useLanguage } from "../src/context/LanguageContext";
import { serviceApi, uploadApi } from "../src/services/api";
import { PricingSummary, RootStackParamList } from "../types";

type Props = {
  route: RouteProp<RootStackParamList, "Payment">;
};

export default function Payment() {
  const router = useRouter();
  const { serviceId, technicianId, amount } = useLocalSearchParams();

  const id = Number(serviceId);
  const techId = Number(technicianId);
  const totalAmount = Number(amount);

  const { t } = useLanguage();

  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [method, setMethod] = useState<"Online" | "Cash">("Online");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      setFetching(false);
      return;
    }
    serviceApi
      .getPricingDetails(serviceId)
      .then(setPricing)
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [serviceId]);

  const pickScreenshot = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) setScreenshot(res.assets[0].uri);
  };

  const handleConfirm = async () => {
    if (!serviceId || !pricing) return;
    if (method === "Online" && !screenshot) {
      Alert.alert(
        "Required",
        "Please attach a payment screenshot for online payment.",
      );
      return;
    }
    setLoading(true);
    try {
      let screenshotUrl: string | undefined;
      if (screenshot) {
        const res = await uploadApi.uploadImage(screenshot);
        screenshotUrl = res.url;
      }
      await serviceApi.updatePayment(serviceId, {
        agreed_to_quotation: true,
        total_payable_amount: pricing.total,
        payment_method: method,
        payment_screenshot: screenshotUrl,
      });

      router.push({
        pathname: "/feedback",
        params: {
          serviceId: String(serviceId),
          technicianId: "0",
          amount: String(pricing.total),
        },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  // Fallback demo pricing
  const items = pricing?.items ?? [
    { id: 1, fee_type: "Service fee", amount: 800 },
    { id: 2, fee_type: "Materials", amount: 450 },
    { id: 3, fee_type: "Platform commission", amount: 120 },
    { id: 4, fee_type: "Logistics fee", amount: 0 },
  ];
  const total = pricing?.total ?? items.reduce((s, i) => s + i.amount, 0);

  return (
    <View style={CommonStyles.screen}>
      <PageHeader title={t("payment")} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Invoice */}
        <Card
          label={
            serviceId
              ? `${t("finalInvoice").replace("{{jobId}}", String(serviceId))}`
              : "Invoice"
          }
        >
          {items.map((item, i) => (
            <RowKV
              key={item.id ?? i}
              label={item.fee_type}
              value={`NPR ${item.amount.toLocaleString()}`}
              last={i === items.length - 1}
            />
          ))}
          <Divider />
          <InvoiceTotal label={t("totalPayable")} amount={total} />
        </Card>

        {/* Payment Method */}
        <Card label={t("paymentMethod")}>
          {(["Online", "Cash"] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.payOption,
                method === opt && styles.payOptionSelected,
              ]}
              onPress={() => setMethod(opt)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22 }}>
                {opt === "Online" ? "📱" : "💵"}
              </Text>
              <Text
                style={[
                  styles.payOptionText,
                  method === opt && { color: Colors.brand },
                ]}
              >
                {t(opt.toLowerCase() as "online" | "cash")}
              </Text>
              <View
                style={[
                  styles.radioOuter,
                  method === opt && { borderColor: Colors.brand },
                ]}
              >
                {method === opt && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Screenshot Upload (Online only) */}
        {method === "Online" && (
          <Card label={t("attachScreenshot")}>
            <TouchableOpacity style={styles.uploadBox} onPress={pickScreenshot}>
              <Text
                style={{ fontSize: 28, color: Colors.brand, marginBottom: 4 }}
              >
                📷
              </Text>
              <Text style={{ fontSize: 13, color: Colors.text3 }}>
                {t("uploadTap")}
              </Text>
            </TouchableOpacity>
            {screenshot && (
              <View style={styles.thumbRow}>
                <TouchableOpacity
                  style={styles.thumb}
                  onPress={() => setScreenshot(null)}
                >
                  <Text style={{ fontSize: 22 }}>🖼️</Text>
                  <View style={styles.thumbDelete}>
                    <Text style={{ color: Colors.white, fontSize: 10 }}>✕</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        <AppButton
          label={t("confirmPayment", { amount: total.toLocaleString() })}
          onPress={handleConfirm}
          loading={loading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderMd,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 8,
  },
  payOptionSelected: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandBg,
  },
  payOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borderMd,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.borderMd,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
  },
  thumbRow: { flexDirection: "row", marginTop: 10 },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: Colors.brandBg,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbDelete: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
});
