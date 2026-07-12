import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";

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
import { PricingSummary, ServiceRequest, TrackingData } from "../types";


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
              label={t("estimatedAmount")}
              value={job.original_estimated_amount}
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
            <View style={{ padding: 14 }}>
              <RowKV
                label={t("estimatedArrival")}
                value={etaMinutes != null ? `${etaMinutes} ${t("minutes")}` : "—"}
              />
              <RowKV
                label={t("distanceRemaining")}
                value={distanceKm != null ? `${distanceKm.toFixed(1)} km` : "—"}
              />
            </View>
            
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
});
