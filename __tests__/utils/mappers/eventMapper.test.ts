import { eventMapper } from '../../../src/utils/mappers/eventMapper';
import { expect, describe, it } from '@jest/globals';

// A mock payload from a Supabase RPC
const mockSupabaseEvent = {
  id: 1,
  title: 'Test Event',
  description: 'Test Desc',
  image_url: 'http://image.url',
  start_time: '2025-01-01T10:00:00Z',
  location: 'Test Hall',
  address: '123 Test St',
  price: 50.0,
  category: 'Tech',
  capacity: 100,
  attendees_count: 25, // Note the snake_case
  tags: ['test', 'code'],
  updated_at: '2025-01-01T00:00:00Z',
  available_slot: 75,
  user_max_ticket_purchase: 5,
  profiles: { // The nested profile
    id: 'user-123',
    full_name: 'Test Organizer',
    email: 'test@org.com',
    avatar_url: 'http://avatar.url',
  },
};

describe('utils/mappers/eventMapper', () => {
  it('should map snake_case to camelCase and handle nested profile', () => {
    const event = eventMapper(mockSupabaseEvent);

    expect(event.id).toBe(1);
    expect(event.title).toBe('Test Event');
    expect(event.imageUrl).toBe('http://image.url');
    expect(event.startTime).toBe('2025-01-01T10:00:00Z');
    expect(event.attendees).toBe(25); // Mapped from attendees_count
    expect(event.availableSlot).toBe(75);
    expect(event.userMaxTicketPurchase).toBe(5);
    
    // Check nested organizer
    expect(event.organizer).toBeDefined();
    expect(event.organizer.id).toBe('user-123');
    expect(event.organizer.fullName).toBe('Test Organizer');
    expect(event.organizer.avatar).toBe('http://avatar.url');
  });

  it('should use "Community Event" fallback if no profile exists', () => {
    const eventData = { ...mockSupabaseEvent, profiles: null };
    const event = eventMapper(eventData);

    expect(event.organizer).toBeDefined();
    expect(event.organizer.fullName).toBe('Community Event');
    expect(event.organizer.id).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should correctly map from `event_organizers` structure', () => {
    const eventData = {
      ...mockSupabaseEvent,
      profiles: null, // Remove top-level
      event_organizers: [{
        profiles: {
          id: 'user-456',
          full_name: 'New Org',
          email: 'new@org.com',
          avatar_url: 'http://avatar2.url'
        }
      }]
    };
    const event = eventMapper(eventData);
    expect(event.organizer.id).toBe('user-456');
    expect(event.organizer.fullName).toBe('New Org');
  });

  it('should throw an error for invalid input', () => {
    expect(() => eventMapper(null)).toThrow('Invalid event data received from Supabase.');
    expect(() => eventMapper(undefined)).toThrow('Invalid event data received from Supabase.');
  });
});