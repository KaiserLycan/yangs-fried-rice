import { describe, it, expect } from "vitest";
import { reviewSubmissionSchema } from "./reviews";

describe("reviewSubmissionSchema", () => {
  describe("valid inputs", () => {
    it.each([1, 2, 3, 4, 5])("accepts rating %i with a valid comment", (rating) => {
      const result = reviewSubmissionSchema.safeParse({
        rating,
        comment: "Great food and fast delivery!",
      });
      expect(result.success).toBe(true);
    });

    it("accepts rating without a comment", () => {
      const result = reviewSubmissionSchema.safeParse({ rating: 5 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comment).toBeUndefined();
      }
    });

    it("accepts rating with null comment", () => {
      const result = reviewSubmissionSchema.safeParse({ rating: 4, comment: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comment).toBeNull();
      }
    });

    it("accepts comment with exactly 1,000 characters", () => {
      const comment = "a".repeat(1000);
      const result = reviewSubmissionSchema.safeParse({ rating: 5, comment });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid ratings", () => {
    it("rejects missing rating", () => {
      const result = reviewSubmissionSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Rating is required.");
      }
    });

    it("rejects non-integer rating", () => {
      const result = reviewSubmissionSchema.safeParse({ rating: 4.5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Rating must be a whole number.");
      }
    });

    it("rejects rating less than 1 (0)", () => {
      const result = reviewSubmissionSchema.safeParse({ rating: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Rating must be at least 1.");
      }
    });

    it("rejects negative rating (-1)", () => {
      const result = reviewSubmissionSchema.safeParse({ rating: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Rating must be at least 1.");
      }
    });

    it("rejects rating greater than 5 (6)", () => {
      const result = reviewSubmissionSchema.safeParse({ rating: 6 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Rating must be at most 5.");
      }
    });
  });

  describe("invalid comments", () => {
    it("rejects comment exceeding 1,000 characters", () => {
      const comment = "a".repeat(1001);
      const result = reviewSubmissionSchema.safeParse({ rating: 5, comment });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Comment must be 1 000 characters or fewer.");
      }
    });
  });
});
