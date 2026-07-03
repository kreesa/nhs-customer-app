import { Stack } from 'expo-router';
import { View } from 'react-native';
import BottomBar from './src/components/bottombar';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <BottomBar />
    </View>
  );
}