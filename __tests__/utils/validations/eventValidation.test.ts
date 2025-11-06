import {
  validateEventForm,
  hasValidationErrors,
} from '../../../src/utils/validations/eventValidation';
import { EventFormData } from '../../../src/types/event';

const validFormData: EventFormData = {
  title: 'My Tech Event',
  description: 'A great event',
  category: 'Technology',
  date: '2025-10-20',
  time: '14:30',
  location: 'Main Hall',
  price: '25.00',
  address: '123 Main St',
  capacity: '100',
  tags: 'tech, code',
  userMaxTicketPurchase: '5',
};

describe('utils/validations/eventValidation', () => {
  describe('validateEventForm', () => {
    it('should return an empty object for valid data', () => {
      const errors = validateEventForm(validFormData);
      expect(errors).toEqual({});
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should return an error if title is missing', () => {
      const errors = validateEventForm({ ...validFormData, title: ' ' });
      expect(errors.title).toBe('Title is required.');
      expect(hasValidationErrors(errors)).toBe(true);
    });

    it('should return an error for invalid date or time formats', () => {
      const dateErrors = validateEventForm({ ...validFormData, date: '20-10-2025' });
      expect(dateErrors.date).toBe('Date is required (YYYY-MM-DD).');

      const timeErrors = validateEventForm({ ...validFormData, time: '2:30pm' });
      expect(timeErrors.time).toBe('Time is required (HH:MM).');
    });

    it('should return an error for invalid price', () => {
      const errors = validateEventForm({ ...validFormData, price: 'free' });
      expect(errors.price).toBe('Price must be a valid non-negative number.');
    });

    it('should return an error for invalid capacity', () => {
      const errors = validateEventForm({ ...validFormData, capacity: '-50' });
      expect(errors.capacity).toBe('Capacity must be a valid non-negative integer.');
    });

    it('should NOT return an error for empty optional capacity', () => {
      const errors = validateEventForm({ ...validFormData, capacity: '' });
      expect(errors.capacity).toBeUndefined();
    });

    it('should return an error for invalid ticket limit', () => {
      const errors = validateEventForm({ ...validFormData, userMaxTicketPurchase: '0' });
      expect(errors.userMaxTicketPurchase).toBe('Ticket limit must be a positive integer.');
    });
  });
});