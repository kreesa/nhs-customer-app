import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { mapPickerStore } from '../src/store/mapPickerStore';

export default function MapPickerScreen() {
  const params = useLocalSearchParams<{
    initialLatitude?: string;
    initialLongitude?: string;
  }>();

  const hasInitialParams = !!(params.initialLatitude && params.initialLongitude);

  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(
    hasInitialParams
      ? { latitude: parseFloat(params.initialLatitude!), longitude: parseFloat(params.initialLongitude!) }
      : null
  );
  const [region, setRegion] = useState<Region | null>(
    hasInitialParams
      ? {
          latitude: parseFloat(params.initialLatitude!),
          longitude: parseFloat(params.initialLongitude!),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : null
  );
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [initializing, setInitializing] = useState(!hasInitialParams);

  // On mount — if no initial coords were passed, fetch device's current location
  useEffect(() => {
    if (!hasInitialParams) {
      fetchCurrentLocation();
    }
  }, []);

  useEffect(() => {
    if (marker) {
      reverseGeocode(marker.latitude, marker.longitude);
    }
  }, [marker]);

  const fetchCurrentLocation = async () => {
    setInitializing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Location permission is required to pin your current location. Please enable it or tap manually on the map.'
        );
        // Fall back to a neutral starting point only if permission denied
        setMarker({ latitude: 27.7172, longitude: 85.3240 });
        setRegion({ latitude: 27.7172, longitude: 85.3240, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = loc.coords;
      setMarker({ latitude, longitude });
      setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      Alert.alert('Error', 'Could not get current location. Please tap on the map to pin manually.');
    } finally {
      setInitializing(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setReversing(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results[0]) {
        const r = results[0];
        const parts = [r.street, r.district, r.city, r.region].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setReversing(false);
    }
  };

  const goToMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location permission in settings.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = loc.coords;
      setMarker({ latitude, longitude });
      setRegion((r) => r ? { ...r, latitude, longitude } : { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      Alert.alert('Error', 'Could not get location. Pin manually on the map.');
    } finally {
      setLocating(false);
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (!marker) return;
    const isCoordFallback = address.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/);

    mapPickerStore.set({
      latitude: marker.latitude,
      longitude: marker.longitude,
      address: isCoordFallback ? '' : address,
    });
    router.back();
  };

  // Show loading screen while fetching device location
  if (initializing || !marker || !region) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 12, fontSize: 14 }}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Pin your location</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker coordinate={marker} pinColor="#185FA5" />
      </MapView>

      {/* My location FAB */}
      <TouchableOpacity
        style={styles.myLocBtn}
        onPress={goToMyLocation}
        disabled={locating}
      >
        {locating
          ? <ActivityIndicator size="small" color="#185FA5" />
          : <Text style={{ fontSize: 22 }}>📍</Text>
        }
      </TouchableOpacity>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <Text style={styles.hint}>Tap the map to drop a pin</Text>

        <View style={styles.addressRow}>
          {reversing
            ? <ActivityIndicator size="small" color="#185FA5" />
            : <Text style={{ fontSize: 16 }}>📌</Text>
          }
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Resolving address...'}
          </Text>
        </View>

        <Text style={styles.coordText}>
          {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
        </Text>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          disabled={reversing}
        >
          <Text style={styles.confirmText}>✓  Confirm this location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C447C',
    paddingHorizontal: 16, height: 52,
  },
  backBtn: { width: 80 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  topbarTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  map: { flex: 1 },
  myLocBtn: {
    position: 'absolute', right: 16, bottom: 230,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4, elevation: 5,
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 16, paddingBottom: 32,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  hint: { fontSize: 12, color: '#9A9A9A', textAlign: 'center', marginBottom: 14 },
  addressRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, marginBottom: 8,
  },
  addressText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#181818', lineHeight: 20 },
  coordText: { fontSize: 11, color: '#9A9A9A', fontFamily: 'monospace', marginBottom: 16 },
  confirmBtn: {
    backgroundColor: '#185FA5', borderRadius: 12,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});