import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLanguage } from '../src/context/LanguageContext';
import { categoryApi, serviceApi } from "../src/services/api";
import { ServiceRequest, ServiceCategory } from "../src/types";
import { AppButton, PageHeader, Badge } from "../src/components/ui";
import {
  getStatusLabel,
  getStatusBadgeColor,
  matchesStatusFilter,
  STATUS_FILTER_OPTIONS,
} from "../src/utils/serviceStatus";

type SortOption = "latest" | "oldest";


// Generic single-select field styled like a form input. Opens a modal list on tap.
function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { key: T; label: string }[];
  onChange: (val: T) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.key === value)?.label ?? "Select";

  return (
    <View style={styles.selectWrap}>
      <Text style={styles.selectLabel}>{label}</Text>
      <TouchableOpacity style={styles.selectBox} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.selectValueText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Text style={styles.selectChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.modalOption}
                onPress={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    opt.key === value && styles.modalOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.key === value && <Text style={styles.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// Compact toggle button (not a dropdown) for the two sort directions —
// both based on job.scheduled_for. Tapping flips latest <-> oldest.
function SortToggleButton({
  sortBy,
  onToggle,
}: {
  sortBy: SortOption;
  onToggle: () => void;
}) {
  const { t } = useLanguage();

  return (
    <View style={styles.sortToggleWrap}>
      <Text style={styles.selectLabel}>{t('sort')}</Text>
      <TouchableOpacity style={styles.sortToggleBtn} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.sortToggleText}>{sortBy === "latest" ? t('latest') : t('oldest') }</Text>
        <Text style={styles.sortToggleArrow}>{sortBy === "latest" ? "↓" : "↑"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ServicesScreen() {
  const { t } = useLanguage();
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // "all" plus every timeline-step grouping (Request Received, Technician
  // Assigned, En Route, Work in Progress, Work Completed, Payment Made,
  // Cancelled) — matches the groupings used on the tracker page, instead of
  // raw/fictional status values.
  const STATUS_OPTIONS = [
    { key: "all", label: t('all') },
    ...STATUS_FILTER_OPTIONS,
  ];

  const categoryOptions = useMemo(
    () => [
      { key: "all", label: t('all') },
      ...categories.map((cat) => ({
        key: String(cat.id),
        label: cat.name,
      })),
    ],
    [categories]
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const servicesRes: ServiceRequest[] = (await serviceApi.getMyRequests()) ?? [];

      const categoryResponse: any = await categoryApi.getCategories();
      const categoriesRes: ServiceCategory[] = categoryResponse.data ?? [];

      setServices(servicesRes);
      setCategories(categoriesRes);
    } catch (err: any) {
      setError(err?.message ?? t('failedToLoadService'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const categoryNameById = useMemo(() => {
    const map: Record<number, string> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categories]);

  const filteredAndSortedServices = useMemo(() => {
    const fromTime = dateFrom?.getTime() ?? null;
    const toTime =
      dateTo != null
        ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59).getTime()
        : null;

    const filtered = services.filter((job) => {
      if (categoryFilter !== "all" && String(job.service_category_id) !== categoryFilter) {
        return false;
      }

      if (statusFilter !== "all" && !matchesStatusFilter(job.status, statusFilter as any)) {
        return false;
      }

      if (fromTime || toTime) {
        const scheduledTime = job.scheduled_for ? new Date(job.scheduled_for).getTime() : null;
        if (!scheduledTime || isNaN(scheduledTime)) return false;
        if (fromTime && scheduledTime < fromTime) return false;
        if (toTime && scheduledTime > toTime) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.scheduled_for ?? 0).getTime();
      const bTime = new Date(b.scheduled_for ?? 0).getTime();
      return sortBy === "latest" ? bTime - aTime : aTime - bTime;
    });

    return sorted;
  }, [services, categoryFilter, statusFilter, sortBy, dateFrom, dateTo]);

  const renderItem = ({ item }: { item: ServiceRequest }) => {
    const categoryName = categoryNameById[item.service_category_id] ?? t('service');

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() =>
          router.push({
            pathname: "/track",
            params: { serviceId: item.id },
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.serviceHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.serviceTitle}>{t('service')} - {categoryName}</Text>
          </View>

          <Badge label={getStatusLabel(item.status)} variant={getStatusBadgeColor(item.status)} />
        </View>

        <Text style={styles.serviceDescription}>{item.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>📅 {t('scheduledDate')}</Text>
          <Text style={styles.metaValue}>{item.scheduled_for?.split("T")[0] ?? "—"}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>🆔 {t('serviceRequestNo')}</Text>
          <Text style={styles.metaValue}>#{item.id}</Text>
        </View>

        {/* <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>🕒 {t('created')}</Text>
          <Text style={styles.metaValue}>{item.created_at?.split("T")[0] ?? "—"}</Text>
        </View> */}

        {/* <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>📍 {t('status')}</Text>
          <Text style={styles.metaValue}>{item.status}</Text>
        </View> */}

        <AppButton label={t('viewDetails')} variant='outline' onPress={() =>
          router.push({
            pathname: "/track",
            params: { serviceId: item.id },
          })
        } loading={loading} />
        
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title={t("myServices")} onBack={() => router.back()} />
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.retryText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category + Service Timeline + Sort toggle, all in one row */}
      <View style={styles.selectRow}>
        <SelectField
          label={t('serviceCategory')}
          value={categoryFilter}
          options={categoryOptions}
          onChange={setCategoryFilter}
        />

        <SelectField
          label={t('statusTimeline')}
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />

        <SortToggleButton
          sortBy={sortBy}
          onToggle={() => setSortBy((prev) => (prev === "latest" ? "oldest" : "latest"))}
        />
      </View>

      {/* Date range filter */}
      <View style={styles.dateRow}>
        <View style={styles.dateInputWrap}>
          <Text style={styles.dateLabel}>{t('scheduledFrom')}</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowFromPicker(true)}>
            <Text>{dateFrom ? formatDate(dateFrom) : t('selectDate')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateInputWrap}>
          <Text style={styles.dateLabel}>{t('scheduledTo')}</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowToPicker(true)}>
            <Text>{dateTo ? formatDate(dateTo) : t('selectDate')}</Text>
          </TouchableOpacity>
        </View>

        {(dateFrom || dateTo) && (
          <TouchableOpacity
            style={styles.clearDatesBtn}
            onPress={() => {
              setDateFrom(null);
              setDateTo(null);
            }}
          >
            <Text style={styles.clearDatesText}>{t('clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredAndSortedServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>{t('noServiceFound')}</Text>
            <Text style={styles.emptyText}>{t('noServiceTextMessage')}</Text>
          </View>
        }
      />

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={dateFrom ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) setDateFrom(selectedDate);
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={dateTo ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) setDateTo(selectedDate);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },

  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  errorText: {
    color: "#B91C1C",
    flex: 1,
    marginRight: 10,
  },

  retryText: {
    color: "#B91C1C",
    fontWeight: "700",
  },

  selectRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },

  selectWrap: {
    flex: 1,
  },

  selectLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },

  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  selectValueText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 6,
  },

  selectChevron: {
    color: "#6B7280",
    fontSize: 12,
  },

  sortToggleWrap: {
    // Not flex: 1 like the selects — sized to content so it doesn't crowd
    // Category / Service Timeline on narrow screens.
  },

  sortToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },

  sortToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  sortToggleArrow: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  modalSheet: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 8,
  },

  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  modalOptionText: {
    fontSize: 15,
    color: "#111827",
  },

  modalOptionTextActive: {
    fontWeight: "700",
  },

  modalCheck: {
    color: "#111827",
    fontWeight: "700",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },

  dateInputWrap: {
    flex: 1,
  },

  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },

  dateInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    justifyContent: "center",
    minHeight: 38,
  },

  clearDatesBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#ECEFF3",
  },

  clearDatesText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },

  serviceCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  serviceDescription: {
    marginTop: 10,
    color: "#6B7280",
    lineHeight: 20,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  metaLabel: {
    color: "#6B7280",
    fontSize: 13,
  },

  metaValue: {
    fontWeight: "600",
    fontSize: 13,
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },

  emptyEmoji: {
    fontSize: 42,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },

  emptyText: {
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 30,
  },
});