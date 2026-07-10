import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";
import { Colors } from "./theme";
import { Topbar } from "./ui";

function getGreeting(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const h = new Date().getHours();
  if (h < 12) return "goodMorning";
  if (h < 17) return "goodAfternoon";
  return "goodEvening";
}

export function AppHeader() {
  const { user, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // console.log("isLoggedIn:", isLoggedIn);
  // console.log("User:", user);

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: Colors.brandDark }}>
      <Topbar
        subtitle={isLoggedIn ? t(getGreeting()) : t('appName')}
        title={isLoggedIn ? (user?.name?.split(" ")[0] ?? "") : t("customerApp")}
        right={
          <View style={styles.rightRow}>
            <LanguageToggle />
            {/* {isLoggedIn && (
              <TouchableOpacity style={{ position: "relative" }}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={Colors.white}
                />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            )} */}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  notifDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
  },
});
