import { config as loadEnv } from "dotenv";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import {
  planExpenseValuation,
  type MigrationExpense,
} from "@/lib/services/migrate-valuation";

loadEnv({
  path: process.env.CENTAVO_ENV === "sandbox" ? ".env.sandbox" : ".env.local",
  quiet: true,
});
const apply = process.argv.includes("--apply");
const backupOnly = process.argv.includes("--backup-only");
const backupDir = path.resolve("backups");
// SQL DATE is a calendar date, not a timestamp in the process timezone.
pg.types.setTypeParser(1082, (date) => date);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function fingerprint(rows: Record<string, unknown>[]) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        rows.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          amount: r.amount,
          currency: r.currency,
          date: r.date,
          category_id: r.category_id,
          description: r.description,
          notes: r.notes,
          base_amount: r.base_amount,
          exchange_rate: r.exchange_rate,
          created_at: r.created_at,
          updated_at: r.updated_at,
        })),
      ),
    )
    .digest("hex");
}

async function main() {
  const { rows } =
    await pool.query(`SELECT e.*, e.created_at::text AS created_at_raw, e.updated_at::text AS updated_at_raw,
    u.base_currency AS owner_base_currency
    FROM expenses e JOIN users u ON u.id = e.user_id ORDER BY e.id`);
  const before = fingerprint(rows);
  if (apply) {
    const schema = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses'`,
    );
    if (!schema.rows.some((row) => row.column_name === "usd_amount")) {
      throw new Error(
        "Apply prisma migration 3_historical_valuations before running --apply",
      );
    }
  }
  if (apply || backupOnly) {
    await mkdir(backupDir, { recursive: true, mode: 0o700 });
    const backup = path.join(
      backupDir,
      `expenses-before-blue-${new Date().toISOString().replaceAll(":", "-")}.json`,
    );
    await writeFile(
      backup,
      JSON.stringify(
        { version: 1, originalFingerprint: before, expenses: rows },
        null,
        2,
      ),
      { mode: 0o600, flag: "wx" },
    );
    console.log(`Backup: ${backup}`);
    if (backupOnly) {
      console.log(
        JSON.stringify({ total: rows.length, originalFingerprint: before }),
      );
      return;
    }
  }
  const report = {
    mode: apply ? "apply" : "dry-run",
    total: rows.length,
    updated: 0,
    complete: 0,
    pendingUsd: 0,
    pendingOtherCurrencies: 0,
    conflicts: 0,
    originalFingerprint: before,
  };
  for (const row of rows) {
    const expense: MigrationExpense = {
      amount: row.amount,
      currency: row.currency,
      date: row.date,
      updatedAt: row.updated_at.toISOString(),
      baseAmount: row.base_amount,
      exchangeRate: row.exchange_rate,
      legacyConversion: row.legacy_conversion ?? {
        baseCurrency: row.owner_base_currency,
        baseAmount: row.base_amount,
        exchangeRate: row.exchange_rate,
      },
      usdAmount: row.usd_amount ?? null,
      usdExchangeRate: row.usd_exchange_rate ?? null,
      conversionRates: row.conversion_rates ?? null,
    };
    const valuation = await planExpenseValuation(expense);
    if (valuation.usdAmount == null) report.pendingUsd++;
    else if (Object.keys(valuation.conversionRates).length < 3)
      report.pendingOtherCurrencies++;
    else report.complete++;
    if (!apply) continue;
    const result = await pool.query(
      `UPDATE expenses SET
      usd_amount = $1, usd_exchange_rate = $2, conversion_rates = $3::jsonb,
      legacy_conversion = COALESCE(legacy_conversion, $4::jsonb)
      WHERE id = $5 AND updated_at = $6 AND amount = $7 AND currency = $8 AND date = $9
        AND conversion_rates IS NOT DISTINCT FROM $10::jsonb`,
      [
        valuation.usdAmount?.toString() ?? null,
        valuation.usdExchangeRate?.toString() ?? null,
        JSON.stringify(valuation.conversionRates),
        JSON.stringify(expense.legacyConversion),
        row.id,
        row.updated_at_raw,
        row.amount,
        row.currency,
        row.date,
        row.conversion_rates == null
          ? null
          : JSON.stringify(row.conversion_rates),
      ],
    );
    if (result.rowCount === 1) report.updated++;
    else report.conflicts++;
  }
  const after = await pool.query("SELECT * FROM expenses ORDER BY id");
  const unchanged = fingerprint(after.rows) === before;
  console.log(
    JSON.stringify({ ...report, originalsUnchanged: unchanged }, null, 2),
  );
  if (!unchanged)
    throw new Error(
      "Original data changed during migration; inspect backup and concurrent activity",
    );
  if (report.conflicts > 0)
    throw new Error(
      "Concurrent edits detected; rerun migration to complete skipped expenses",
    );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
