import { beforeAll } from "vitest";
import { db } from "../src/database/drizzle.config.js";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

beforeAll(() => {
  // We use :memory: in the vitest.config.ts / process.env for the db path.
  // Run migrations to ensure the in-memory database has the right schema.
  try {
    const migrationsFolder = path.resolve(__dirname, "../drizzle");
    migrate(db, { migrationsFolder });
    console.log("Test database (in-memory) initialized via migrations");
  } catch (error) {
    console.error("Test database migration failed:", error);
    throw error;
  }
});
