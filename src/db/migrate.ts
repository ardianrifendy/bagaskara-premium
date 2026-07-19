import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

// Load environment variables like Next.js does
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

async function runMigration() {
  console.log("Starting database migration...");

  const sql = neon(databaseUrl!);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "drizzle" });

  console.log("Database migration successfully completed!");
  process.exit(0);
}

runMigration().catch((error) => {
  console.error("Migration failed with error:", error);
  process.exit(1);
});
