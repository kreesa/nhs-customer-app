import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors, CommonStyles, Radius, Spacing } from "../src/components/theme";
import {
  AppButton,
  PageHeader,
  Avatar,
  Badge,
  Card,
  InvoiceTotal,
  RowKV
} from "../src/components/ui";
import { useLanguage } from "../src/context/LanguageContext";
import { serviceApi } from "../src/services/api";
import {
  getStatusBadgeColor,
  getStatusLabel,
  getTimelineProgress,
} from "../src/utils/serviceStatus";
import { haversineKm, estimateEtaMinutes } from "../src/utils/location";
import { PricingSummary, ServiceRequest, TrackingData, InvoiceSummary } from "../src/types";


const TIMELINE_STEPS = [
  { key: "requestReceived", label: "Request Received" },
  { key: "technicianAssigned", label: "Technician Assigned" },
  { key: "enRouteLocation", label: "En Route to your Location" },
  { key: "workInProgress", label: "Work in Progress" },
  { key: "completed", label: "Work Completed" },
] as const;

function getStepStatus(
  job: ServiceRequest,
  index: number,
): "done" | "current" | "todo" {
  const { activeIndex, isCancelled } = getTimelineProgress(job.status);

  // Cancelled is a terminal state outside the linear flow — don't try to
  // place it on the stepper. Handle it as a banner/badge instead, see below.
  if (isCancelled) return "todo";

  if (index < activeIndex) return "done";
  if (index === activeIndex) return "current";
  return "todo";
}

function TimelineDot({
  label,
  state,
  isLast,
}: {
  label: string;
  state: "done" | "current" | "todo";
  isLast: boolean;
}) {
  return (
    <View style={styles.tlItem}>
      <View style={styles.tlDotCol}>
        <View
          style={[
            styles.tlDot,
            state === "done" && styles.tlDotDone,
            state === "current" && styles.tlDotCurrent,
            state === "todo" && styles.tlDotTodo,
          ]}
        >
          {state === "done" && (
            <Text style={{ color: "#fff", fontSize: 11 }}>✓</Text>
          )}
        </View>
        {!isLast && <View style={styles.tlLine} />}
      </View>
      <View style={styles.tlContent}>
        <Text style={styles.tlTitle}>{label}</Text>
      </View>
    </View>
  );
}

export default function Track() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const servId = Number(serviceId);

  const { t } = useLanguage();

  const [job, setJob] = useState<ServiceRequest | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingLoading, setApprovingLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const trackInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash" | null>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadJob = async () => {
    try {
      const data = await serviceApi.getRequest(servId);
      setJob(data);

      // Load pricing when quotation is sent
      if (data.send_quotation_to_customer && !pricing) {
        const p = await serviceApi.getPricingDetails(servId);
        setPricing(p);
      }

      // Start tracking if en-route
      if (data.technician_en_route && data.assigned_technician) {
        const track = await serviceApi.trackTechnician(
          servId,
          data.assigned_technician.id,
        );
        console.log("tracking data:", JSON.stringify(track, null, 2)); // ← add this temporarily
        setTracking(track);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // ← derived values, recompute whenever tracking or job changes
  const distanceKm = useMemo(() => {
    if (
      tracking?.latitude == null ||
      tracking?.longitude == null ||
      job?.site_latitude == null ||
      job?.site_longitude == null
    ) {
      return null;
    }
    return haversineKm(
      tracking.latitude,
      tracking.longitude,
      job.site_latitude,
      job.site_longitude,
    );
  }, [tracking, job]);

  const etaMinutes = useMemo(
    () => (distanceKm != null ? estimateEtaMinutes(distanceKm) : null),
    [distanceKm],
  );

  useEffect(() => {
    loadJob();
    // Poll every 30s when job is active
    trackInterval.current = setInterval(loadJob, 30000);
    return () => {
      if (trackInterval.current) clearInterval(trackInterval.current);
    };
  }, [servId]);

  // Invoice and Payment Handling
  useEffect(() => {
    const loadInvoice = async () => {
      if (job?.status !== "completed") return;
      setInvoiceLoading(true);
      try {
        const data = await serviceApi.getInvoice(job.id); // adjust to your actual customer-side API function
        setInvoice(data);
      } catch (e) {
        console.error("Failed to load invoice:", e);
      } finally {
        setInvoiceLoading(false);
      }
    };
    loadInvoice();
  }, [job?.status, job?.id]);

  const pickProofImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: false,
        exif: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setProofUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Error", "Could not open image picker.");
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method.");
      return;
    }
    if (!proofUri) {
      Alert.alert("Error", "Please upload proof of payment.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const uploaded = await uploadApi.uploadImage(proofUri);
      await serviceApi.submitPayment(job.id, {
        payment_method: paymentMethod,
        proof_url: uploaded.url,
      });
      Alert.alert("Submitted", "Payment details submitted successfully.");
      router.back(); // or refresh job state, depending on your flow
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };


  // Handle approve decline not in use
  const handleApprove = async () => {
    if (!job) return;
    setApprovingLoading(true);
    try {
      await serviceApi.agreeToQuotation(servId);

      router.push({
        pathname: "/payment",
        params: { serviceId: servId },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setApprovingLoading(false);
    }
  };

  const handleDecline = async () => {
    Alert.alert(t("decline"), t("declineConfirmationMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("decline"),
        style: "destructive",
        onPress: async () => {
          await serviceApi.declineQuotation(servId);
          Alert.alert(t("declined"), t("technicianHasBeenNotified"));
          router.back();
        },
      },
    ]);
  };

  const handleReport = async () => {
    if (!complaint.trim()) {
      Alert.alert("Error", "Please describe the issue.");
      return;
    }
    setReportLoading(true);
    try {
      await serviceApi.submitComplaint(servId, complaint);
      Alert.alert("Reported", "Admin has been notified about your complaint.");
      setComplaint("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setReportLoading(false);
    }
  };

  // IMPORTANT: bail out before touching `job.*` — job is null until loadJob() resolves
  if (loading || !job) {
    return (
      <View style={CommonStyles.screen}>
        <PageHeader title={t("jobTracker")} onBack={() => router.back()} />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: Colors.text2 }}>{t("loading")}</Text>
        </View>
      </View>
    );
  }

  // Safe from here on — job is guaranteed non-null
  const { activeIndex, isCancelled, isPaid } = getTimelineProgress(job.status);
  const tech = job.assigned_technician;
  const initials =
    tech?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <View style={CommonStyles.screen}>
      <PageHeader title={t("jobTracker")} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadJob();
            }}
            tintColor={Colors.brand}
          />
        }
      >
        {/* General Job Detail */}
        <Card label={t("serviceDetails")}>
          <View style={{ padding: 14 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: Colors.text }}
              >
                {t("serviceRequestNo")} {servId}
              </Text>
              <Badge
                label={getStatusLabel(job.status)}
                variant={getStatusBadgeColor(job.status)}
              />
            </View>
            <RowKV
              label={t("scheduledDate")}
              value={job.scheduled_for?.split("T")[0] ?? "—"}
              last
            />
            <RowKV
              label={t("scheduledTimeSlot")}
              value={job.scheduled_time_slot}
              last
            />
            <RowKV
              label={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 13, color: Colors.text2 }}>
                    {t("estimatedAmount")}
                  </Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      Alert.alert(t("estimatedAmount"), t("estimatedAmountNote"))
                    }
                  >
                    <Ionicons name="information-circle-outline" size={15} color={Colors.text} />
                  </Pressable>
                </View>
              }
              value={job.original_estimate_amount}
              last
            />
          </View>
        </Card>

        {/* Track Job in Progress */}
        {(job.status === "en_route" ||
          job.status === "arrived" ||
          job.status === "started") 
          && (
          <Card label={t("liveTracker")}>
            <View style={styles.mapPh}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>📍</Text>
              <Text
                style={{
                  color: Colors.green,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {job.status === "en_route"
                  ? "Technician is on the way"
                  : job.status === "arrived"
                  ? "Technician has arrived"
                  : "Technician is working on your request"}
              </Text>
              {/* Live GPS distance/ETA hidden for now
              {tracking ? (
                <Text
                  style={{
                    color: Colors.green,
                    fontSize: 11,
                    opacity: 0.8,
                    marginTop: 2,
                  }}
                >
                  {t("kmAway", { km: tracking.distance_km ?? "?" })} ·{" "}
                  {t("etaMinutes", { minutes: tracking.eta_minutes ?? "?" })}
                </Text>
              ) : (
                <Text style={{ color: Colors.green, fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                  Location updates when en route
                </Text>
              )}
              */}
            </View>
            {/* Distance/ETA rows hidden for now */}
            {/* Commented for now - to be uncommented if necessary */}
            {/* <View style={{ padding: 14 }}>
              <RowKV
                label={t("estimatedArrival")}
                value={etaMinutes != null ? `${etaMinutes} ${t("minutes")}` : "—"}
              />
              <RowKV
                label={t("distanceRemaining")}
                value={distanceKm != null ? `${distanceKm.toFixed(1)} km` : "—"}
              />
            </View> */}
            
          </Card>
        )}

        {/* Technician Card */}
        {tech && (
          <Card label={t("assignedTechnician")}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Avatar initials={initials} size={44} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: Colors.text,
                  }}
                >
                  {tech.full_name}
                </Text>
                <Text
                  style={{ fontSize: 12, color: Colors.text2, marginTop: 2 }}
                >
                  {tech.specialization} · {tech.experience_years} yrs exp.
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 3,
                    gap: 4,
                  }}
                >
                  <Text style={{ color: Colors.amber, fontSize: 13 }}>★</Text>
                  <Text style={{ fontSize: 12, color: Colors.text2 }}>
                    {tech.rating} ({tech.total_jobs} jobs)
                  </Text>
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={async () => {
                    const phone = tech.phone_number; // or tech.phone

                    if (!phone) {
                      Alert.alert("Error", "Phone number not available.");
                      return;
                    }

                    const url = `tel:${phone}`;

                    const supported = await Linking.canOpenURL(url);

                    if (supported) {
                      await Linking.openURL(url);
                    } else {
                      Alert.alert("Error", "Unable to make a phone call.");
                    }
                  }}
                >
                  <Text style={{ fontSize: 18 }}>📞</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* Status Timeline */}
        <Card label={t("statusTimeline")}>
          {isCancelled ? (
            <View style={{ padding: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: Colors.text2 }}>
                This request was cancelled
              </Text>
            </View>
          ) : (
            <View style={{ padding: 14 }}>
              {TIMELINE_STEPS.map((step, i) => (
                <TimelineDot
                  key={step.key}
                  label={step.label}
                  state={getStepStatus(job, i)}
                  isLast={i === TIMELINE_STEPS.length - 1}
                />
              ))}
              {isPaid && (
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.green,
                    fontWeight: "600",
                    marginTop: 4,
                  }}
                >
                  Payment received
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* Invoice Generated */}
        {(job.status === "invoiced" || job.status === "paid" || job.status === "completed")  && (
        <Card label="Generated Invoice">
          {invoiceLoading ? (
            <View style={{ padding: 14, alignItems: "center" }}>
              <Text style={{ color: Colors.text2, fontSize: 12 }}>Loading invoice...</Text>
            </View>
          ) : !invoice ? (
            <View style={{ padding: 14 }}>
              <Text style={{ color: Colors.text2, fontSize: 12 }}>
                Invoice not available.
              </Text>
            </View>
          ) : (
                <View style={{ padding: 14 }}>
                  {/* {Number(invoice.subtotal_labor) > 0 && ( */}
                    <RowKV label="Labor" value={`NPR ${Number(invoice.subtotal_labor).toLocaleString()}`} />
                  {/* )}
                  {Number(invoice.subtotal_material) > 0 && ( */}
                    <RowKV label="Material" value={`NPR ${Number(invoice.subtotal_material).toLocaleString()}`} />
                  {/* )}
                  {Number(invoice.subtotal_logistics) > 0 && ( */}
                    <RowKV label="Logistics" value={`NPR ${Number(invoice.subtotal_logistics).toLocaleString()}`} />
                  {/* )}
                  {Number(invoice.commission_amount) > 0 && ( */}
                    <RowKV label="Commission" value={`NPR ${Number(invoice.commission_amount).toLocaleString()}`} />
                  {/* )}
                  {Number(invoice.tax_amount) > 0 && ( */}
                    <RowKV label="Tax" value={`NPR ${Number(invoice.tax_amount).toLocaleString()}`} />
                  {/* )}
                  {Number(invoice.discount_amount) > 0 && ( */}
                    <RowKV label="Discount" value={`- NPR ${Number(invoice.discount_amount).toLocaleString()}`} />
                  {/* )} */}
                  <View
                    style={{
                      borderTopWidth: 1.5,
                      borderTopColor: Colors.borderMd ?? "#D1D5DB",
                      marginTop: 8,
                      paddingTop: 10,
                    }}
                  >
                    <RowKV
                      label="Total"
                      value={`NPR ${Number(invoice.total_amount).toLocaleString()}`}
                      last
                    />
                  </View>
                </View>
          )}
        </Card>
        )}

        {/* Payment */}
        {job.status === "invoiced" && (
        <Card label="Payment">
          <View style={{ padding: 14 }}>
            <Text style={CommonStyles.fieldLabel}>Payment Method</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6, marginBottom: 16 }}>
              <TouchableOpacity
                style={[styles.methodChip, paymentMethod === "online" && styles.methodChipSelected]}
                onPress={() => setPaymentMethod("online")}
              >
                <Text style={[styles.methodChipText, paymentMethod === "online" && styles.methodChipTextSelected]}>
                  Online
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodChip, paymentMethod === "cash" && styles.methodChipSelected]}
                onPress={() => setPaymentMethod("cash")}
              >
                <Text style={[styles.methodChipText, paymentMethod === "cash" && styles.methodChipTextSelected]}>
                  Cash
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={CommonStyles.fieldLabel}>Upload Document</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickProofImage}>
              {proofUri ? (
                <Image source={{ uri: proofUri }} style={{ width: 100, height: 100, borderRadius: 8 }} resizeMode="cover" />
              ) : (
                <>
                  <Text style={{ fontSize: 28, color: Colors.brand, marginBottom: 4 }}>📎</Text>
                  <Text style={{ fontSize: 13, color: Colors.text3 }}>Tap to upload invoice/screenshot</Text>
                </>
              )}
            </TouchableOpacity>

            <AppButton
              label="Submit Payment"
              onPress={handleSubmitPayment}
              loading={submittingPayment}
              style={{ marginTop: 16 }}
            />
          </View>
        </Card>
        )}    

        {/* Quotation Approval */}
        {job.send_quotation_to_customer &&
          !job.agreed_to_quotation &&
          pricing && (
            <Card label={t("quotationApproval")}>
              <View style={styles.warningBanner}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <Text
                  style={{ fontSize: 12, color: Colors.amberText, flex: 1 }}
                >
                  {t("materialCostNote")}
                </Text>
              </View>
              {pricing.items.map((item, i) => (
                <RowKV
                  key={i}
                  label={item.fee_type}
                  value={`NPR ${item.amount.toLocaleString()}`}
                />
              ))}
              <InvoiceTotal label={t("totalEstimate")} amount={pricing.total} />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <AppButton
                  label={t("decline")}
                  onPress={handleDecline}
                  variant="danger"
                  style={{ flex: 1 }}
                />
                <AppButton
                  label={t("approve")}
                  onPress={handleApprove}
                  loading={approvingLoading}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

        {/* Complaint / Urgent Report */}
        <Card label={t("urgentFeedback")}>
          <Text style={{ fontSize: 12, color: Colors.text2, marginBottom: 10 }}>
            {t("urgentLabel")}
          </Text>
          <TextInput
            style={[
              CommonStyles.input,
              { height: 80, textAlignVertical: "top", paddingTop: 10 },
            ]}
            placeholder={t("urgentPlaceholder")}
            value={complaint}
            onChangeText={setComplaint}
            multiline
            placeholderTextColor={Colors.text3}
          />
          <AppButton
            label={t("report")}
            onPress={handleReport}
            loading={reportLoading}
            style={{ marginTop: 12 }}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 90, gap: 12 },
  mapPh: {
    backgroundColor: "#d4e8c8",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.borderMd,
    backgroundColor: Colors.brandBg,
    alignItems: "center",
    justifyContent: "center",
  },
  warningBanner: {
    backgroundColor: Colors.amberBg,
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tlItem: { flexDirection: "row", gap: 12, paddingBottom: 16 },
  tlDotCol: { alignItems: "center", flexShrink: 0 },
  tlDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tlDotDone: { backgroundColor: Colors.brand },
  tlDotCurrent: { backgroundColor: Colors.amber },
  tlDotTodo: {
    backgroundColor: Colors.border,
    borderWidth: 1.5,
    borderColor: Colors.borderMd,
  },
  tlLine: {
    width: 2,
    flex: 1,
    minHeight: 16,
    backgroundColor: Colors.borderMd,
    marginTop: 2,
  },
  tlContent: { flex: 1, paddingTop: 2 },
  tlTitle: { fontSize: 13, fontWeight: "500", color: Colors.text },

  methodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderMd,
    alignItems: "center",
    backgroundColor: Colors.pageBg,
  },
  methodChipSelected: { borderColor: Colors.brand, backgroundColor: Colors.brandBg },
  methodChipText: { fontSize: 13, fontWeight: "500", color: Colors.text2 },
  methodChipTextSelected: { color: Colors.brandDark },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.borderMd,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
  },
});
