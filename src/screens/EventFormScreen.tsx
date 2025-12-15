import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useMemo,
  startTransition,
} from "react";
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
  Switch,
  Modal,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { EventFormData } from "../types/event";
import {
  validateEventForm,
  hasValidationErrors,
  EventFormErrors,
} from "../utils/validations/eventValidation";
import Icon from "react-native-vector-icons/Ionicons";
import { useDateTimePicker } from "../hooks/";
import { useImagePicker } from "../hooks/";
import LinearGradient from "react-native-linear-gradient";
import { useMyEventsQuery, useCreateEvent, useUpdateEvent } from "../hooks/";
import { Loader } from "../components/LazyLoaders/loader";
import { Colors } from "../constants/colors";

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
  userMaxTicketPurchase: "1",
  isClosed: false,
  isApproved: false,
};

export default function EventFormScreen() {
  const navigation = useNavigation<EventFormScreenNavigationProp>();
  const route = useRoute<EventFormScreenRouteProp>();

  const eventId = route.params?.eventId;
  const isEditMode = !!eventId;

  const { data: myEvents, isLoading: isLoadingMyEvents } = useMyEventsQuery();
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();

  const isSyncing = isCreating || isUpdating;

  const [formData, setFormData] =
    useState<Omit<EventFormData, "date" | "time" | "imageUrl">>(
      initialFormData
    );
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isClosed, setIsClosed] = useState(false);
  const [hasPopulated, setHasPopulated] = useState(false);

  // Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);

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
    setSelectedDateTime,
    formattedDate,
    formattedTime,
    showPicker,
    renderDateTimePicker,
  } = useDateTimePicker(new Date());

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Memoize the event data to prevent re-renders
  const eventData = useMemo(() => {
    if (isEditMode && eventId && !isLoadingMyEvents && myEvents) {
      return myEvents.find((e) => e.id === eventId);
    }
    return null;
  }, [isEditMode, eventId, isLoadingMyEvents, myEvents]);

  useEffect(() => {
    if (isEditMode && eventData && !hasPopulated) {
      // Prepare all state values first
      const eventDate = new Date(eventData.startTime);
      const closedStatus = eventData.isClosed ?? false;
      const newFormData = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        address: eventData.address ?? "",
        price: eventData.price.toString(),
        category: eventData.category,
        capacity: eventData.capacity?.toString() ?? "",
        tags: eventData.tags?.join(", ") ?? "",
        userMaxTicketPurchase:
          eventData.userMaxTicketPurchase?.toString() ?? "10",
        isClosed: closedStatus,
        isApproved: eventData.isApproved ?? false,
      };

      // Use startTransition to mark updates as non-urgent
      startTransition(() => {
        setSelectedDateTime(eventDate);
        setCurrentImageUrl(eventData.imageUrl || null);
        setFormData(newFormData);
        setIsClosed(closedStatus);
        setIsLoading(false);
        setHasPopulated(true);
      });
    } else if (
      isEditMode &&
      !eventData &&
      !isLoadingMyEvents &&
      !hasPopulated
    ) {
      Alert.alert("Error", "Could not find event details.");
      navigation.goBack();
    } else if (!isEditMode && !hasPopulated) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      startTransition(() => {
        setSelectedDateTime(now);
        setIsLoading(false);
        setHasPopulated(true);
      });
    }
  }, [
    eventData,
    isEditMode,
    navigation,
    isLoadingMyEvents,
    hasPopulated,
    setCurrentImageUrl,
    setSelectedDateTime,
  ]);

  useEffect(() => {
    if (imageError) {
      Alert.alert("Upload Failed", imageError);
      clearImageError();
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

  // 1. Intercept Submit to show modal first
  const handlePreSubmit = () => {
    if (isSyncing) return;

    const dataToValidate: EventFormData = {
      ...formData,
      date: formattedDate,
      time: formattedTime,
    };

    const validationErrors = validateEventForm(dataToValidate);

    if (!isEditMode && !imageAsset) {
      validationErrors.imageUrl = "Event image is required.";
    } else if (!displayImageUri) {
      validationErrors.imageUrl = "Event image is required.";
    }

    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      Alert.alert("Validation Error", "Please check the required fields.");
      return;
    }

    // If valid, show the review modal
    setShowReviewModal(true);
  };

  // 2. Actual Submit Logic (Called from Modal "I Understood")
  const handleConfirmSubmit = () => {
    setShowReviewModal(false); // Close modal

    const dataToValidate: EventFormData = {
      ...formData,
      date: formattedDate,
      time: formattedTime,
    };

    if (isEditMode && eventId) {
      updateEvent(
        {
          eventId,
          formData: dataToValidate,
          currentImageUrl: currentImageUrl ?? "",
          imageAsset: imageAsset ?? null,
          isClosed: isClosed,
        },
        {
          onSuccess: () => {
            Alert.alert(
              "Submitted",
              "Your event update has been submitted for review.",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
          },
        }
      );
    } else {
      createEvent(
        {
          formData: dataToValidate,
          imageAsset: imageAsset ?? null,
        },
        {
          onSuccess: () => {
            Alert.alert(
              "Submitted",
              "Your event has been submitted for review.",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
          },
        }
      );
    }
  };

  if (isLoading || (isEditMode && isLoadingMyEvents)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Loader size={100} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <LinearGradient
          colors={[
            Colors.gradientEventForm1,
            Colors.gradientEventForm2,
            Colors.white,
          ]}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Icon
              name="sparkles-outline"
              size={32}
              color={Colors.white}
              style={styles.sparkleIcon}
            />
            <Text style={styles.headerTitle}>
              {isEditMode ? "Edit Event" : "Create Event"}
            </Text>
            <Text style={styles.headerSubtitle}>
              Share your experience with the world
            </Text>
          </View>
        </LinearGradient>
      </View>
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
            {isEditMode && (
              <View style={styles.fieldGroup}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBadge}>
                    <Icon name="cog-outline" size={20} color={Colors.purple} />
                  </View>
                  <Text style={styles.groupTitle}>Event Status</Text>
                </View>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>Close Event</Text>
                    <Text style={styles.toggleDescription}>
                      {isClosed
                        ? "Event is closed. New tickets cannot be purchased."
                        : "Event is open for new ticket purchases."}
                    </Text>
                  </View>
                  <Switch
                    trackColor={{
                      false: Colors.gray200,
                      true: Colors.gradientEventForm1,
                    }}
                    thumbColor={isClosed ? Colors.primary : Colors.lightGray}
                    ios_backgroundColor={Colors.gray200}
                    onValueChange={setIsClosed}
                    value={isClosed}
                    disabled={isSyncing}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={[
                  styles.imagePicker,
                  errors.imageUrl && styles.inputError,
                ]}
                onPress={handleChoosePhoto}
                disabled={isSyncing}
              >
                {displayImageUri ? (
                  <Image
                    source={{ uri: displayImageUri }}
                    style={styles.imagePreview}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Icon
                      name="image-outline"
                      size={40}
                      color={Colors.purple}
                    />
                    <Text style={styles.imagePlaceholderText}>
                      Add Event Image
                    </Text>
                    <Text style={styles.imageSizeText}>
                      Tap to upload a cover photo (JPG/PNG)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.imageUrl && (
                <Text style={styles.errorText}>{errors.imageUrl}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBadge}>
                  <Icon
                    name="pricetag-outline"
                    size={20}
                    color={Colors.purple}
                  />
                </View>
                <Text style={styles.groupTitle}>Event Information</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Title *</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  value={formData.title}
                  onChangeText={(v) => handleInputChange("title", v)}
                  placeholder="e.g., Tech Conference 2026"
                  placeholderTextColor={Colors.gray400}
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>
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
                  placeholderTextColor={Colors.gray400}
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={[styles.input, errors.category && styles.inputError]}
                  value={formData.category}
                  onChangeText={(v) => handleInputChange("category", v)}
                  placeholder="e.g., Music, Technology"
                  placeholderTextColor={Colors.gray400}
                />
                {errors.category && (
                  <Text style={styles.errorText}>{errors.category}</Text>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tags</Text>
                <TextInput
                  style={[styles.input, errors.tags && styles.inputError]}
                  value={formData.tags}
                  onChangeText={(v) => handleInputChange("tags", v)}
                  placeholder="Comma-separated (e.g., tech, free food)"
                  placeholderTextColor={Colors.gray400}
                />
                {errors.tags && (
                  <Text style={styles.errorText}>{errors.tags}</Text>
                )}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBadge}>
                  <Icon
                    name="calendar-clear-outline"
                    size={20}
                    color={Colors.purple}
                  />
                </View>
                <Text style={styles.groupTitle}>Date & Time</Text>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Date *</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerInput,
                      errors.date && styles.inputError,
                    ]}
                    onPress={() => showPicker("date")}
                  >
                    <Text style={styles.pickerText}>{formattedDate}</Text>
                  </TouchableOpacity>
                  {errors.date && (
                    <Text style={styles.errorText}>{errors.date}</Text>
                  )}
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Time *</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerInput,
                      errors.time && styles.inputError,
                    ]}
                    onPress={() => showPicker("time")}
                  >
                    <Text style={styles.pickerText}>{formattedTime}</Text>
                  </TouchableOpacity>
                  {errors.time && (
                    <Text style={styles.errorText}>{errors.time}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBadge}>
                  <Icon
                    name="location-outline"
                    size={20}
                    color={Colors.purple}
                  />
                </View>
                <Text style={styles.groupTitle}>Location</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Venue Name *</Text>
                <TextInput
                  style={[styles.input, errors.location && styles.inputError]}
                  value={formData.location}
                  onChangeText={(v) => handleInputChange("location", v)}
                  placeholder="e.g., Grand Hall"
                  placeholderTextColor={Colors.gray400}
                />
                {errors.location && (
                  <Text style={styles.errorText}>{errors.location}</Text>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  value={formData.address}
                  onChangeText={(v) => handleInputChange("address", v)}
                  placeholder="Street, City (optional)"
                  placeholderTextColor={Colors.gray400}
                />
                {errors.address && (
                  <Text style={styles.errorText}>{errors.address}</Text>
                )}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBadge}>
                  <Icon name="logo-usd" size={20} color={Colors.purple} />
                </View>
                <Text style={styles.groupTitle}>Pricing & Capacity</Text>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Price *</Text>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    value={formData.price}
                    onChangeText={(v) => handleInputChange("price", v)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Colors.gray400}
                  />
                  {errors.price && (
                    <Text style={styles.errorText}>{errors.price}</Text>
                  )}
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Capacity</Text>
                  <TextInput
                    style={[styles.input, errors.capacity && styles.inputError]}
                    value={formData.capacity}
                    onChangeText={(v) => handleInputChange("capacity", v)}
                    keyboardType="number-pad"
                    placeholder="e.g., 100"
                    placeholderTextColor={Colors.gray400}
                  />
                  {errors.capacity && (
                    <Text style={styles.errorText}>{errors.capacity}</Text>
                  )}
                </View>
              </View>
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
                  placeholderTextColor={Colors.gray400}
                />
                {errors.userMaxTicketPurchase && (
                  <Text style={styles.errorText}>
                    {errors.userMaxTicketPurchase}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSyncing && styles.submitButtonDisabled,
              ]}
              onPress={handlePreSubmit}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator color={Colors.white} />
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

      {/* REVIEW MODAL */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Icon
                name="information-circle"
                size={48}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.modalTitle}>Admin Review Required</Text>
            <Text style={styles.modalText}>
              {isEditMode
                ? "Updating this event will require admin approval again. It will be hidden from the 'Discover' feed until approved."
                : "Your new event will be reviewed by an admin before it appears in the 'Discover' feed."}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmSubmit}
              >
                <Text style={styles.modalConfirmText}>I Understood</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundInput,
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  formContainer: { paddingHorizontal: 20, paddingTop: 16 },
  fieldGroup: {
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.gray600,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  groupTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textQuaternary,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.gray900,
    borderWidth: 1,
    borderColor: Colors.gray300,
    minHeight: 50,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: 13, marginTop: 5 },
  textArea: { minHeight: 100, paddingTop: 14, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 16 },
  halfWidth: { flex: 1 },
  pickerInput: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.gray300,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  pickerText: { fontSize: 16, color: Colors.gray900, flex: 1 },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 52,
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: Colors.primaryLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: { fontSize: 16, fontWeight: "600", color: Colors.white },
  disclaimer: {
    fontSize: 13,
    color: Colors.gray500,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.iconBadge,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    color: Colors.gray900,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  header: {
    marginHorizontal: 0,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        marginTop: 0,
      },
      android: {
        elevation: 8,
        marginVertical: 0,
      },
    }),
  },
  headerGradient: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  headerContent: {
    marginTop: Platform.OS === "ios" ? 100 : 80,
    marginBottom: 50,
    marginHorizontal: 15,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.whiteTransparent90,
    fontWeight: "500" as const,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.whiteTransparent20Alpha,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: "400" as const,
  },
  sparkleIcon: {
    marginBottom: 8,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
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
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  imageSizeText: { marginTop: 4, fontSize: 12, color: Colors.gray400 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: Colors.modalIconBg,
    padding: 16,
    borderRadius: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.gray900,
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    color: Colors.gray500,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray300,
    alignItems: "center",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray700,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
