import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 30 }}>
        Welcome Customer
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/login")}
        style={{
          backgroundColor: "#007AFF",
          padding: 15,
          borderRadius: 8,
          width: "100%",
          marginBottom: 15,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text
          style={{
            color: "#007AFF",
            fontSize: 16,
            textDecorationLine: "underline",
          }}
        >
          New customer? Register here
        </Text>
      </TouchableOpacity>
    </View>
  );
}