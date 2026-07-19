import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === "production") {
  console.warn("Warning: DATABASE_URL is not set in production environment.");
}

const sql = neon(databaseUrl || "postgres://placeholder:placeholder@placeholder/placeholder");
export const db = drizzle(sql, { schema });
export * from "./schema";
