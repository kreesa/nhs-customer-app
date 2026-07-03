import { Stack } from "expo-router";
import { View } from "react-native";
import { LanguageProvider } from "./src//context/LanguageContext";
import BottomBar from "./src/components/bottombar";

export default function AppLayout() {
  return (
    <LanguageProvider>
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
    </LanguageProvider>
  );
}
