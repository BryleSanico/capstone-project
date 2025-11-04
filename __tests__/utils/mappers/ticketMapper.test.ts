import { jest, expect, describe, it } from '@jest/globals';
import { ticketMapper } from '../../../src/utils/mappers/ticketMapper';
import { Ticket } from '../../../src/types/ticket';

// Define a mock Supabase payload (snake_case)
const mockSupabaseTicket = {
  id: 101,
  event_id: 1,
  event_title: 'Test Event',
  event_date: '2025-10-20T14:30:00Z',
  event_time: '14:30',
  event_location: 'Main Hall',
  total_price: 25.5,
  purchase_date: '2025-10-01T10:00:00Z',
  qr_code: 'TEST-QR-CODE-12345',
};

describe('utils/mappers/ticketMapper', () => {
  it('should correctly map snake_case fields to camelCase', () => {
    // 2. Call the mapper function
    const mappedTicket: Ticket = ticketMapper(mockSupabaseTicket);

    // 3. Assert that all fields on the resulting object are correct
    expect(mappedTicket.id).toBe(101);
    expect(mappedTicket.eventId).toBe(mockSupabaseTicket.event_id);
    expect(mappedTicket.eventTitle).toBe(mockSupabaseTicket.event_title);
    expect(mappedTicket.eventDate).toBe(mockSupabaseTicket.event_date);
    expect(mappedTicket.eventTime).toBe(mockSupabaseTicket.event_time);
    expect(mappedTicket.eventLocation).toBe(mockSupabaseTicket.event_location);
    expect(mappedTicket.totalPrice).toBe(mockSupabaseTicket.total_price);
    expect(mappedTicket.purchaseDate).toBe(mockSupabaseTicket.purchase_date);
    expect(mappedTicket.qrCode).toBe(mockSupabaseTicket.qr_code);
  });

  it('should throw an error for invalid input', () => {
    // Suppress console.warn during this test
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    // 4. Test the error handling paths
    expect(() => ticketMapper(null)).toThrow(
      'Invalid event data received from Supabase.'
    );
    expect(() => ticketMapper(undefined)).toThrow(
      'Invalid event data received from Supabase.'
    );

    consoleWarnSpy.mockRestore();
  });
});