import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../services/api";
import { Colors } from "./theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

export type MediaItem = {
  id: number;
  path: string;
  mime_type: string;
  collection: string;
  [key: string]: any;
};

export type ViewerState = {
  list: MediaItem[];
  index: number;
} | null;

function MediaImage({
  m,
  token,
  mode,
  onPress,
  style,
}: {
  m: MediaItem;
  token: string | null;
  mode: "thumb" | "viewer";
  onPress?: () => void;
  style?: any;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const res = await fetch(`${BASE_URL}/api/files/${m.path}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) {
          if (data?.file) {
            setUri(`data:${m.mime_type || "image/jpeg"};base64,${data.file}`);
          } else {
            setFailed(true);
          }
        }
      } catch (e) {
        console.log("Media fetch failed:", m.id, e);
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [m.path, token]);

  if (mode === "viewer") {
    return (
      <View style={styles.viewerImageWrapper}>
        {uri ? (
          <Image source={{ uri }} style={styles.viewerImage} resizeMode="contain" />
        ) : (
          <ActivityIndicator size="large" color="#fff" />
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity style={style} onPress={onPress}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.photoThumbImage}
          resizeMode="cover"
          onError={(e) =>
            console.log("Image decode failed:", m.id, e.nativeEvent.error)
          }
        />
      ) : failed ? (
        <View style={[styles.photoThumbImage, styles.photoThumbFallback]}>
          <Text style={{ fontSize: 10, color: Colors.text2 }}>Failed</Text>
        </View>
      ) : (
        <View style={[styles.photoThumbImage, styles.photoThumbFallback]}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export function MediaViewerModal({
  viewer,
  token,
  onClose,
}: {
  viewer: ViewerState;
  token: string | null;
  onClose: () => void;
}) {
  if (!viewer) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerBackdrop}>
        <TouchableOpacity style={styles.viewerClose} onPress={onClose}>
          <Text style={{ color: "#fff", fontSize: 16 }}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: viewer.index * SCREEN_WIDTH, y: 0 }}
        >
          {viewer.list.map((m) => (
            <MediaImage key={m.id} m={m} token={token} mode="viewer" />
          ))}
        </ScrollView>

        {viewer.list.length > 1 && (
          <Text style={styles.viewerCounter}>
            {viewer.index + 1} / {viewer.list.length}
          </Text>
        )}
      </View>
    </Modal>
  );
}

export default MediaImage;

const styles = StyleSheet.create({
  photoThumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  photoThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee",
  },
  viewerImageWrapper: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: "80%",
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCounter: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
});