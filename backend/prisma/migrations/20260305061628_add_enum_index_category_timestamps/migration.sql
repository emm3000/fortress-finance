-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable: categories
-- 1. Add created_at with a default so existing rows get a value
ALTER TABLE "categories"
  ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Add updated_at with a temporary default so existing rows get a value, then remove the default
ALTER TABLE "categories"
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "categories" ALTER COLUMN "updated_at" DROP DEFAULT;

-- 3. Convert type column from VARCHAR to enum using USING to cast existing values
ALTER TABLE "categories"
  ALTER COLUMN "type" TYPE "TransactionType" USING "type"::"TransactionType";

-- AlterTable: transactions
-- Convert type column from VARCHAR to enum
ALTER TABLE "transactions"
  ALTER COLUMN "type" TYPE "TransactionType" USING "type"::"TransactionType";

-- CreateIndex: composite index for efficient sync PULL queries
CREATE INDEX "transactions_user_id_updated_at_idx" ON "transactions"("user_id", "updated_at");
