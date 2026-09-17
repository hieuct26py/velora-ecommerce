-- CreateIndex
CREATE INDEX "idx_orders_status_created_desc" ON "orders"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_created_desc" ON "orders"("created_at" DESC);
