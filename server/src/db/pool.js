import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Ensure .env is loaded from the server root directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Check your server/.env file.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
  process.exit(-1);
});

export default pool;
