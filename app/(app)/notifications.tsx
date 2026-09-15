import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  deleteNotification,
  getNotifications,
  markNotificationRead,
  NotificationItem,
} from "../src/services/api"; // adjust path to your api.ts

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuFor, setMenuFor] = useState<NotificationItem | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handlePress = async (item: NotificationItem) => {
    if (!item.read_at) {
      // optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      markNotificationRead(item.id).catch(() => {
        // revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read_at: null } : n)),
        );
      });
    }

    router.push({
      pathname: "/track",
      params: { serviceId: String(item.data.data.job_id) },
    });
  };

  const handleDelete = async (item: NotificationItem) => {
    setMenuFor(null);
    const prev = notifications;
    setNotifications((n) => n.filter((x) => x.id !== item.id)); // optimistic

    try {
      await deleteNotification(item.id);
    } catch (err: any) {
      setNotifications(prev); // revert
      Alert.alert("Error", err?.message || "Failed to delete notification.");
    }
  };

  const handleToggleRead = (item: NotificationItem) => {
    setMenuFor(null);

    if (item.read_at) {
      // Mark as unread — client-side only, no API support yet
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read_at: null } : n)),
      );
    } else {
      // Mark as read — persists via API
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      markNotificationRead(item.id).catch(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read_at: null } : n)),
        );
      });
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.item, !item.read_at && styles.itemUnread]}
      onPress={() => handlePress(item)}
      onLongPress={() => setMenuFor(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.data.title}</Text>
        <Text style={styles.message}>{item.data.message}</Text>
      </View>

      <TouchableOpacity
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => setMenuFor(item)}
      >
        <Ionicons name="ellipsis-vertical" size={18} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: "#888" }}>No notifications yet.</Text>
          </View>
        }
      />

      <Modal
        transparent
        visible={!!menuFor}
        animationType="fade"
        onRequestClose={() => setMenuFor(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuFor(null)}
        >
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => menuFor && handleToggleRead(menuFor)}
            >
              <Ionicons
                name={
                  menuFor?.read_at ? "mail-unread-outline" : "mail-open-outline"
                }
                size={18}
                color="#333"
              />
              <Text style={[styles.menuItemText, { color: "#333" }]}>
                {menuFor?.read_at ? "Mark as unread" : "Mark as read"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => menuFor && handleDelete(menuFor)}
            >
              <Ionicons name="trash-outline" size={18} color="#e53935" />
              <Text style={styles.menuItemText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  itemUnread: { backgroundColor: "#f5f9ff" },
  title: { fontWeight: "600", fontSize: 15, marginBottom: 2 },
  message: { color: "#666", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    width: 160,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: { fontSize: 14, color: "#e53935" },
});
