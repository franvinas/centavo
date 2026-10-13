-- Additive migration: originals and legacy converted values remain intact.
ALTER TABLE "expenses"
  ALTER COLUMN "base_amount" DROP NOT NULL,
  ALTER COLUMN "exchange_rate" DROP NOT NULL,
  ADD COLUMN "legacy_conversion" JSONB,
  ADD COLUMN "usd_amount" DECIMAL(24,10),
  ADD COLUMN "usd_exchange_rate" DECIMAL(24,16),
  ADD COLUMN "conversion_rates" JSONB;

UPDATE "expenses" AS e
SET "legacy_conversion" = jsonb_build_object(
  'baseCurrency', u."base_currency",
  'baseAmount', e."base_amount"::text,
  'exchangeRate', e."exchange_rate"::text
)
FROM "users" AS u
WHERE u."id" = e."user_id";
