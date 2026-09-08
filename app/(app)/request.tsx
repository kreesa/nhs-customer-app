import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Colors, CommonStyles, Radius, Spacing } from "../src/components/theme";
import { AppButton, Card, PageHeader } from "../src/components/ui";
import { useLanguage } from "../src/context/LanguageContext";
import { categoryApi, serviceApi } from "../src/services/api";
import { mapPickerStore } from "../src/store/mapPickerStore";
import { ServiceCategory, ServiceSubCategory } from "../src/types";

const TIME_SLOTS = [
  "8:00 – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 – 2:00 PM",
  "2:00 – 4:00 PM",
  "4:00 – 6:00 PM",
  "6:00 – 8:00 PM",
];

export default function Request() {
  // const { user } = useAuth();

  const { t } = useLanguage();

  const { categoryId } = useLocalSearchParams();

  // console.log("CATEGORY ID FROM ROUTE:", categoryId);


  const { showActionSheetWithOptions } = useActionSheet();   // for camera option in pick image and upload

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(
    null,
  );

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [errorCategories, setErrorCategories] = useState("");

  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  // To be Updated
  // const [address, setAddress] = useState(user?.service_address ?? '');
  const [images, setImages] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [errors, setErrors] = useState<{
    category?: string;
    subCategory?: string;
    description?: string;
    address?: string;
    location?: string;
    date?: string;
    slot?: string;
  }>({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        setErrorCategories("");

        const res = await categoryApi.getCategories();

        const list = Array.isArray(res) ? res : res?.data || [];

        setCategories(list);
      } catch (e) {
        setErrorCategories("Failed to load categories");
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Auto-select + sync AFTER categories are loaded
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const id = Number(categoryId);

      const exists = categories.some((c) => c.id === id);

      if (exists) {
        setSelectedCategory(id);
      }
    }
  }, [categoryId, categories]);

  useEffect(() => {
    const loadSubCategories = async () => {
      if (!selectedCategory) return;

      try {
        setLoadingSubCategories(true);

        const res = await categoryApi.getSubCategories(selectedCategory);

        const list = Array.isArray(res) ? res : res?.data || [];

        setSubCategories(list);
        setSelectedSubCategory(null);
      } catch (e) {
        setSubCategories([]);
      } finally {
        setLoadingSubCategories(false);
      }
    };

    loadSubCategories();
  }, [selectedCategory]);

  // Helper to format date as YYYY-MM-DD (avoid toISOString() timezone shift issues)
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedCategory || !selectedSubCategory) {
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        setSlotsError("");
        setSelectedSlot(null); // clear stale selection

        const scheduledFor = formatDate(selectedDate);
        const res = await serviceApi.getAvailableSlots(
          selectedCategory,
          selectedSubCategory,
          scheduledFor,
        );

        const list = Array.isArray(res) ? res : res?.data || [];
        setAvailableSlots(list);
      } catch (e) {
        console.error("Failed to load slots:", e);
        setSlotsError("Failed to load available slots");
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [selectedCategory, selectedSubCategory, selectedDate]);

  // map Picker
  useFocusEffect(
    useCallback(() => {
      // Subscribe when screen comes into focus
      mapPickerStore.subscribe((result) => {
        if (result) {
          setLatitude(result.latitude);
          setLongitude(result.longitude);
          if (result.address) {
            setAddress(result.address); // ← only update address if a real address resolved
          }
          setErrors((prev) => ({ ...prev, location: undefined }));
          mapPickerStore.clear();
        }
      });

      // Cleanup when screen loses focus
      return () => {
        mapPickerStore.subscribe(null);
      };
    }, []),
  );

  const selectedCategoryData = categories.find(
    (c) => c.id === selectedCategory,
  );
  const executionMode = selectedCategoryData?.execution_mode;

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    if (!selectedCategory) {
      newErrors.category = t("selectServiceCategory");
    }

    if (!selectedSubCategory) {
      newErrors.subCategory = t("selectSubCategory");
    }

    if (!description.trim()) {
      newErrors.description = t("describeProblemMsg");
    }

    if (!address.trim()) {
      newErrors.address = t("pinServiceLocation");
    }

    if (!latitude || !longitude) {
      newErrors.location = t("pinServiceLocation");
    }

    if (!selectedDate) {
      newErrors.date = t("selectPreferredDate");
    }

    if (!selectedSlot) {
      newErrors.slot = t("selectTimeSlot");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert(t("error"), t("fillRequiredFields"));
      return;
    }

    const userId = await AsyncStorage.getItem("user_id");

    if (!userId) {
      Alert.alert(t("error"), t("sessionExpiredLoginAgain"));
      return;
    }         

    setLoading(true);
    try {
      // Files are sent directly to /api/jobs as multipart form-data —
      // serviceApi.createRequest handles building the FormData and
      // attaching each image, so no separate upload step is needed here.
      const payload = {
        customer_id: Number(userId),
        service_category_id: selectedCategory,
        service_sub_category_id: selectedSubCategory,
        description: description,
        site_address: address,
        site_longitude: longitude ?? 0,
        site_latitude: latitude ?? 0,
        scheduled_for: selectedDate.toISOString().split("T")[0],
        scheduled_time_slot: selectedSlot,
        execution_mode: executionMode,
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      const req = await serviceApi.createRequest(Number(userId), payload, images);
      // console.log("Number(userId):", JSON.stringify(Number(userId), null, 2));
      // console.log("Request created:", JSON.stringify(req, null, 2));

      setErrors({});

      router.push({
        pathname: "/track",
        params: { serviceId: req.id },
      });
    } catch (err: any) {
      console.error("Submit failed:", JSON.stringify(err, null, 2));

      // Laravel validation errors come as err.body.errors object
      const validationErrors = err?.body?.errors;
      if (validationErrors) {
        const messages = Object.entries(validationErrors)
          .map(
            ([field, msgs]) => `• ${field}: ${(msgs as string[]).join(", ")}`,
          )
          .join("\n");
        Alert.alert("Validation Error", messages);
        return;
      }

      // Single message from server
      if (err?.body?.message) {
        Alert.alert("Server Error", err.body.message);
        return;
      }

      // Fallback
      Alert.alert(
        "Error",
        err.message || "Failed to submit request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // pick image and upload
  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert(t("imagePickerLimitReachedTitle"), t("imagePickerLimitReachedMessage"));
      return;
    }

    const openCamera = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("imagePickerPermissionTitle"), t("imagePickerCameraPermissionMessage"));
        return;
      }
      await launchPicker(() =>
        ImagePicker.launchCameraAsync({
          quality: 0.5,
          allowsEditing: false,
          exif: false,
        })
      );
    };

    const openGallery = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("imagePickerPermissionTitle"), t("imagePickerGalleryPermissionMessage"));
        return;
      }
      await launchPicker(() =>
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.5,
          allowsEditing: false,
          exif: false,
        })
      );
    };

    const launchPicker = async (
      launchFn: () => Promise<ImagePicker.ImagePickerResult>
    ) => {
      try {
        const result = await launchFn();

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const uri = result.assets[0]?.uri;
          if (uri) {
            // Compress + resize before storing
            const compressed = await ImageManipulator.manipulateAsync(
              uri,
              [{ resize: { width: 1080 } }], // scale down, height auto-scales
              { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
            );
            setImages((prev) => [...prev, compressed.uri]);
          }
        }
      } catch (err: any) {
        console.error("Image picker error:", err.message);
        Alert.alert(t("imagePickerErrorTitle"), t("imagePickerErrorMessage"));
      }
    };

    const options = [
      t("imagePickerTakePhoto"),
      t("imagePickerChooseFromGallery"),
      t("commonCancel"),
    ];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) openCamera();
        else if (buttonIndex === 1) openGallery();
      }
    );
  };

  const inputStyle = (name: string) => [
    CommonStyles.input,
    focused === name && { borderColor: Colors.brand },
  ];

  return (
    <View style={CommonStyles.screen}>
      <PageHeader title={t("newRequest")} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Service Details */}
        <Card label={t("serviceDetails")}>
          {/* Category Picker */}
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>
              {t("serviceCategory")} <Text style={styles.required}>*</Text>
            </Text>

            {loadingCategories && <Text>Loading categories...</Text>}
            {errorCategories ? (
              <Text style={{ color: "red" }}>{errorCategories}</Text>
            ) : null}

            {!loadingCategories && categories.length === 0 && (
              <Text>No categories available</Text>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 4 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    selectedCategory === cat.id && styles.chipSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === cat.id && styles.chipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.category ? (
              <Text style={styles.errorText}>{errors.category}</Text>
            ) : null}
          </View>

          {/* Sub-category Picker */}
          {selectedCategory && (
            <View style={styles.field}>
              <Text style={CommonStyles.fieldLabel}>
                {t("subCategory")} <Text style={styles.required}>*</Text>
              </Text>

              {loadingSubCategories && <Text>Loading sub-categories...</Text>}

              {!loadingSubCategories && subCategories.length === 0 && (
                <Text>No sub-categories available</Text>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 4 }}
              >
                {subCategories.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.chip,
                      selectedSubCategory === sub.id && styles.chipSelected,
                    ]}
                    onPress={() => {
                      setSelectedSubCategory(sub.id);
                      setErrors((prev) => ({
                        ...prev,
                        subCategory: undefined,
                      }));
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedSubCategory === sub.id &&
                          styles.chipTextSelected,
                      ]}
                    >
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.subCategory ? (
                <Text style={styles.errorText}>{errors.subCategory}</Text>
              ) : null}
            </View>
          )}

          {/* Description */}
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>
              {t("describeProblem")} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                CommonStyles.input,
                { height: 80, textAlignVertical: "top", paddingTop: 10 },
                focused === "desc" && { borderColor: Colors.brand },
                errors.description && styles.inputError,
              ]}
              placeholder={t("problemPlaceholder")}
              value={description}
              onChangeText={(val) => {
                setDescription(val);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              onFocus={() => setFocused("desc")}
              onBlur={() => setFocused(null)}
              multiline
              placeholderTextColor={Colors.text3}
            />
            {errors.description ? (
              <Text style={styles.errorText}>{errors.description}</Text>
            ) : null}
          </View>
        </Card>

        {/* Location */}
        <Card label={`${t("serviceLocation")} *`}>
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>
              {t("fullAddress")} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                ...inputStyle("addr"),
                errors.location && styles.inputError,
              ]}
              value={address}
              onChangeText={(val) => {
                setAddress(val);
                setErrors((prev) => ({ ...prev, address: undefined }));
              }}
              onFocus={() => setFocused("addr")}
              onBlur={() => setFocused(null)}
              placeholderTextColor={Colors.text3}
              editable={false}
            />
          </View>
          {/* Map placeholder */}
          <View>
            <TouchableOpacity
              style={styles.mapTrigger}
              onPress={() =>
                router.push({
                  pathname: "/mappicker",
                  params: {
                    initialLatitude: latitude ? String(latitude) : "",
                    initialLongitude: longitude ? String(longitude) : "",
                  },
                })
              }
              activeOpacity={0.9}
            >
              {latitude && longitude ? (
                <>
                  <MapView
                    style={StyleSheet.absoluteFill}
                    region={{
                      latitude,
                      longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pointerEvents="none"
                  >
                    <Marker
                      coordinate={{ latitude, longitude }}
                      pinColor="#185FA5"
                    />
                  </MapView>
                  <View style={styles.mapOverlay}>
                    <Text style={styles.mapOverlayText}>
                      📍 {latitude.toFixed(5)}, {longitude.toFixed(5)} · Tap to
                      change
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.mapPh}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📍</Text>
                  <Text
                    style={{
                      color: "#3B6D11",
                      fontSize: 13,
                      fontWeight: "500",
                    }}
                  >
                    Tap to pin your location
                  </Text>
                  <Text
                    style={{
                      color: "#3B6D11",
                      fontSize: 11,
                      opacity: 0.7,
                      marginTop: 2,
                    }}
                  >
                    Required for service request
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.location ? (
              <Text style={styles.errorText}>{errors.location}</Text>
            ) : null}
          </View>
        </Card>

        {/* Photos */}
        <Card label={t("attachPhotos")}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Text
              style={{ fontSize: 28, color: Colors.brand, marginBottom: 4 }}
            >
              📷
            </Text>
            <Text style={{ fontSize: 13, color: Colors.text3 }}>
              {t("uploadTap")}
            </Text>
            <Text style={{ fontSize: 11, color: Colors.text3, marginTop: 2 }}>
              {t("maxFiles")}
            </Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
            >
              {images.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.thumb}
                  onPress={() =>
                    setImages((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  <Image
                    source={{ uri }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                  <View style={styles.thumbDelete}>
                    <Text style={{ color: Colors.white, fontSize: 10 }}>✕</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Card>

        {/* Schedule */}
        <Card label={`${t("preferredSchedule")} *`}>
          <View style={styles.field}>
            <Text style={CommonStyles.fieldLabel}>
              {t("date")} <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[CommonStyles.input, errors.date && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: Colors.text, fontSize: 14 }}>
                {selectedDate.toDateString()}
              </Text>
            </TouchableOpacity>
            {errors.date ? (
              <Text style={styles.errorText}>{errors.date}</Text>
            ) : null}
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) {
                  setSelectedDate(date);
                  setErrors((prev) => ({ ...prev, date: undefined }));
                }
              }}
            />
          )}

          <Text style={[CommonStyles.fieldLabel, { marginBottom: 8 }]}>
            {t("timeSlot")} <Text style={styles.required}>*</Text>
          </Text>

          {!selectedSubCategory ? (
            <Text style={{ color: Colors.text3, fontSize: 12 }}>
              Select a sub-category first
            </Text>
          ) : loadingSlots ? (
            <Text style={{ color: Colors.text3, fontSize: 12 }}>
              Loading available slots...
            </Text>
          ) : slotsError ? (
            <Text style={{ color: "red", fontSize: 12 }}>{slotsError}</Text>
          ) : availableSlots.length === 0 ? (
            <Text style={{ color: Colors.text3, fontSize: 12 }}>
              No slots available for this date
            </Text>
          ) : (
            <View style={styles.slotGrid}>
              {availableSlots.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slot,
                    selectedSlot === slot && styles.slotSelected,
                  ]}
                  onPress={() => {
                    setSelectedSlot(slot);
                    setErrors((prev) => ({ ...prev, slot: undefined }));
                  }}
                >
                  <Text
                    style={[
                      styles.slotText,
                      selectedSlot === slot && styles.slotTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.slot ? (
            <Text style={styles.errorText}>{errors.slot}</Text>
          ) : null}
        </Card>

        <AppButton
          label={t("submitRequest")}
          onPress={handleSubmit}
          loading={loading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },
  field: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderMd,
    backgroundColor: Colors.pageBg,
    marginRight: 8,
  },
  chipSelected: { borderColor: Colors.brand, backgroundColor: Colors.brandBg },
  chipText: { fontSize: 13, fontWeight: "500", color: Colors.text2 },
  chipTextSelected: { color: Colors.brandDark },
  mapPh: {
    backgroundColor: "#d4e8c8",
    borderRadius: Radius.lg,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.borderMd,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 8,
    overflow: "hidden", // ← overflow hidden so image clips to border radius
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbDelete: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    width: "47%",
    borderWidth: 1.5,
    borderColor: Colors.borderMd,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: Colors.pageBg,
  },
  slotSelected: { borderColor: Colors.brand, backgroundColor: Colors.brandBg },
  slotText: { fontSize: 12, fontWeight: "500", color: Colors.text2 },
  slotTextSelected: { color: Colors.brandDark },

  mapTrigger: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.14)",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  mapOverlayText: { color: "#fff", fontSize: 12, fontWeight: "500" },

  required: { color: Colors.red, fontSize: 13 },
  errorText: { color: Colors.red, fontSize: 12, marginTop: 4 },
  inputError: { borderColor: Colors.red },
});