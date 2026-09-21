CREATE TABLE "public"."cart_add_on" (
  "cart_add_on_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "cart_id"        uuid REFERENCES "public"."cart"("cart_id") ON DELETE CASCADE,
  "addon_id"       uuid REFERENCES "public"."add_on"("addon_id") ON DELETE CASCADE,
  CONSTRAINT "cart_add_on_pkey" PRIMARY KEY (cart_add_on_id)
);

CREATE TABLE "public"."order_add_on" (
  "order_add_on_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "order_id"        uuid REFERENCES "public"."order"("order_id") ON DELETE CASCADE,
  "addon_id"        uuid REFERENCES "public"."add_on"("addon_id") ON DELETE SET NULL,
  "price"           numeric(10,2) NOT NULL,
  CONSTRAINT "order_add_on_pkey" PRIMARY KEY (order_add_on_id)
);

ALTER TABLE "public"."cart_add_on" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_add_on" ENABLE ROW LEVEL SECURITY;

-- Policies for cart_add_on
CREATE POLICY "customer_select_own_cart_add_on" ON "public"."cart_add_on"
  FOR SELECT TO "authenticated"
  USING (cart_id IN (SELECT cart_id FROM cart WHERE customer_id = auth.uid()));

CREATE POLICY "customer_insert_own_cart_add_on" ON "public"."cart_add_on"
  FOR INSERT TO "authenticated"
  WITH CHECK (cart_id IN (SELECT cart_id FROM cart WHERE customer_id = auth.uid() AND is_final = false));

CREATE POLICY "customer_delete_own_cart_add_on" ON "public"."cart_add_on"
  FOR DELETE TO "authenticated"
  USING (cart_id IN (SELECT cart_id FROM cart WHERE customer_id = auth.uid() AND is_final = false));

-- Policies for order_add_on
CREATE POLICY "customer_select_own_order_add_on" ON "public"."order_add_on"
  FOR SELECT TO "authenticated"
  USING (order_id IN (SELECT order_id FROM "order" WHERE customer_id = auth.uid()));

CREATE POLICY "customer_insert_own_order_add_on" ON "public"."order_add_on"
  FOR INSERT TO "authenticated"
  WITH CHECK (order_id IN (SELECT order_id FROM "order" WHERE customer_id = auth.uid()));

CREATE POLICY "employee_select_all_order_add_on" ON "public"."order_add_on"
  FOR SELECT TO "authenticated"
  USING (auth.uid() IN (SELECT employee_id FROM employee));
