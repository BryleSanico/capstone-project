import React, { useState, useMemo } from 'react';
import { Platform, Modal, View, Button, StyleSheet } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

/**
 * A custom hook to encapsulate all logic for handling date and time selection.
 * @param initialDate The default date to show when the picker opens.
 */
export const useDateTimePicker = (initialDate: Date) => {
  const [selectedDateTime, setSelectedDateTime] = useState(initialDate);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  
  // tempDateTime is used for the iOS modal picker
  const [tempDateTime, setTempDateTime] = useState(initialDate);

  // Memoize formatted values
  const formattedDate = useMemo(
    () => format(selectedDateTime, 'yyyy-MM-dd'),
    [selectedDateTime]
  );
  const formattedTime = useMemo(
    () => format(selectedDateTime, 'HH:mm'),
    [selectedDateTime]
  );

  const showPicker = (mode: 'date' | 'time') => {
    setTempDateTime(selectedDateTime);
    setPickerMode(mode);
  };

  const hidePicker = () => {
    setPickerMode(null);
  };

  const onPickerChange = (event: DateTimePickerEvent, newDateTime?: Date) => {
    if (Platform.OS === 'android') {
      hidePicker();
      if (event.type === 'set' && newDateTime) {
        setSelectedDateTime(newDateTime);
      }
    } else if (newDateTime) {
      // For iOS, just update the temp state
      setTempDateTime(newDateTime);
    }
  };

  const handleIOSPickerConfirm = () => {
    setSelectedDateTime(tempDateTime);
    hidePicker();
  };

  const handleIOSPickerCancel = () => {
    hidePicker();
  };

  /**
   * Renders the modal or inline picker based on OS.
   */
  const renderDateTimePicker = () => {
    if (Platform.OS === 'android' && pickerMode) {
      return (
        <DateTimePicker
          testID={pickerMode === 'date' ? 'datePicker' : 'timePicker'}
          value={selectedDateTime}
          mode={pickerMode}
          is24Hour={true}
          display={'default'}
          onChange={onPickerChange}
        />
      );
    }

    if (Platform.OS === 'ios') {
      return (
        <Modal
          transparent={true}
          animationType="slide"
          visible={pickerMode !== null}
          onRequestClose={hidePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {pickerMode && (
                <DateTimePicker
                  testID={pickerMode === 'date' ? 'datePicker' : 'timePicker'}
                  value={tempDateTime}
                  mode={pickerMode}
                  is24Hour={true}
                  display="spinner"
                  onChange={onPickerChange}
                  textColor="#000000"
                />
              )}
              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={handleIOSPickerCancel}
                  color="#dc3545"
                />
                <Button title="Done" onPress={handleIOSPickerConfirm} />
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    return null; // Return null if not visible
  };

  return {
    selectedDateTime,
    setSelectedDateTime,
    formattedDate,
    formattedTime,
    showPicker,
    renderDateTimePicker,
  };
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
});
