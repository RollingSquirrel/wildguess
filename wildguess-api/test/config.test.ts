import { describe, it, expect, beforeEach, afterEach } from "vitest";
import app from "../src/app.js";

describe("Config Routes (/api/config)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("GET /", () => {
    it("should return the default polling rate of 2000 if POLLING_RATE_MS is not set", async () => {
      delete process.env.POLLING_RATE_MS;
      const res = await app.request("/api/config", { method: "GET" });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ pollingRate: 3000 });
    });

    it("should return the configured polling rate if POLLING_RATE_MS is set", async () => {
      process.env.POLLING_RATE_MS = "5000";
      const res = await app.request("/api/config", { method: "GET" });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ pollingRate: 5000 });
    });
  });
});
