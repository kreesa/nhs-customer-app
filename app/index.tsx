import { View, SafeAreaView, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "./src/context/AuthContext";

export default function Index() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.content} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1B4F72" },
  content: { flex: 1, backgroundColor: "#EFEDE7" },
});