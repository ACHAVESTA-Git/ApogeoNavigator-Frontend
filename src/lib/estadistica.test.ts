import { describe, expect, it } from "vitest";
import { media, trocear } from "./estadistica";

describe("estadistica", () => {
  it("trocea sin perder ni repetir elementos", () => {
    expect(trocear([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    expect(trocear([], 3)).toEqual([]);
  });
  it("la media de una lista vacía es null, no 0", () => {
    expect(media([])).toBeNull();
    expect(media([100, 50, 0])).toBe(50);
  });
});
