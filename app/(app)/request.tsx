import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { router } from "expo-router";
import { Colors, CommonStyles, Radius, Spacing } from '../src/components/theme';
import { AppButton, Card, Topbar } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { categoryApi, serviceApi, uploadApi } from '../src/services/api';
import { RootStackParamList, ServiceCategory, ServiceSubCategory } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Request'> };

const TIME_SLOTS = [
  '8:00 – 10:00 AM', '10:00 AM – 12:00 PM',
  '12:00 – 2:00 PM', '2:00 – 4:00 PM',
  '4:00 – 6:00 PM', '6:00 – 8:00 PM',
];

export default function Request({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(user?.service_address ?? '');
  const [images, setImages] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    categoryApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      categoryApi.getSubCategories(selectedCategory)
        .then(setSubCategories)
        .catch(console.error);
      setSelectedSubCategory(null);
    }
  }, [selectedCategory]);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit reached', 'Maximum 5 files allowed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) { Alert.alert('Error', 'Please select a service category.'); return; }
    if (!selectedSubCategory) { Alert.alert('Error', 'Please select a sub-category.'); return; }
    if (!description.trim()) { Alert.alert('Error', 'Please describe the problem.'); return; }
    if (!address.trim()) { Alert.alert('Error', 'Please enter a service address.'); return; }
    if (!selectedSlot) { Alert.alert('Error', 'Please select a time slot.'); return; }
    if (!user) return;

    setLoading(true);
    try {
      // Upload images first
      const uploadedUrls: string[] = [];
      for (const uri of images) {
        try {
          const res = await uploadApi.uploadImage(uri);
          uploadedUrls.push(res.url);
        } catch { /* continue even if upload fails */ }
      }

      const req = await serviceApi.createRequest(user.id, {
        service_category: selectedCategory,
        service_subcategory: selectedSubCategory,
        problem_description: description,
        problem_images: uploadedUrls,
        service_location: address,
        longitude: user.longitude ?? 0,
        latitude: user.latitude ?? 0,
        requested_date: selectedDate.toISOString().split('T')[0],
        requested_timeslot: selectedSlot,
      });

      router.push({
        pathname: "/track",
        params: { serviceId: req.id },
      });

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string) => [
    CommonStyles.input,
    focused === name && { borderColor: Colors.brand },
  ];

  return (
    <View style={CommonStyles.screen}>
      <Topbar title={t('newRequest')} onBack={() => router.back()} />

      {/* Step bar */}
      <View style={styles.stepBar}>
        {[1, 2, 3, 4].map((n) => (
          <React.Fragment key={n}>
            <View style={[styles.stepDot, n === 1 ? styles.stepDone : n === 2 ? styles.stepCurrent : styles.stepTodo]}>
              <Text style={[styles.stepNum, n <= 2 && { color: Colors.white }]}>{n}</Text>
            </View>
            {n < 4 && <View style={styles.stepLine} />}
          </React.Fragment>
        ))}
        <Text style={styles.stepLabel}>{t('stepOf', { current: 2, total: 4 })}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Service Details */}
        <Card label={t('serviceDetails')}>
          {/* Category Picker */}
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t('serviceCategory')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, selectedCategory === cat.id && styles.chipSelected]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextSelected]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Fallback if API not yet connected */}
              {categories.length === 0 && ['Plumbing', 'Electrical', 'Appliance', 'General'].map((name, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, selectedCategory === i + 1 && styles.chipSelected]}
                  onPress={() => setSelectedCategory(i + 1)}
                >
                  <Text style={[styles.chipText, selectedCategory === i + 1 && styles.chipTextSelected]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sub-category Picker */}
          {selectedCategory && (
            <View style={styles.field}>
              <Text style={CommonStyles.fieldLabel}>{t('subCategory')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {subCategories.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.chip, selectedSubCategory === sub.id && styles.chipSelected]}
                    onPress={() => setSelectedSubCategory(sub.id)}
                  >
                    <Text style={[styles.chipText, selectedSubCategory === sub.id && styles.chipTextSelected]}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {subCategories.length === 0 && ['Pipe leak', 'Drain blockage', 'Tap replacement', 'Other'].map((name, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.chip, selectedSubCategory === i + 1 && styles.chipSelected]}
                    onPress={() => setSelectedSubCategory(i + 1)}
                  >
                    <Text style={[styles.chipText, selectedSubCategory === i + 1 && styles.chipTextSelected]}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Description */}
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t('describeProblem')}</Text>
            <TextInput
              style={[CommonStyles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }, focused === 'desc' && { borderColor: Colors.brand }]}
              placeholder={t('problemPlaceholder')}
              value={description}
              onChangeText={setDescription}
              onFocus={() => setFocused('desc')}
              onBlur={() => setFocused(null)}
              multiline
              placeholderTextColor={Colors.text3}
            />
          </View>
        </Card>

        {/* Location */}
        <Card label={t('serviceLocation')}>
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t('fullAddress')}</Text>
            <TextInput
              style={inputStyle('addr')}
              value={address}
              onChangeText={setAddress}
              onFocus={() => setFocused('addr')}
              onBlur={() => setFocused(null)}
              placeholderTextColor={Colors.text3}
            />
          </View>
          {/* Map placeholder */}
          <View style={styles.mapPh}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📍</Text>
            <Text style={{ color: Colors.green, fontSize: 13, fontWeight: '500' }}>Add Coordinate</Text>
            <Text style={{ color: Colors.green, fontSize: 11, opacity: 0.7, marginTop: 2 }}>Tap to pin your location</Text>
          </View>
        </Card>

        {/* Photos */}
        <Card label={t('attachPhotos')}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Text style={{ fontSize: 28, color: Colors.brand, marginBottom: 4 }}>📷</Text>
            <Text style={{ fontSize: 13, color: Colors.text3 }}>{t('uploadTap')}</Text>
            <Text style={{ fontSize: 11, color: Colors.text3, marginTop: 2 }}>{t('maxFiles')}</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {images.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.thumb}
                  onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Text style={{ fontSize: 22 }}>🖼️</Text>
                  <View style={styles.thumbDelete}><Text style={{ color: Colors.white, fontSize: 10 }}>✕</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Card>

        {/* Schedule */}
        <Card label={t('preferredSchedule')}>
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>{t('date')}</Text>
            <TouchableOpacity
              style={CommonStyles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: Colors.text, fontSize: 14 }}>
                {selectedDate.toDateString()}
              </Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}

          <Text style={[CommonStyles.fieldLabel, { marginBottom: 8 }]}>{t('timeSlot')}</Text>
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slot, selectedSlot === slot && styles.slotSelected]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <AppButton label={t('submitRequest')} onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },
  stepBar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.brandBg,
  },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: Colors.brand },
  stepCurrent: { backgroundColor: Colors.brandDark },
  stepTodo: { backgroundColor: '#ddd' },
  stepNum: { fontSize: 12, fontWeight: '600', color: Colors.text3 },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.borderMd },
  stepLabel: { fontSize: 11, color: Colors.brand, marginLeft: 8, fontWeight: '500' },
  field: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.borderMd,
    backgroundColor: Colors.pageBg, marginRight: 8,
  },
  chipSelected: { borderColor: Colors.brand, backgroundColor: Colors.brandBg },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.text2 },
  chipTextSelected: { color: Colors.brandDark },
  mapPh: {
    backgroundColor: '#d4e8c8', borderRadius: Radius.lg, height: 120,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadBox: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.borderMd,
    borderRadius: Radius.lg, padding: 20, alignItems: 'center',
  },
  thumb: {
    width: 60, height: 60, borderRadius: 10, backgroundColor: Colors.brandBg,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  thumbDelete: {
    position: 'absolute', top: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.red, alignItems: 'center', justifyContent: 'center',
  },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    width: '47%', borderWidth: 1.5, borderColor: Colors.borderMd,
    borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center',
    backgroundColor: Colors.pageBg,
  },
  slotSelected: { borderColor: Colors.brand, backgroundColor: Colors.brandBg },
  slotText: { fontSize: 12, fontWeight: '500', color: Colors.text2 },
  slotTextSelected: { color: Colors.brandDark },
});
