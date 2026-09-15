import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import BottomBar from "../src/components/bottombar";
import { Colors } from "../src/components/theme";

export default function AppLayout() {
  return (
      <View style={styles.container}>
        <ActionSheetProvider>
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
        </ActionSheetProvider>
        <BottomBar />
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  content: { flex: 1 },
});
