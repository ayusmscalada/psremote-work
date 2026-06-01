import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import {
  getDatabaseUrl,
  getProjectRef,
  getSqlEditorUrl,
} from "../supabase/connection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "..", "supabase", "schema.sql");
const patchPath = path.join(__dirname, "..", "supabase", "patch-schema.sql");

function readSqlFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN;
  }

  const candidates = [
    path.join(os.homedir(), ".supabase", "access-token"),
    path.join(os.homedir(), "AppData", "Roaming", "supabase", "access-token"),
    path.join(os.homedir(), "AppData", "Local", "supabase", "access-token"),
  ];

  for (const filePath of candidates) {
    try {
      const token = fs.readFileSync(filePath, "utf8").trim();
      if (token) return token;
    } catch {
      // try next location
    }
  }

  return null;
}

async function applySchemaViaManagementApi(schema, patch) {
  const projectRef = getProjectRef();
  const accessToken = readAccessToken();
  if (!projectRef || !accessToken) {
    return false;
  }

  async function runQuery(query) {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase Management API error (${response.status}): ${body}`);
    }
  }

  if (schema?.trim()) await runQuery(schema);
  if (patch) await runQuery(patch);
  return true;
}

async function applySchemaViaPg(schema, patch) {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return false;
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });

  try {
    if (schema?.trim()) await pool.query(schema);
    if (patch) await pool.query(patch);
  } finally {
    await pool.end();
  }

  return true;
}

function migrationHelpError() {
  const projectRef = getProjectRef() || "[project-ref]";
  return (
    "Could not apply database schema automatically.\n\n" +
    "Add ONE of these to backend/.env, then run npm run db:migrate again:\n\n" +
    "  Option A — database password (Settings → Database → Database password):\n" +
    "    SUPABASE_DB_PASSWORD=your-password\n\n" +
    "  Option B — personal access token (https://supabase.com/dashboard/account/tokens):\n" +
    "    SUPABASE_ACCESS_TOKEN=your-token\n\n" +
    "  Option C — run SQL manually in the Supabase SQL Editor:\n" +
    `    ${getSqlEditorUrl()}\n` +
    "    Paste backend/supabase/patch-schema.sql (quick fix) or schema.sql (full setup) and click Run."
  );
}

export async function applySchema() {
  const schema = readSqlFile(schemaPath);
  const patch = readSqlFile(patchPath);

  if (await applySchemaViaManagementApi(schema, patch)) {
    return;
  }

  if (await applySchemaViaPg(schema, patch)) {
    return;
  }

  throw new Error(migrationHelpError());
}

export async function applyPatchOnly() {
  const patch = readSqlFile(patchPath);

  if (await applySchemaViaManagementApi("", patch)) {
    return;
  }

  if (await applySchemaViaPg("", patch)) {
    return;
  }

  throw new Error(migrationHelpError());
}

export function isMissingTableError(message) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

async function main() {
  await applySchema();
  console.log("Database schema applied.");
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/migrate.js");
if (isDirectRun) {
  main().catch((err) => {
    console.error(err.message.includes("Could not apply") ? err.message : `Migration failed: ${err.message}`);
    process.exit(1);
  });
}
