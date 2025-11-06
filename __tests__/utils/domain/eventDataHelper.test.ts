import { jest, expect, describe, it } from "@jest/globals";
import {
  combineDateTime,
  parseTags,
} from "../../../src/utils/domain/eventDataHelper";

describe("utils/domain/eventDataHelper", () => {
  describe("combineDateTime", () => {
    beforeEach(() => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should create a date object with the correct local date/time components", () => {
      const date = "2025-10-20";
      const time = "14:30";
      const resultISOString = combineDateTime(date, time);

      const d = new Date(resultISOString);

      // This test is now timezone-independent.
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(9); // 0-indexed (9 = October)
      expect(d.getDate()).toBe(20);
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(30);
    });

    it("should throw an error for missing date", () => {
      expect(() => combineDateTime("", "14:30")).toThrow(
        "Date and Time are required."
      );
    });

    it("should throw an error for malformed date", () => {
      expect(() => combineDateTime("20/10/2025", "14:30")).toThrow(
        "Invalid Date (YYYY-MM-DD) or Time (HH:MM) format."
      );
    });

    it("should throw an error for malformed time", () => {
      expect(() => combineDateTime("2025-10-20", "2:30pm")).toThrow(
        "Invalid Date (YYYY-MM-DD) or Time (HH:MM) format."
      );
    });
  });

  describe("parseTags", () => {
    it("should convert a comma-separated string to an array", () => {
      expect(parseTags("tag1, tag2, tag3")).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should handle extra whitespace and trim items", () => {
      expect(parseTags(" tag1 ,tag2 , tag3 ")).toEqual([
        "tag1",
        "tag2",
        "tag3",
      ]);
    });

    it("should filter out empty strings from double commas", () => {
      expect(parseTags("tag1,,tag2")).toEqual(["tag1", "tag2"]);
    });

    it("should return an empty array for an empty string", () => {
      expect(parseTags("")).toEqual([]);
    });
  });
});
