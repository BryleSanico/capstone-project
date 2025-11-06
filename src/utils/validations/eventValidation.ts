import { EventFormData } from '../../types/event';
import { isRequired } from './validation';

export type EventFormErrors = {
  // Allow keys matching EventFormData fields
  [key in keyof EventFormData]?: string;
} & {
  general?: string;
  imageUrl?: string;
};

// Basic validation rules
export const validateEventForm = (formData: EventFormData): EventFormErrors => {
  // ADD TRY/CATCH
  try {
    console.log("[validateEventForm] Starting validation with data:", formData); // Log input data
    const errors: EventFormErrors = {};

    if (!isRequired(formData.title?.trim())) { // Add optional chaining just in case
      errors.title = 'Title is required.';
    }
    if (!isRequired(formData.description?.trim())) {
      errors.description = 'Description is required.';
    }
    if (!isRequired(formData.category?.trim())) {
      errors.category = 'Category is required.';
    }
    // Check date format more robustly
    if (!isRequired(formData.date?.trim()) || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      errors.date = 'Date is required (YYYY-MM-DD).';
    }
    // Check time format more robustly
    if (!isRequired(formData.time?.trim()) || !/^\d{2}:\d{2}$/.test(formData.time)) {
      errors.time = 'Time is required (HH:MM).';
    }
    if (!isRequired(formData.location?.trim())) {
      errors.location = 'Venue Name is required.';
    }
    // Check price format more robustly
    const priceValue = formData.price?.trim();
    if (!isRequired(priceValue) || isNaN(parseFloat(priceValue)) || parseFloat(priceValue) < 0) {
      errors.price = 'Price must be a valid non-negative number.';
    }
    // Check capacity format (optional field)
    const capacityValue = formData.capacity?.trim();
    if (capacityValue && (isNaN(parseInt(capacityValue, 10)) || parseInt(capacityValue, 10) < 0)) {
      errors.capacity = 'Capacity must be a valid non-negative integer.';
    }
    // Check ticket limit format (optional field)
    const limitValue = formData.userMaxTicketPurchase?.trim();
    if (limitValue && (isNaN(parseInt(limitValue, 10)) || parseInt(limitValue, 10) <= 0)) {
      errors.userMaxTicketPurchase = 'Ticket limit must be a positive integer.';
    }

    console.log("[validateEventForm] Validation finished. Errors:", errors); // Log results
    return errors;

  } catch (error: any) {
    console.error("!!! CRASH INSIDE validateEventForm:", error);
    // Return an error object indicating a crash occurred
    return { general: `Validation function crashed: ${error.message}` };
  }
};

// Helper to check if there are any errors
export const hasValidationErrors = (errors: EventFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};