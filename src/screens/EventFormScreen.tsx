import React, { useLayoutEffect, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../stores/auth-store";
import { useMyEvents } from "../stores/my-event-store";
import { EventFormData } from "../types/event";
import { eventService } from "../services/eventService";
import {
  validateEventForm,
  hasValidationErrors,
  EventFormErrors,
} from "../utils/validations/eventValidation";
import { format } from "date-fns";
import Icon from "react-native-vector-icons/Ionicons";
import { useDateTimePicker } from "../hooks/useDateTimePicker";
import { useImagePicker } from "../hooks/useImagePicker";

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type EventFormScreenRouteProp = RouteProp<RootStackParamList, "EventForm">;
type EventFormScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EventForm"
>;

const initialFormData: Omit<EventFormData, "date" | "time" | "imageUrl"> & {
  date?: string;
  time?: string;
} = {
  title: "",
  description: "",
  location: "",
  address: "",
  price: "",
  category: "",
  capacity: "",
  tags: "",
  userMaxTicketPurchase: "10",
};

export default function EventFormScreen() {
  const navigation = useNavigation<EventFormScreenNavigationProp>();
  const route = useRoute<EventFormScreenRouteProp>();
  const { session } = useAuth();
  const { createEvent, updateEvent, isSyncing } = useMyEvents();

  const eventId = route.params?.eventId;
  const isEditMode = !!eventId;

  const [formData, setFormData] =
    useState<Omit<EventFormData, "date" | "time" | "imageUrl">>(
      initialFormData
    );
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);

  const {
    imageAsset,
    displayImageUri,
    currentImageUrl,
    setCurrentImageUrl,
    handleChoosePhoto,
    imageError,
    clearImageError,
  } = useImagePicker();

  const {
    selectedDateTime,
    setSelectedDateTime,
    formattedDate,
    formattedTime,
    showPicker,
    renderDateTimePicker,
  } = useDateTimePicker(new Date());

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Event" : "Create Event",
      headerStyle: { backgroundColor: "#FFFFFF" },
      headerTitleStyle: { fontWeight: "bold", fontSize: 18, color: "#111827" },
      headerShadowVisible: false,
      headerTintColor: "#6366f1",
    });
  }, [navigation, isEditMode]);

  // Fetch Data for Edit Mode
  useEffect(() => {
    if (isEditMode && eventId) {
      const fetchEventData = async () => {
        setIsLoading(true);
        try {
          const event = await eventService.fetchEventById(eventId);
          if (event) {
            const eventDate = new Date(event.startTime);
            setSelectedDateTime(eventDate); // Set date in the hook
            setCurrentImageUrl(event.imageUrl || null); // Set image in the hook

            // Populate form with existing data
            setFormData({
              title: event.title,
              description: event.description,
              location: event.location,
              address: event.address || "",
              price: event.price.toString(),
              category: event.category,
              capacity: event.capacity?.toString() || "",
              tags: event.tags?.join(", ") || "",
              userMaxTicketPurchase:
                event.userMaxTicketPurchase?.toString() || "10",
            });
          } else {
            Alert.alert("Error", "Could not find event details.");
            navigation.goBack();
          }
        } catch (error: any) {
          Alert.alert("Error", error.message || "Failed to load event data.");
          navigation.goBack();
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventData();
    } else {
      // For create mode, set initial time slightly in future
      const now = new Date();
      now.setHours(now.getHours() + 1); // e.g., default to 1 hour from now
      now.setMinutes(0); // Round down minutes
      setSelectedDateTime(now); // Set default date in the hook
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, isEditMode, navigation]);

  // Alert for image errors from the hook
  useEffect(() => {
    if (imageError) {
      Alert.alert("Upload Failed", imageError);
      clearImageError(); // Clear the error after showing it
    }
  }, [imageError, clearImageError]);

  const handleInputChange = (
    name: keyof Omit<EventFormData, "date" | "time" | "imageUrl">,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof EventFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  const handleSubmit = async () => {
    if (isSyncing) return; // Prevent double submit
    if (!session) {
      Alert.alert("Login Required", "Please login to manage events.");
      return;
    }

    const dataToValidate: EventFormData = {
      ...formData,
      date: formattedDate,
      time: formattedTime,
    };

    const validationErrors = validateEventForm(dataToValidate);

    // Image presence validation (checks displayImageUri from hook)
    if (!isEditMode && !displayImageUri) {
      validationErrors.imageUrl = "Event image is required.";
    }

    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      Alert.alert("Validation Error", "Please check the required fields.");
      return;
    }

    // NOTE: No local isSubmitting state. State rely on the store's isSyncing.
    let result = null;

    try {
      if (isEditMode && eventId) {
        result = await updateEvent(
          eventId,
          dataToValidate,
          currentImageUrl || "", // Pass currentImageUrl from hook
          imageAsset // Pass imageAsset from hook
        );
      } else {
        result = await createEvent(dataToValidate, imageAsset); // Pass imageAsset from hook
      }

      if (result) {
        Alert.alert(
          "Success",
          `Event ${isEditMode ? "updated" : "created"} successfully!`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      // This catch block is a fallback, but the store should handle most errors.
      console.error("Unexpected submit error:", err);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/*  Image Picker  */}
            <View style={styles.fieldGroup}>
              <Text style={styles.groupTitle}>Event Image</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cover Image *</Text>
                <TouchableOpacity
                  style={[
                    styles.imagePicker,
                    errors.imageUrl && styles.inputError,
                  ]}
                  onPress={handleChoosePhoto}
                  disabled={isSyncing} // Disable while submitting
                >
                  {displayImageUri ? (
                    <Image
                      source={{ uri: displayImageUri }}
                      style={styles.imagePreview}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Icon name="image-outline" size={40} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderText}>
                        Tap to select image
                      </Text>
                      <Text style={styles.imageSizeText}>
                        (Max 2MB, JPG/PNG)
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {errors.imageUrl && (
                  <Text style={styles.errorText}>{errors.imageUrl}</Text>
                )}
              </View>
            </View>

            {/*  Event Info Group  */}
            <View style={styles.fieldGroup}>
              <Text style={styles.groupTitle}>Event Information</Text>
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Title *</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  value={formData.title}
                  onChangeText={(v) => handleInputChange("title", v)}
                  placeholder="e.g., Tech Conference 2026"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>
              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    errors.description && styles.inputError,
                  ]}
                  value={formData.description}
                  onChangeText={(v) => handleInputChange("description", v)}
                  multiline
                  placeholder="Provide details..."
                  placeholderTextColor="#9CA3AF"
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </View>
              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={[styles.input, errors.category && styles.inputError]}
                  value={formData.category}
                  onChangeText={(v) => handleInputChange("category", v)}
                  placeholder="e.g., Music, Technology"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.category && (
                  <Text style={styles.errorText}>{errors.category}</Text>
                )}
              </View>
              {/* Tags */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tags</Text>
                <TextInput
                  style={[styles.input, errors.tags && styles.inputError]}
                  value={formData.tags}
                  onChangeText={(v) => handleInputChange("tags", v)}
                  placeholder="Comma-separated (e.g., tech, free food)"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.tags && (
                  <Text style={styles.errorText}>{errors.tags}</Text>
                )}
              </View>
            </View>

            {/*  Date/Time Group  */}
            <View style={styles.fieldGroup}>
              <Text style={styles.groupTitle}>Date & Time</Text>
              <View style={styles.row}>
                {/* Date */}
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Date *</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerInput,
                      errors.date && styles.inputError,
                    ]}
                    onPress={() => showPicker("date")}
                  >
                    <Icon
                      name="calendar-outline"
                      size={20}
                      color="#6B7280"
                      style={styles.pickerIcon}
                    />
                    <Text style={styles.pickerText}>{formattedDate}</Text>
                  </TouchableOpacity>
                  {errors.date && (
                    <Text style={styles.errorText}>{errors.date}</Text>
                  )}
                </View>
                {/* Time */}
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Time *</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerInput,
                      errors.time && styles.inputError,
                    ]}
                    onPress={() => showPicker("time")}
                  >
                    <Icon
                      name="time-outline"
                      size={20}
                      color="#6B7280"
                      style={styles.pickerIcon}
                    />
                    <Text style={styles.pickerText}>{formattedTime}</Text>
                  </TouchableOpacity>
                  {errors.time && (
                    <Text style={styles.errorText}>{errors.time}</Text>
                  )}
                </View>
              </View>
            </View>

            {/*  Location Group  */}
            <View style={styles.fieldGroup}>
              <Text style={styles.groupTitle}>Location</Text>
              {/* Venue */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Venue Name *</Text>
                <TextInput
                  style={[styles.input, errors.location && styles.inputError]}
                  value={formData.location}
                  onChangeText={(v) => handleInputChange("location", v)}
                  placeholder="e.g., Grand Hall"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.location && (
                  <Text style={styles.errorText}>{errors.location}</Text>
                )}
              </View>
              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  value={formData.address}
                  onChangeText={(v) => handleInputChange("address", v)}
                  placeholder="Street, City (optional)"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.address && (
                  <Text style={styles.errorText}>{errors.address}</Text>
                )}
              </View>
            </View>

            {/*  Tickets Group  */}
            <View style={styles.fieldGroup}>
              <Text style={styles.groupTitle}>Tickets</Text>
              <View style={styles.row}>
                {/* Price */}
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Price *</Text>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    value={formData.price}
                    onChangeText={(v) => handleInputChange("price", v)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                  />
                  {errors.price && (
                    <Text style={styles.errorText}>{errors.price}</Text>
                  )}
                </View>
                {/* Capacity */}
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Capacity</Text>
                  <TextInput
                    style={[styles.input, errors.capacity && styles.inputError]}
                    value={formData.capacity}
                    onChangeText={(v) => handleInputChange("capacity", v)}
                    keyboardType="number-pad"
                    placeholder="e.g., 100"
                    placeholderTextColor="#9CA3AF"
                  />
                  {errors.capacity && (
                    <Text style={styles.errorText}>{errors.capacity}</Text>
                  )}
                </View>
              </View>
              {/* Ticket Limit */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ticket Limit Per User *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.userMaxTicketPurchase && styles.inputError,
                  ]}
                  value={formData.userMaxTicketPurchase}
                  onChangeText={(v) =>
                    handleInputChange("userMaxTicketPurchase", v)
                  }
                  keyboardType="number-pad"
                  placeholder="e.g., 5"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.userMaxTicketPurchase && (
                  <Text style={styles.errorText}>
                    {errors.userMaxTicketPurchase}
                  </Text>
                )}
              </View>
            </View>

            {/*  Submit Button  */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSyncing && styles.submitButtonDisabled, // Use isSyncing
              ]}
              onPress={handleSubmit}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditMode ? "Save Changes" : "Create Event"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              * Required fields.{" "}
              {!isEditMode && "Your event may be reviewed before publishing."}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderDateTimePicker()}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  formContainer: { paddingHorizontal: 20, paddingTop: 16 },
  fieldGroup: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#4B5563",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    minHeight: 50,
  },
  inputError: { borderColor: "#EF4444" },
  errorText: { color: "#EF4444", fontSize: 13, marginTop: 5 },
  textArea: { minHeight: 100, paddingTop: 14, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 16 },
  halfWidth: { flex: 1 },
  pickerInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  pickerIcon: { marginRight: 10, color: "#6B7280" },
  pickerText: { fontSize: 16, color: "#111827", flex: 1 },
  submitButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 52,
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#A5B4FC",
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  disclaimer: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  // Image Picker Styles
  imagePicker: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  imageSizeText: { marginTop: 4, fontSize: 12, color: "#9CA3AF" },
});
