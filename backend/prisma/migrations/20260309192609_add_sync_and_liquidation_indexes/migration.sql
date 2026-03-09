-- CreateIndex
CREATE INDEX "budgets_user_id_updated_at_idx" ON "budgets"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_id_type_date_idx" ON "transactions"("user_id", "category_id", "type", "date");

-- CreateIndex
CREATE INDEX "user_inventories_user_id_updated_at_idx" ON "user_inventories"("user_id", "updated_at");
