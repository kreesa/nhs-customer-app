import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { categoryApi, serviceApi } from "../src/services/api";
import { ServiceRequest, ServiceCategory, ServiceSubCategory } from "../src/types";
import { Badge } from "../src/components/ui";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

type SortOption = "newest" | "oldest" | "scheduled_asc" | "scheduled_desc";

const STATUS_OPTIONS = [
  { key: "all", label: "All statuses" },
  { key: "pending", label: "Pending" },
  { key: "assigned", label: "Assigned" },
  { key: "en_route", label: "En route" },
  { key: "hold", label: "Hold" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "scheduled_asc", label: "Scheduled (earliest first)" },
  { key: "scheduled_desc", label: "Scheduled (latest first)" },
];

function getStatusBadgeVariant(
  status: string
): "success" | "warning" | "danger" | "info" | "default" {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success";
    case "pending":
    case "hold":
      return "warning";
    case "cancelled":
      return "danger";
    case "assigned":
    case "en_route":
      return "info";
    default:
      return "default";
  }
}

// Basic YYYY-MM-DD validator so bad input doesn't silently break filtering
function isValidDateString(value: string) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value).getTime());
}

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

export default function ServicesScreen() {
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subCategoriesByCategoryId, setSubCategoriesByCategoryId] = useState<
    Record<number, ServiceSubCategory[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

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
      // console.log('service request', servicesRes);
      
      const categoryResponse: any = await categoryApi.getCategories();
      const categoriesRes: ServiceCategory[] = categoryResponse.data ?? [];

      // Fetch subcategories for every category in parallel, keyed by category id
      const subCategoryResults = await Promise.all(
        categoriesRes.map((cat) =>
          categoryApi
          .getSubCategories(cat.id)
          .then((res: any) => [cat.id, res.data ?? []] as const)
        )
      );
      const subCategoryMap: Record<number, ServiceSubCategory[]> = {};
      subCategoryResults.forEach(([catId, subs]) => {
        subCategoryMap[catId] = subs;
      });

      setServices(servicesRes);
      setCategories(categoriesRes);
      setSubCategoriesByCategoryId(subCategoryMap);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load services");
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

  // Flatten every subcategory across all categories into a single id -> name map
  const subCategoryNameById = useMemo(() => {
    const map: Record<number, string> = {};
    Object.values(subCategoriesByCategoryId).forEach((subs) => {
      subs.forEach((sub) => {
        map[sub.id] = sub.name;
      });
    });
    return map;
  }, [subCategoriesByCategoryId]);

  // for select option based on categories
    const categoryOptions = useMemo(
    () => [
      { key: "all", label: "All Categories" },
      ...categories.map((cat) => ({
        key: String(cat.id),
        label: cat.name,
      })),
    ],
    [categories]
  );


  const filteredAndSortedServices = useMemo(() => {
    const fromTime = dateFrom?.getTime() ?? null;
    const toTime =
      dateTo != null
        ? new Date(
            dateTo.getFullYear(),
            dateTo.getMonth(),
            dateTo.getDate(),
            23,
            59,
            59
          ).getTime()
        : null;

    const filtered = services.filter((job) => {
      if (statusFilter !== "all" && job.status?.toLowerCase() !== statusFilter.toLowerCase()) {
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
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "scheduled_asc":
          return new Date(a.scheduled_for ?? 0).getTime() - new Date(b.scheduled_for ?? 0).getTime();
        case "scheduled_desc":
          return new Date(b.scheduled_for ?? 0).getTime() - new Date(a.scheduled_for ?? 0).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [services, statusFilter, sortBy, dateFrom, dateTo]);

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const renderItem = ({ item }: { item: ServiceRequest }) => {
    const categoryName = categoryNameById[item.service_category_id] ?? "Service";
    // Assumes the service record carries the subcategory id under one of these keys
    const subCategoryId = (item as any).sub_category_id ?? (item as any).service_sub_category_id;
    const subCategoryName = subCategoryId ? subCategoryNameById[subCategoryId] : undefined;

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
            <Text style={styles.serviceTitle}>{categoryName}</Text>
            {subCategoryName && <Text style={styles.serviceSubtitle}>{subCategoryName}</Text>}
          </View>

          {/* <Badge label={item.status} variant={getStatusBadgeVariant(item.status)} /> */}
        </View>

        <Text style={styles.serviceDescription}>{item.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>📅 Scheduled</Text>
          <Text style={styles.metaValue}>{item.scheduled_for?.split("T")[0] ?? "—"}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>🆔 Request ID</Text>
          <Text style={styles.metaValue}>#{item.id}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>🕒 Created</Text>
          <Text style={styles.metaValue}>{item.created_at?.split("T")[0] ?? "—"}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>📍 Status</Text>
          <Text style={styles.metaValue}>{item.status}</Text>
        </View>

        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() =>
            router.push({
              pathname: "/track",
              params: { serviceId: item.id },
            })
          }
        >
          <Text style={styles.trackBtnText}>View Details →</Text>
        </TouchableOpacity>
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
      <Text style={styles.pageTitle}>My Services</Text>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status + Category as select dropdowns */}
      <View style={styles.selectRow}>
        <SelectField
          label="Category"
          value={categoryFilter}
          options={categoryOptions}
          onChange={setCategoryFilter}
        />

        <SelectField
          label="Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
        </View>

      {/* Date range filter */}
      <View style={styles.dateRow}>
        <View style={styles.dateInputWrap}>
          <Text style={styles.dateLabel}>Scheduled From</Text>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowFromPicker(true)}
          >
            <Text>
              {dateFrom ? formatDate(dateFrom) : "Select Date"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateInputWrap}>
          <Text style={styles.dateLabel}>Scheduled To</Text>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowToPicker(true)}
          >
            <Text>
              {dateTo ? formatDate(dateTo) : "Select Date"}
            </Text>
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
            <Text style={styles.clearDatesText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dateRow}>
        <SelectField label="Sort by" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
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
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptyText}>
              Try changing filters or create a new service request.
            </Text>
          </View>
        }
      />


      {/* Date Picker */}
      {showFromPicker && (
        <DateTimePicker
          value={dateFrom ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);

            if (selectedDate) {
              setDateFrom(selectedDate);
            }
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

            if (selectedDate) {
              setDateTo(selectedDate);
            }
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

  serviceSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
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

  trackBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#111827",
  },

  trackBtnText: {
    color: "#FFF",
    fontWeight: "600",
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