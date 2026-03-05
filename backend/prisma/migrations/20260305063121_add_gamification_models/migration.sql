-- CreateTable
CREATE TABLE "castle_states" (
    "user_id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "max_hp" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "castle_states_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "limit_amount" DECIMAL(10,2) NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_events_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_desc" VARCHAR NOT NULL,
    "hp_impact" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_events_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_id_key" ON "budgets"("user_id", "category_id");

-- CreateIndex
CREATE INDEX "game_events_log_user_id_created_at_idx" ON "game_events_log"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "castle_states" ADD CONSTRAINT "castle_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_events_log" ADD CONSTRAINT "game_events_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
