import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { act } from "@testing-library/react-native";
import { useAuth } from "../../src/stores/auth-store";
import { useFavorites } from "../../src/stores/favorites-store";
import { useTickets } from "../../src/stores/tickets-store";
import { useMyEvents } from "../../src/stores/my-event-store";
import { cacheManager } from "../../src/services/cacheManager";
import { notificationService } from "../../src/services/notificationService";
import { supabase } from "../../src/lib/supabase";
import {
  Session,
  User,
  AuthChangeEvent,
  Subscription,
} from "@supabase/supabase-js";

// Mock all dependencies
jest.mock("../../src/lib/supabase");
jest.mock("../../src/stores/favorites-store");
jest.mock("../../src/stores/tickets-store");
jest.mock("../../src/stores/my-event-store");
jest.mock("../../src/services/cacheManager");
jest.mock("../../src/services/notificationService");

// Cast mocked dependencies to their Jest types
const mockedSupabase = supabase as jest.Mocked<typeof supabase>;
const mockedUseFavorites = useFavorites as jest.Mocked<typeof useFavorites>;
const mockedUseTickets = useTickets as jest.Mocked<typeof useTickets>;
const mockedUseMyEvents = useMyEvents as jest.Mocked<typeof useMyEvents>;
const mockedCacheManager = cacheManager as jest.Mocked<typeof cacheManager>;
const mockedNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;

// Capture the onAuthStateChange listener
let authStateListener: (
  event: AuthChangeEvent,
  session: Session | null
) => void;

// Update mockImplementation to match the (now correct) setup file
mockedSupabase.auth.onAuthStateChange.mockImplementation(
  (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    authStateListener = callback;
    return {
      data: {
        subscription: {
          id: "mock-sub-id",
          callback: jest.fn(),
          unsubscribe: jest.fn(),
        } as Subscription, // Cast to Subscription type
      },
    };
  }
);

// Mock store actions
const mockLoadFavorites = jest.fn();
const mockClearFavorites = jest.fn();
mockedUseFavorites.getState.mockReturnValue({
  loadFavorites: mockLoadFavorites,
  clearUserFavorites: mockClearFavorites,
} as any);

const mockLoadTickets = jest.fn();
const mockClearTickets = jest.fn();
mockedUseTickets.getState.mockReturnValue({
  loadTickets: mockLoadTickets,
  clearUserTickets: mockClearTickets,
} as any);

const mockLoadMyEvents = jest.fn();
const mockClearMyEvents = jest.fn();
mockedUseMyEvents.getState.mockReturnValue({
  loadMyEvents: mockLoadMyEvents,
  clearUserEvents: mockClearMyEvents,
} as any);

// This is the fully-typed mock User and Session
const mockUser: User = {
  id: "user-123",
  app_metadata: { provider: "email" },
  user_metadata: { full_name: "Test User" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "test@example.com",
};

const mockSession: Session = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: mockUser,
};
// --- End of fully-typed mocks ---

describe("stores/auth-store", () => {
  //
  // --- FIX: THIS LINE WAS REMOVED ---
  // const mockSession = { user: { id: 'user-123' } }; // <-- THIS LINE IS DELETED
  //

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    act(() => {
      useAuth.setState({ session: null, user: null, isLoading: true });
    });
  });

  // Initialize the store to capture the listener
  act(() => {
    useAuth.getState().initialize();
  });

  it("should load user-specific data on login", async () => {
    await act(async () => {
      // This now correctly uses the fully-typed mockSession from the outer scope
      authStateListener("SIGNED_IN", mockSession);
    });

    // Check that all user-specific data was loaded
    expect(mockedNotificationService.initialize).toHaveBeenCalledWith(
      "user-123"
    );
    expect(mockLoadFavorites).toHaveBeenCalled();
    expect(mockLoadTickets).toHaveBeenCalled();
    expect(mockLoadMyEvents).toHaveBeenCalled();

    // Check that state was updated
    expect(useAuth.getState().session).toBe(mockSession);
    expect(useAuth.getState().user).toBe(mockSession.user);
    expect(useAuth.getState().isLoading).toBe(false);
  });

  it("should clear all user data on logout event", async () => {
    // First, set a logged-in state using the correct mockSession
    act(() => {
      useAuth.setState({
        session: mockSession,
        user: mockSession.user,
        isLoading: false,
      });
    });

    await act(async () => {
      // Simulate Supabase firing a logout event
      authStateListener("SIGNED_OUT", null);
    });

    // Check that all stores were cleared
    expect(mockClearFavorites).toHaveBeenCalled();
    expect(mockClearTickets).toHaveBeenCalled();
    expect(mockClearMyEvents).toHaveBeenCalled();

    // Check that auth state is cleared
    expect(useAuth.getState().session).toBeNull();
    expect(useAuth.getState().user).toBeNull();
  });

  it("signOut action should orchestrate a full cleanup", async () => {
    // 1. Set initial logged-in state
    act(() => {
      useAuth.setState({
        session: mockSession,
        user: mockSession.user,
        isLoading: false,
      });
    });

    // 2. Call signOut
    await act(async () => {
      await useAuth.getState().signOut();
    });

    // 3. Verify synchronous clears were called *first*
    expect(mockClearTickets).toHaveBeenCalled();
    expect(mockClearFavorites).toHaveBeenCalled();
    expect(mockClearMyEvents).toHaveBeenCalled();

    // 4. Verify async services were called
    expect(
      mockedNotificationService.unregisterPushNotifications
    ).toHaveBeenCalledWith("user-123");
    expect(mockedCacheManager.clearUserSpecificCache).toHaveBeenCalledWith(
      "user-123"
    );

    // 5. Verify Supabase sign out was called
    expect(mockedSupabase.auth.signOut).toHaveBeenCalled();

    // 6. Verify state was cleared immediately
    expect(useAuth.getState().session).toBeNull();
    expect(useAuth.getState().user).toBeNull();
  });
});
