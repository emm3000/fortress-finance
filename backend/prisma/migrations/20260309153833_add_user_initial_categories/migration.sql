-- CreateTable
CREATE TABLE "user_initial_categories" (
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_initial_categories_pkey" PRIMARY KEY ("user_id","category_id")
);

-- CreateIndex
CREATE INDEX "user_initial_categories_user_id_idx" ON "user_initial_categories"("user_id");

-- AddForeignKey
ALTER TABLE "user_initial_categories"
ADD CONSTRAINT "user_initial_categories_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_initial_categories"
ADD CONSTRAINT "user_initial_categories_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
