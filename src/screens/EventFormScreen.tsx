// src/screens/EventFormScreen.tsx
import React, { useLayoutEffect, useState, useEffect } from 'react';
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
  Modal, 
  Button, 
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../stores/auth-store';
import { useMyEvents } from '../stores/my-event-store';
import { EventFormData } from '../types/event';
import { eventService } from '../services/eventService';
import { validateEventForm, hasValidationErrors, EventFormErrors } from '../utils/eventValidation';
import { format } from 'date-fns';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type EventFormScreenRouteProp = RouteProp<RootStackParamList, 'EventForm'>;
type EventFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EventForm'>;

const initialFormData: Omit<EventFormData, 'date' | 'time'> & { date?: string; time?: string } = {
  title: '',
  description: '',
  imageUrl: '',
  location: '',
  address: '',
  price: '',
  category: '',
  capacity: '',
  tags: '',
  userMaxTicketPurchase: '10',
};

export default function EventFormScreen() {
  const navigation = useNavigation<EventFormScreenNavigationProp>();
  const route = useRoute<EventFormScreenRouteProp>();
  const { session } = useAuth();
  const { createEvent, updateEvent } = useMyEvents();

  const eventId = route.params?.eventId;
  const isEditMode = !!eventId;

  const [formData, setFormData] = useState<Omit<EventFormData, 'date' | 'time'>>(initialFormData);
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State for Date/Time Pickers 
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());
  // Combine state for picker visibility and mode
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [tempDateTime, setTempDateTime] = useState<Date>(new Date()); // For iOS modal intermediate state

  const formattedDate = format(selectedDateTime, 'yyyy-MM-dd');
  const formattedTime = format(selectedDateTime, 'HH:mm');

  // Dynamic Header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Event' : 'Create Event',
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { fontWeight: '700', fontSize: 20 },
    });
  }, [navigation, isEditMode]);

  // Fetch Data for Edit Mode 
  useEffect(() => {
    if (isEditMode && eventId) {
      const fetchEventData = async () => {
        setIsLoading(true);
        try {
          // Fetch event data 
          const event = await eventService.fetchEventById(eventId); 
          if (event) {
            // Initialize selectedDateTime 
            const eventDate = new Date(event.startTime);
            setSelectedDateTime(eventDate); // Set the Date object

            // Populate form with existing data
            setFormData({
              title: event.title,
              description: event.description,
              imageUrl: event.imageUrl || '',
              location: event.location,
              address: event.address || '',
              price: event.price.toString(),
              category: event.category,
              capacity: event.capacity?.toString() || '',
              tags: event.tags?.join(', ') || '',
              userMaxTicketPurchase: event.userMaxTicketPurchase?.toString() || '10',
            });
          } else {
            Alert.alert('Error', 'Could not find event details.');
            navigation.goBack();
          }
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to load event data.');
          navigation.goBack();
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventData();
    } else {
        // For Create mode, maybe set initial time slightly in future
        const now = new Date();
        now.setHours(now.getHours() + 1); // e.g., default to 1 hour from now
        now.setMinutes(0); // Round down minutes
        setSelectedDateTime(now);
        setIsLoading(false); // Ensure loading is false for create mode
    }
  }, [eventId, isEditMode, navigation]);

  // Form Input Handler 
  const handleInputChange = (name: keyof Omit<EventFormData, 'date' | 'time'>, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof EventFormErrors]) { // Type assertion needed here
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  // Unified Picker Handlers 
  const showPicker = (mode: 'date' | 'time') => {
    setTempDateTime(selectedDateTime); // Store current value in temp state for modal
    setPickerMode(mode);
  };

  const hidePicker = () => {
    setPickerMode(null);
  };

  const onPickerChange = (event: DateTimePickerEvent, newDateTime?: Date) => {
    // Android automatically dismisses. For iOS modal, only update temp state here.
    if (Platform.OS === 'android') {
      hidePicker(); // Hide immediately on Android after selection/cancel
      if (event.type === 'set' && newDateTime) {
          setSelectedDateTime(newDateTime);
          // Clear errors if relevant picker was changed
          if(pickerMode === 'date' && errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
          if(pickerMode === 'time' && errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
      }
    } else if (newDateTime) {
      // iOS: Update the temporary state while the modal is open
      setTempDateTime(newDateTime);
    }
  };

  // iOS Modal Specific Handlers 
  const handleIOSPickerConfirm = () => {
    setSelectedDateTime(tempDateTime); // Apply the temp date/time
     // Clear errors if relevant picker was changed
    if(pickerMode === 'date' && errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
    if(pickerMode === 'time' && errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
    hidePicker();
  };

  const handleIOSPickerCancel = () => {
    // Discard changes, just hide the modal
    hidePicker();
  };
  // 

  // Submit Handler 
  const handleSubmit = async () => {
    if (!session) {
      Alert.alert('Login Required', 'Please login to manage events.');
      return;
    }

    const dataToValidate: EventFormData = {
        ...formData,
        date: formattedDate,
        time: formattedTime,
    };

    const validationErrors = validateEventForm(dataToValidate);
    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      Alert.alert('Validation Error', 'Please check the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    let result = null;

    try {
      // Call Store Action (Create or Update)
      if (isEditMode && eventId) {
        result = await updateEvent(eventId, dataToValidate);
      } else {
        result = await createEvent(dataToValidate);
      }

      // Handle Success/Failure
      if (result) {
        Alert.alert(
          'Success',
          `Event ${isEditMode ? 'updated' : 'created'} successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } 
      // Error handling is done within the store actions via Alert
      
    } catch (err) {
       // Catch unexpected errors during the call itself (rare)
       console.error("Unexpected submit error:", err);
       Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/*  Event Title  */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Enter event title"
                placeholderTextColor="#999"
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

             {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                placeholder="Describe your event"
                placeholderTextColor="#999"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
            
            {/* Image URL (Optional)  */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={[styles.input, errors.imageUrl && styles.inputError]}
                placeholder="https://your-image-url.com/image.jpg"
                placeholderTextColor="#999"
                value={formData.imageUrl}
                onChangeText={(value) => handleInputChange('imageUrl', value)}
                autoCapitalize="none"
                keyboardType="url"
              />
              {errors.imageUrl && <Text style={styles.errorText}>{errors.imageUrl}</Text>}
            </View>

            {/*  Category  */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <TextInput
                style={[styles.input, errors.category && styles.inputError]}
                placeholder="e.g., Music, Technology, Food"
                placeholderTextColor="#999"
                value={formData.category}
                onChangeText={(value) => handleInputChange('category', value)}
              />
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>
            
          {/*  Date & Time Pickers  */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity
                    style={[styles.pickerInput, errors.date && styles.inputError]}
                    onPress={() => showPicker('date')} // <-- Use unified showPicker
                >
                    <Text style={styles.pickerText}>{formattedDate}</Text>
                </TouchableOpacity>
                {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Time *</Text>
                 <TouchableOpacity
                    style={[styles.pickerInput, errors.time && styles.inputError]}
                    onPress={() => showPicker('time')} // <-- Use unified showPicker
                 >
                    <Text style={styles.pickerText}>{formattedTime}</Text>
                 </TouchableOpacity>
                {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
              </View>
            </View>

            {/*  Location  */}
             <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue Name *</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="Enter venue name"
                placeholderTextColor="#999"
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
              />
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                placeholder="Enter full address (optional)"
                placeholderTextColor="#999"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
              />
               {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/*  Price & Capacity  */}
             <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Price *</Text>
                    <TextInput
                        style={[styles.input, errors.price && styles.inputError]}
                        placeholder="0.00"
                        placeholderTextColor="#999"
                        value={formData.price}
                        onChangeText={(value) => handleInputChange('price', value)}
                        keyboardType="decimal-pad"
                    />
                    {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Capacity</Text>
                    <TextInput
                        style={[styles.input, errors.capacity && styles.inputError]}
                        placeholder="e.g., 100"
                        placeholderTextColor="#999"
                        value={formData.capacity}
                        onChangeText={(value) => handleInputChange('capacity', value)}
                        keyboardType="number-pad"
                    />
                    {errors.capacity && <Text style={styles.errorText}>{errors.capacity}</Text>}
                </View>
            </View>
            
             {/*  Max Tickets Per User  */}
             <View style={styles.inputGroup}>
              <Text style={styles.label}>Ticket Limit Per User *</Text>
              <TextInput
                style={[styles.input, errors.userMaxTicketPurchase && styles.inputError]}
                placeholder="e.g., 5"
                placeholderTextColor="#999"
                value={formData.userMaxTicketPurchase}
                onChangeText={(value) => handleInputChange('userMaxTicketPurchase', value)}
                keyboardType="number-pad"
              />
               {errors.userMaxTicketPurchase && <Text style={styles.errorText}>{errors.userMaxTicketPurchase}</Text>}
            </View>

            {/*  Tags  */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags</Text>
              <TextInput
                style={[styles.input, errors.tags && styles.inputError]}
                placeholder="Comma-separated (e.g., tech, conference, free food)"
                placeholderTextColor="#999"
                value={formData.tags}
                onChangeText={(value) => handleInputChange('tags', value)}
              />
               {errors.tags && <Text style={styles.errorText}>{errors.tags}</Text>}
            </View>

            {/*  Submit Button  */}
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditMode ? 'Save Changes' : 'Create Event'}
                </Text>
              )}
            </TouchableOpacity>

             <Text style={styles.disclaimer}>
              * Required fields. { !isEditMode && "Your event will be reviewed before being published."}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    {/*  Date/Time Picker Logic  */}
      {Platform.OS === 'android' && pickerMode && ( // Android: Render directly when mode is set
        <DateTimePicker
          testID={pickerMode === 'date' ? 'datePicker' : 'timePicker'}
          value={selectedDateTime} // Use the main state
          mode={pickerMode} // Dynamically set mode
          is24Hour={true}
          display={'default'} // Android default (usually dialog)
          onChange={onPickerChange} // Unified handler
        />
      )}

      {Platform.OS === 'ios' && ( // iOS: Use Modal
        <Modal
          transparent={true}
          animationType="slide"
          visible={pickerMode !== null} // Show modal when mode is 'date' or 'time'
          onRequestClose={hidePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               {pickerMode && ( // Ensure mode is set before rendering picker
                 <DateTimePicker
                    testID={pickerMode === 'date' ? 'datePicker' : 'timePicker'}
                    value={tempDateTime} // Use temp state for iOS modal
                    mode={pickerMode}
                    is24Hour={true}
                    display="spinner" // Use spinner display inside modal
                    onChange={onPickerChange} // Unified handler updates temp state
                    textColor={Platform.OS === 'ios' ? '#000' : undefined} // Optional: Force black text on iOS dark mode
                 />
               )}
              {/* iOS Modal Buttons */}
              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={handleIOSPickerCancel} color="#dc3545"/>
                <Button title="Done" onPress={handleIOSPickerConfirm} />
              </View>
            </View>
          </View>
        </Modal>
      )}
       {/*  End Picker Logic  */}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
     backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
  },
   inputGroup: {
    marginBottom: 20, 
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057', 
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Platform.OS === 'ios' ? 18 : 16, // iOS needs slightly more padding
    fontSize: 16,
    color: '#212529', 
    borderWidth: 1,
    borderColor: '#ced4da', 
    minHeight: 56,
  },
  inputError: {
    borderColor: '#dc3545', 
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 6,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16, 
  },
  halfWidth: {
    flex: 1,
  },
  pickerInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ced4da',
    minHeight: 56,
    justifyContent: 'center', // Center text vertically
  },
  pickerText: {
    fontSize: 16,
    color: '#212529',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 32, 
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 56,
    justifyContent: 'center',
  },
   submitButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 32,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10, 
  },
});