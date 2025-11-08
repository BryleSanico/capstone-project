import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { PostgrestSingleResponse, Session, User } from "@supabase/supabase-js";
import { supabase } from "../../src/lib/supabase";
import { myEventsService } from "../../src/services/myEventsService";
import storageService from "../../src/services/storageService";
import * as sessionHelper from "../../src/utils/system/sessionHelper";
import { toByteArray } from "react-native-quick-base64";
import { Asset } from "react-native-image-picker";

// Mock all dependencies
jest.mock("../../src/lib/supabase");
jest.mock("../../src/services/storageService");
jest.mock("../../src/utils/system/sessionHelper");
jest.mock("react-native-quick-base64");
jest.mock("../../src/utils/network/networkUtils", () => ({
  withRetry: jest.fn((fn: () => any) => fn()),
}));

// Access the mock functions
const mockedSupabase = supabase as jest.Mocked<typeof supabase>;
// Get the stable mocks returned by `from()`
const mockedStorageMethods = mockedSupabase.storage.from(
  "any"
) as jest.Mocked<any>;
const mockedUpload = mockedStorageMethods.upload;
const mockedRemove = mockedStorageMethods.remove;
const mockedGetPublicUrl = mockedStorageMethods.getPublicUrl;

const mockedStorage = storageService as jest.Mocked<typeof storageService>;
const mockedGetSession = sessionHelper.getCurrentSession as jest.Mock<
  () => Promise<Session | null>
>;
const mockedToByteArray = toByteArray as jest.Mock;

// Helper to create a type-safe mock response
const createMockRpcResponse = (
  data: any,
  error: any = null
): PostgrestSingleResponse<any> => ({
  data,
  error,
  status: 200,
  statusText: "OK",
  count: data ? (Array.isArray(data) ? data.length : 1) : 0,
});

// Create fully-typed mocks for Session and User
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

// Create a complete mock Supabase event payload
const mockSupabaseEvent = {
  id: 1,
  title: "Test Event",
  description: "Test Desc",
  image_url: "http://image.url",
  start_time: "2025-01-01T10:00:00Z",
  location: "Test Hall",
  address: "123 Test St",
  price: 50.0,
  category: "Tech",
  capacity: 100,
  attendees_count: 25,
  tags: ["test", "code"],
  updated_at: "2025-01-01T00:00:00Z",
  available_slot: 75,
  user_max_ticket_purchase: 5,
  profiles: {
    id: "user-123",
    full_name: "Test Organizer",
    email: "test@org.com",
    avatar_url: "http://avatar.url",
  },
};

const mockFormData = {
  title: "New Event",
  description: "Desc",
  date: "2025-10-10",
  time: "14:30",
  location: "Hall",
  address: "",
  price: "10",
  category: "Tech",
  capacity: "100",
  tags: "a, b",
  userMaxTicketPurchase: "5",
};

const mockAsset: Asset = {
  uri: "file:///image.jpg",
  type: "image/jpeg",
  fileSize: 1000,
  base64: "mock-base64-data",
  fileName: "image.jpg",
};

describe("services/myEventsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSession.mockResolvedValue(mockSession);
  });

  describe("createEvent", () => {
    it("should throw if user is not logged in", async () => {
      mockedGetSession.mockResolvedValueOnce(null);
      await expect(
        myEventsService.createEvent(mockFormData, mockAsset)
      ).rejects.toThrow("User must be logged in.");
    });

    it("should call upload and RPC correctly when an image is provided", async () => {
      mockedToByteArray.mockReturnValue(new Uint8Array());
      mockedSupabase.rpc.mockResolvedValue(
        createMockRpcResponse([mockSupabaseEvent])
      );

      await myEventsService.createEvent(mockFormData, mockAsset);

      // 1. Check upload
      expect(mockedToByteArray).toHaveBeenCalledWith(mockAsset.base64);
      expect(mockedSupabase.storage.from).toHaveBeenCalledWith("event-images");
      // Check the stable mock
      expect(mockedUpload).toHaveBeenCalledWith(
        expect.stringContaining(`events/${mockSession.user.id}/`),
        expect.any(Uint8Array),
        expect.any(Object)
      );
      expect(mockedGetPublicUrl).toHaveBeenCalled();

      // 2. Check RPC
      expect(mockedSupabase.rpc).toHaveBeenCalledWith("create_event", {
        p_title: "New Event",
        p_description: "Desc",
        p_image_url: "http://mock.url/mock/path.jpg",
        p_start_time: expect.any(String),
        p_tags: ["a", "b"],
        p_address: "",
        p_capacity: 100,
        p_category: "Tech",
        p_location: "Hall",
        p_price: 10,
        p_user_max_ticket_purchase: 5,
      });

      // 3. Check cache invalidation
      expect(mockedStorage.removeItem).toHaveBeenCalledWith(
        `user_events_cache_${mockSession.user.id}`
      );
    });
  });

  describe("updateEvent", () => {
    it("should upload a new image and delete the old one if an asset is provided", async () => {
      mockedSupabase.rpc.mockResolvedValue(
        createMockRpcResponse([mockSupabaseEvent])
      );
      const oldImageUrl =
        "http://mock.url/storage/v1/object/public/event-images/events/user-123/old-image.jpg";

      await myEventsService.updateEvent(
        1,
        mockFormData,
        oldImageUrl,
        mockAsset
      );

      // 1. Upload was called
      expect(mockedUpload).toHaveBeenCalled();

      // 2. Old image was removed
      // FIX: Check the stable mock
      expect(mockedRemove).toHaveBeenCalledWith([
        "events/user-123/old-image.jpg",
      ]);

      // 3. RPC was called with the NEW image URL
      expect(mockedSupabase.rpc).toHaveBeenCalledWith(
        "update_user_event",
        expect.objectContaining({
          p_image_url: "http://mock.url/mock/path.jpg",
        })
      );

      // 4. Cache was invalidated
      expect(mockedStorage.removeItem).toHaveBeenCalled();
    });

    it("should NOT upload or delete if no asset is provided", async () => {
      mockedSupabase.rpc.mockResolvedValue(
        createMockRpcResponse([mockSupabaseEvent])
      );
      const oldImageUrl = "http://old.url/image.jpg";

      await myEventsService.updateEvent(1, mockFormData, oldImageUrl, null);

      // 1. No upload/delete
      expect(mockedUpload).not.toHaveBeenCalled();
      expect(mockedRemove).not.toHaveBeenCalled();

      // 2. RPC called with OLD image URL
      expect(mockedSupabase.rpc).toHaveBeenCalledWith(
        "update_user_event",
        expect.objectContaining({ p_image_url: oldImageUrl })
      );
    });
  });

  describe("deleteEvent", () => {
    it("should call the delete RPC and invalidate cache", async () => {
      mockedSupabase.rpc.mockResolvedValue(createMockRpcResponse(null));

      await myEventsService.deleteEvent(1);

      expect(mockedSupabase.rpc).toHaveBeenCalledWith("delete_user_event", {
        p_event_id: 1,
      });
      expect(mockedStorage.removeItem).toHaveBeenCalledWith(
        `user_events_cache_${mockSession.user.id}`
      );
    });
  });
});
