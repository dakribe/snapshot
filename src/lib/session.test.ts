import { describe, expect, test } from "bun:test";
import { parsePrefs, serializePrefs, validTimeZone } from "./session";

describe("league prefs cookie", () => {
  test("round-trips favorites (in starred order) and hidden leagues", () => {
    const p = { favorites: ["pwhl", "nhl"] as const, hidden: ["ahl"] as const };
    expect(parsePrefs(serializePrefs({ favorites: [...p.favorites], hidden: [...p.hidden] }))).toEqual({
      favorites: ["pwhl", "nhl"],
      hidden: ["ahl"],
    });
  });
  test("empty or missing cookie means defaults", () => {
    expect(parsePrefs(undefined)).toEqual({ favorites: [], hidden: [] });
    expect(parsePrefs("f:|h:")).toEqual({ favorites: [], hidden: [] });
  });
  test("unknown leagues and duplicates are dropped", () => {
    expect(parsePrefs("f:nhl.khl.nhl|h:xyz")).toEqual({ favorites: ["nhl"], hidden: [] });
  });
  test("accepts a URL-encoded value", () => {
    expect(parsePrefs(encodeURIComponent("f:nhl|h:ahl"))).toEqual({ favorites: ["nhl"], hidden: ["ahl"] });
  });
});

describe("validTimeZone", () => {
  test("accepts IANA zones", () => {
    expect(validTimeZone("America/Toronto")).toBe("America/Toronto");
  });
  test("rejects junk", () => {
    expect(validTimeZone("Mars/Olympus")).toBeNull();
    expect(validTimeZone("")).toBeNull();
    expect(validTimeZone(undefined)).toBeNull();
  });
});
