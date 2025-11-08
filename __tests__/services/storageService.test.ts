import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import storageService from "../../src/services/storageService";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage");

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("services/storageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testKey = "myKey";
  const testData = { a: 1, b: "test" };
  const stringifiedData = JSON.stringify(testData);

  describe("setItem", () => {
    it("should call AsyncStorage.setItem with stringified data", async () => {
      await storageService.setItem(testKey, testData);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        testKey,
        stringifiedData
      );
    });

    it("should log an error if setItem fails", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockedAsyncStorage.setItem.mockRejectedValueOnce(
        new Error("Storage full")
      );

      await storageService.setItem(testKey, testData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to set item with key "myKey" in storage',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getItem", () => {
    it("should retrieve and parse an item from storage", async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(stringifiedData);

      const item = await storageService.getItem(testKey);

      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(item).toEqual(testData);
    });

    it("should return null if the item does not exist", async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
      const item = await storageService.getItem(testKey);
      expect(item).toBeNull();
    });

    it("should return null and log an error if JSON.parse fails", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockedAsyncStorage.getItem.mockResolvedValueOnce("invalid-json");

      const item = await storageService.getItem(testKey);

      expect(item).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get item with key "myKey" from storage',
        expect.any(SyntaxError)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("removeItem", () => {
    it("should call AsyncStorage.removeItem", async () => {
      await storageService.removeItem(testKey);
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith(testKey);
    });
  });

  describe("clearAll", () => {
    it("should call AsyncStorage.clear", async () => {
      // Set up a successful mock for clear
      mockedAsyncStorage.clear.mockResolvedValueOnce(undefined);
      await storageService.clearAll();

      // Verify that AsyncStorage.clear was called exactly once
      expect(mockedAsyncStorage.clear).toHaveBeenCalledTimes(1);
    });

    it("should log an error if clearAll fails", async () => {
      // Spy on console.error and provide a mock implementation
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      // Mock the clear function to reject with an error
      mockedAsyncStorage.clear.mockRejectedValueOnce(
        new Error("Failed to clear")
      );

      await storageService.clearAll();

      // Verify that our error was logged to the console
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to clear all data from storage",
        expect.any(Error)
      );

      // Restore the original console.error function
      consoleErrorSpy.mockRestore();
    });
  });
});
