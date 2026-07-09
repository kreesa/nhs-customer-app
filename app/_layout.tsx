import { Stack } from "expo-router";
import { View } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import BottomBar from "./src/components/BottomBar";

export default function AppLayout() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,

              // display language toggle in header
              // title: 'NHS Customer App',
              // headerRight: () => <LanguageToggle />,
            }}
          />
        </View>
        <BottomBar />
      </View>
    </AuthProvider>
    </LanguageProvider>
  );
}
