-- CreateEnum
CREATE TYPE "CastleStatus" AS ENUM ('HEALTHY', 'UNDER_ATTACK', 'RUINS');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ATTACK', 'REWARD', 'SHOP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED');

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "period",
ADD COLUMN     "period" "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "castle_states" DROP COLUMN "status",
ADD COLUMN     "status" "CastleStatus" NOT NULL DEFAULT 'HEALTHY';

-- AlterTable
ALTER TABLE "notification_logs" DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'SENT';

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_type_key" ON "categories"("name", "type");

