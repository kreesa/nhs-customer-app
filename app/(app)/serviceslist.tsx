import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

export default function ServicesScreen() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const statuses = [
    "all",
    "pending",
    "assigned",
    "en_route",
    "hold",
    "completed",
    "cancelled",
  ];

  const filteredServices = services.filter((job) =>
    statusFilter === "all"
      ? true
      : job.status.toLowerCase() === statusFilter.toLowerCase()
  );

  const sortedServices = [...filteredServices].sort((a, b) => {
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return sortBy === "newest" ? db - da : da - db;
  });

  const renderItem = ({ item }: any) => (
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
        <Text style={styles.serviceTitle}>
          {categories.find((cat) => cat.id === item.service_category_id)?.name}
        </Text>

        <Badge
          label={item.status}
          variant={getStatusBadgeVariant(item.status)}
        />
      </View>

      <Text style={styles.serviceDescription}>{item.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>📅 Scheduled</Text>
        <Text style={styles.metaValue}>
          {item.scheduled_for?.split("T")[0]}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>🆔 Request ID</Text>
        <Text style={styles.metaValue}>#{item.id}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>🕒 Created</Text>
        <Text style={styles.metaValue}>{item.created_at?.split("T")[0]}</Text>
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

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Services</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              statusFilter === status && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === status && styles.filterChipTextActive,
              ]}
            >
              {status.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>

        <TouchableOpacity
          style={[styles.sortChip, sortBy === "newest" && styles.sortChipActive]}
          onPress={() => setSortBy("newest")}
        >
          <Text>Newest</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortChip, sortBy === "oldest" && styles.sortChipActive]}
          onPress={() => setSortBy("oldest")}
        >
          <Text>Oldest</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },

  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ECEFF3",
  },

  filterChipActive: {
    backgroundColor: "#111827",
  },

  filterChipText: {
    fontSize: 13,
  },

  filterChipTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },

  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },

  sortLabel: {
    fontWeight: "600",
  },

  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#ECEFF3",
  },

  sortChipActive: {
    backgroundColor: "#D8DEE8",
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
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    marginRight: 10,
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