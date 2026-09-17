SET local check_function_bodies = off;

CREATE EXTENSION "pg_cron";

CREATE TABLE "public"."add_on" (
  "addon_id"   uuid          NOT NULL DEFAULT gen_random_uuid(),
  "product_id" uuid,
  "name"       text          NOT NULL,
  "price"      numeric(10,2) NOT NULL,
  CONSTRAINT "add_on_pkey" PRIMARY KEY (addon_id)
);

CREATE TABLE "public"."cart_item_add_on" (
  "cart_item_add_on_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "cart_item_id"        uuid,
  "addon_id"            uuid,
  CONSTRAINT "cart_item_add_on_pkey" PRIMARY KEY (cart_item_add_on_id)
);

CREATE TABLE "public"."cart_item" (
  "cart_item_id"         uuid    NOT NULL DEFAULT gen_random_uuid(),
  "cart_id"              uuid,
  "product_id"           uuid,
  "quantity"             integer NOT NULL DEFAULT 1,
  "special_instructions" text,
  CONSTRAINT "cart_item_pkey" PRIMARY KEY (cart_item_id)
);

ALTER TABLE "public"."cart_item"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."cart" (
  "cart_id"      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"  uuid,
  "updated_at"   timestamp with time zone DEFAULT now(),
  "order_id"     uuid,
  "is_final"     boolean                  NOT NULL DEFAULT false,
  "status"       text                     NOT NULL DEFAULT 'active'::text,
  "submitted_at" timestamp with time zone,
  CONSTRAINT "cart_pkey" PRIMARY KEY (cart_id)
);

ALTER TABLE "public"."cart"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."categories" (
  "category_id"   uuid NOT NULL DEFAULT gen_random_uuid(),
  "category_name" text NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY (category_id)
);

CREATE TABLE "public"."customer_address" (
  "address_id"      uuid    NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"     uuid,
  "label"           text,
  "address_details" text    NOT NULL,
  "address_note"    text,
  "is_default"      boolean NOT NULL DEFAULT false,
  CONSTRAINT "customer_address_pkey" PRIMARY KEY (address_id)
);

CREATE TABLE "public"."customer" (
  "customer_id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"                  text                     NOT NULL,
  "email"                 text,
  "phone_number"          text,
  "profileImage_URL"      text,
  "password_last_updated" timestamp with time zone DEFAULT now(),
  "is_account_disabled"   boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "customer_email_key" UNIQUE (email),
  CONSTRAINT "customer_pkey" PRIMARY KEY (customer_id)
);

CREATE TABLE "public"."delivery" (
  "delivery_id"       uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"          uuid,
  "employee_id"       uuid,
  "rider_id"          uuid,
  "estimated_time"    timestamp with time zone,
  "completed_at"      timestamp with time zone,
  "delivery_status"   text,
  "proof_of_delivery" text,
  CONSTRAINT "delivery_pkey" PRIMARY KEY (delivery_id)
);

CREATE TABLE "public"."employee" (
  "employee_id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"                  text                     NOT NULL,
  "role"                  text,
  "schedule_shift"        text,
  "last_access_log"       timestamp with time zone,
  "email"                 character varying        NOT NULL,
  "profileImage_URL"      text,
  "password_last_updated" timestamp with time zone DEFAULT now(),
  "is_account_disabled"   boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "employee_email_key" UNIQUE (email),
  CONSTRAINT "employee_pkey" PRIMARY KEY (employee_id)
);

CREATE TABLE "public"."notification" (
  "notification_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"     uuid,
  "message"         text                     NOT NULL,
  "is_read"         boolean                  DEFAULT false,
  "created_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "notification_pkey" PRIMARY KEY (notification_id)
);

CREATE TABLE "public"."order_item_add_on" (
  "order_item_add_on_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "order_item_id"        uuid,
  "addon_id"             uuid,
  CONSTRAINT "order_item_add_on_pkey" PRIMARY KEY (order_item_add_on_id)
);

CREATE TABLE "public"."order_item" (
  "order_item_id"        uuid          NOT NULL DEFAULT gen_random_uuid(),
  "order_id"             uuid,
  "product_id"           uuid,
  "quantity"             integer       NOT NULL DEFAULT 1,
  "subtotal"             numeric(10,2) NOT NULL,
  "special_instructions" text,
  CONSTRAINT "order_item_pkey" PRIMARY KEY (order_item_id)
);

ALTER TABLE "public"."order_item"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order" (
  "order_id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"          uuid,
  "employee_id"          uuid,
  "order_type"           text,
  "order_status"         text,
  "delivery_fee"         numeric(10,2)            DEFAULT 0.00,
  "completed_at"         timestamp with time zone,
  "special_instructions" text,
  "cancelled_at"         timestamp with time zone,
  "cancellation_reason"  text,
  "created_at"           timestamp with time zone DEFAULT now(),
  CONSTRAINT "order_pkey" PRIMARY KEY (order_id)
);

ALTER TABLE "public"."order"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product" (
  "product_id"      uuid          NOT NULL DEFAULT gen_random_uuid(),
  "category_id"     uuid,
  "product_name"    text          NOT NULL,
  "product_details" text,
  "is_available"    boolean       DEFAULT true,
  "product_price"   numeric(10,2) NOT NULL,
  CONSTRAINT "product_pkey" PRIMARY KEY (product_id)
);

CREATE TABLE "public"."reports" (
  "report_id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "generated_by_employee_id" uuid,
  "report_type"              text,
  "date_range_start"         date,
  "date_range_end"           date,
  "total_gross_sales"        numeric(10,2),
  "total_net_sales"          numeric(10,2),
  "total_orders_processed"   integer,
  "generated_at"             timestamp with time zone DEFAULT now(),
  CONSTRAINT "reports_pkey" PRIMARY KEY (report_id)
);

CREATE TABLE "public"."review" (
  "review_id"   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" uuid,
  "order_id"    uuid,
  "rating"      integer,
  "comment"     text,
  "created_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "review_order_unique" UNIQUE (order_id),
  CONSTRAINT "review_pkey" PRIMARY KEY (review_id),
  CONSTRAINT "review_rating_check" CHECK (((rating >= 1) AND (rating <= 5)))
);

ALTER TABLE "public"."review"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."rider" (
  "rider_id"              uuid NOT NULL DEFAULT gen_random_uuid(),
  "employee_id"           uuid,
  "driver_license_number" text,
  "vehicle_make_model"    text,
  "vehicle_plate_number"  text,
  "license_expiry_date"   date,
  CONSTRAINT "rider_pkey" PRIMARY KEY (rider_id)
);

CREATE TABLE "public"."transaction" (
  "transaction_id"     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"           uuid,
  "transaction_type"   text,
  "payment_method"     text,
  "payment_status"     text,
  "subtotal"           numeric(10,2),
  "tax_amount"         numeric(10,2),
  "discount_amount"    numeric(10,2)            DEFAULT 0.00,
  "discount_type"      text,
  "discount_id_number" text,
  "total_paid"         numeric(10,2),
  "transaction_date"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "transaction_pkey" PRIMARY KEY (transaction_id)
);

ALTER TABLE "public"."transaction"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_customer_order_history (
  p_customer_id uuid
)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
DECLARE
  result json;
BEGIN
  -- Security: only allow customers to fetch their own history
  IF auth.uid() IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Access denied: you can only view your own order history.';
  END IF;

  SELECT json_agg(order_row ORDER BY order_row.created_at DESC)
  INTO result
  FROM (
    SELECT
      o.order_id,
      o.order_status,
      o.order_type,
      o.created_at,
      o.completed_at,
      o.special_instructions,
      o.delivery_fee,
      -- Itemized receipt: array of items in this order
      (
        SELECT COALESCE(json_agg(json_build_object(
          'order_item_id', oi.order_item_id,
          'product_name', p.product_name,
          'product_price', p.product_price,
          'quantity', oi.quantity,
          'subtotal', oi.subtotal,
          'special_instructions', oi.special_instructions
        )), '[]'::json)
        FROM order_item oi
        LEFT JOIN product p ON p.product_id = oi.product_id
        WHERE oi.order_id = o.order_id
      ) AS items,
      -- Payment info
      (
        SELECT COALESCE(json_agg(json_build_object(
          'transaction_id', t.transaction_id,
          'payment_method', t.payment_method,
          'payment_status', t.payment_status,
          'subtotal', t.subtotal,
          'tax_amount', t.tax_amount,
          'discount_amount', t.discount_amount,
          'total_paid', t.total_paid
        )), '[]'::json)
        FROM transaction t
        WHERE t.order_id = o.order_id
      ) AS transactions,
      -- Review (if one exists for this order)
      (
        SELECT json_build_object(
          'review_id', r.review_id,
          'rating', r.rating,
          'comment', r.comment,
          'created_at', r.created_at
        )
        FROM review r
        WHERE r.order_id = o.order_id
        LIMIT 1
      ) AS review
    FROM "order" o
    WHERE o.customer_id = p_customer_id
  ) AS order_row;

  -- Return empty array instead of null if no orders
  RETURN COALESCE(result, '[]'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_password_timestamp_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
BEGIN
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    -- Update employee table if this user is an employee
    UPDATE public.employee
    SET password_last_updated = NOW()
    WHERE employee_id = NEW.id;

    -- Update customer table if this user is a customer
    UPDATE public.customer
    SET password_last_updated = NOW()
    WHERE customer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_order_review (
  p_order_id uuid,
  p_rating   integer,
  p_comment  text    DEFAULT NULL::text
)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
DECLARE
  v_order record;
  v_existing_review_id uuid;
  v_new_review review%ROWTYPE;
BEGIN
  -- 1. Validate rating
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;

  -- 2. Fetch the order and verify ownership
  SELECT order_id, customer_id, order_status
  INTO v_order
  FROM "order"
  WHERE order_id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.customer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied: this order does not belong to you.';
  END IF;

  -- 3. Verify the order is completed
  IF v_order.order_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'You can only review completed orders. Current status: %.', v_order.order_status;
  END IF;

  -- 4. Check for existing review
  SELECT review_id INTO v_existing_review_id
  FROM review
  WHERE order_id = p_order_id;

  IF v_existing_review_id IS NOT NULL THEN
    RAISE EXCEPTION 'You have already reviewed this order.';
  END IF;

  -- 5. Insert the review
  INSERT INTO review (customer_id, order_id, rating, comment)
  VALUES (auth.uid(), p_order_id, p_rating, p_comment)
  RETURNING * INTO v_new_review;

  -- 6. Return the new review as JSON
  RETURN json_build_object(
    'review_id', v_new_review.review_id,
    'order_id', v_new_review.order_id,
    'customer_id', v_new_review.customer_id,
    'rating', v_new_review.rating,
    'comment', v_new_review.comment,
    'created_at', v_new_review.created_at
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_password_timestamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  -- Checks if the new password is different from the old one
  IF NEW.password IS DISTINCT FROM OLD.password THEN
    NEW.password_last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

ALTER TABLE "public"."cart_item"
  ADD CONSTRAINT "cart_item_cart_id_fkey" FOREIGN KEY (cart_id) REFERENCES public.cart(cart_id) ON DELETE CASCADE;

ALTER TABLE "public"."cart_item_add_on"
  ADD CONSTRAINT "cart_item_add_on_addon_id_fkey" FOREIGN KEY (addon_id) REFERENCES public.add_on(addon_id) ON DELETE CASCADE;

ALTER TABLE "public"."cart_item_add_on"
  ADD CONSTRAINT "cart_item_add_on_cart_item_id_fkey" FOREIGN KEY (cart_item_id) REFERENCES public.cart_item(cart_item_id) ON DELETE CASCADE;

ALTER TABLE "public"."customer"
  ADD CONSTRAINT "customer_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES auth.users(id);

ALTER TABLE "public"."cart"
  ADD CONSTRAINT "cart_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;

ALTER TABLE "public"."customer_address"
  ADD CONSTRAINT "customer_address_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;

ALTER TABLE "public"."employee"
  ADD CONSTRAINT "employee_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES auth.users(id);

ALTER TABLE "public"."delivery"
  ADD CONSTRAINT "delivery_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;

ALTER TABLE "public"."notification"
  ADD CONSTRAINT "notification_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;

ALTER TABLE "public"."order"
  ADD CONSTRAINT "order_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE SET NULL;

ALTER TABLE "public"."order"
  ADD CONSTRAINT "order_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;

ALTER TABLE "public"."cart"
  ADD CONSTRAINT "cart_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."order"(order_id) ON DELETE SET NULL;

ALTER TABLE "public"."delivery"
  ADD CONSTRAINT "delivery_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."order"(order_id) ON DELETE CASCADE;

ALTER TABLE "public"."order_item"
  ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."order"(order_id) ON DELETE CASCADE;

ALTER TABLE "public"."order_item_add_on"
  ADD CONSTRAINT "order_item_add_on_addon_id_fkey" FOREIGN KEY (addon_id) REFERENCES public.add_on(addon_id) ON DELETE SET NULL;

ALTER TABLE "public"."order_item_add_on"
  ADD CONSTRAINT "order_item_add_on_order_item_id_fkey" FOREIGN KEY (order_item_id) REFERENCES public.order_item(order_item_id) ON DELETE CASCADE;

ALTER TABLE "public"."product"
  ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;

ALTER TABLE "public"."add_on"
  ADD CONSTRAINT "add_on_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;

ALTER TABLE "public"."cart_item"
  ADD CONSTRAINT "cart_item_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;

ALTER TABLE "public"."order_item"
  ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE SET NULL;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_generated_by_employee_id_fkey" FOREIGN KEY (generated_by_employee_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;

ALTER TABLE "public"."review"
  ADD CONSTRAINT "review_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;

ALTER TABLE "public"."review"
  ADD CONSTRAINT "review_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."order"(order_id) ON DELETE CASCADE;

ALTER TABLE "public"."rider"
  ADD CONSTRAINT "rider_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON DELETE CASCADE;

ALTER TABLE "public"."delivery"
  ADD CONSTRAINT "delivery_rider_id_fkey" FOREIGN KEY (rider_id) REFERENCES public.rider(rider_id) ON DELETE SET NULL;

ALTER TABLE "public"."transaction"
  ADD CONSTRAINT "transaction_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."order"(order_id) ON DELETE CASCADE;

CREATE TRIGGER on_auth_user_password_update
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_password_timestamp_update();

CREATE POLICY "customer_insert_own_cart" ON "public"."cart"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((customer_id = auth.uid()));

CREATE POLICY "customer_select_own_cart" ON "public"."cart"
  FOR SELECT
  TO "authenticated"
  USING ((customer_id = auth.uid()));

CREATE POLICY "customer_update_own_cart" ON "public"."cart"
  FOR UPDATE
  TO "authenticated"
  USING (((customer_id = auth.uid()) AND (is_final = false)))
  WITH CHECK ((customer_id = auth.uid()));

CREATE POLICY "customer_delete_own_cart_items" ON "public"."cart_item"
  FOR DELETE
  TO "authenticated"
  USING ((cart_id IN ( SELECT cart.cart_id
   FROM public.cart
  WHERE ((cart.customer_id = auth.uid()) AND (cart.is_final = false)))));

CREATE POLICY "customer_insert_own_cart_items" ON "public"."cart_item"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((cart_id IN ( SELECT cart.cart_id
   FROM public.cart
  WHERE ((cart.customer_id = auth.uid()) AND (cart.is_final = false)))));

CREATE POLICY "customer_select_own_cart_items" ON "public"."cart_item"
  FOR SELECT
  TO "authenticated"
  USING ((cart_id IN ( SELECT cart.cart_id
   FROM public.cart
  WHERE (cart.customer_id = auth.uid()))));

CREATE POLICY "customer_update_own_cart_items" ON "public"."cart_item"
  FOR UPDATE
  TO "authenticated"
  USING ((cart_id IN ( SELECT cart.cart_id
   FROM public.cart
  WHERE ((cart.customer_id = auth.uid()) AND (cart.is_final = false)))));

CREATE POLICY "customer_cancel_own_orders" ON "public"."order"
  FOR UPDATE
  TO "authenticated"
  USING (((customer_id = auth.uid()) AND (order_status = 'pending'::text)))
  WITH CHECK (((customer_id = auth.uid()) AND (order_status = 'cancelled'::text)));

CREATE POLICY "customer_insert_own_orders" ON "public"."order"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((customer_id = auth.uid()));

CREATE POLICY "customer_select_own_orders" ON "public"."order"
  FOR SELECT
  TO "authenticated"
  USING ((customer_id = auth.uid()));

CREATE POLICY "employee_select_all_orders" ON "public"."order"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() IN ( SELECT employee.employee_id
   FROM public.employee)));

CREATE POLICY "employee_update_all_orders" ON "public"."order"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() IN ( SELECT employee.employee_id
   FROM public.employee)));

CREATE POLICY "customer_insert_own_order_items" ON "public"."order_item"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((order_id IN ( SELECT "order".order_id
   FROM public."order"
  WHERE ("order".customer_id = auth.uid()))));

CREATE POLICY "customer_select_own_order_items" ON "public"."order_item"
  FOR SELECT
  TO "authenticated"
  USING ((order_id IN ( SELECT "order".order_id
   FROM public."order"
  WHERE ("order".customer_id = auth.uid()))));

CREATE POLICY "employee_select_all_order_items" ON "public"."order_item"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() IN ( SELECT employee.employee_id
   FROM public.employee)));

CREATE POLICY "customer_insert_own_review" ON "public"."review"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((customer_id = auth.uid()) AND (order_id IN ( SELECT "order".order_id
   FROM public."order"
  WHERE (("order".customer_id = auth.uid()) AND ("order".order_status = 'completed'::text))))));

CREATE POLICY "customer_select_own_reviews" ON "public"."review"
  FOR SELECT
  TO "authenticated"
  USING ((customer_id = auth.uid()));

CREATE POLICY "employee_select_all_reviews" ON "public"."review"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() IN ( SELECT employee.employee_id
   FROM public.employee)));

CREATE POLICY "customer_select_own_transactions" ON "public"."transaction"
  FOR SELECT
  TO "authenticated"
  USING ((order_id IN ( SELECT "order".order_id
   FROM public."order"
  WHERE ("order".customer_id = auth.uid()))));

CREATE POLICY "employee_select_all_transactions" ON "public"."transaction"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() IN ( SELECT employee.employee_id
   FROM public.employee)));

CREATE POLICY "Authenticated users can upload bsyl9d_0" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((bucket_id = 'proof-of-delivery'::text));

CREATE POLICY "Public can view proof of delivery bsyl9d_0" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'proof-of-delivery'::text));

COMMENT ON EXTENSION "pg_cron" IS 'Job scheduler for PostgreSQL';

GRANT EXECUTE ON FUNCTION "public"."get_customer_order_history"(uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_password_timestamp_update"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."submit_order_review"(uuid, integer, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_password_timestamp"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."add_on" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_item" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_item_add_on" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customer" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customer_address" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."delivery" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."employee" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notification" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_item" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_item_add_on" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reports" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."review" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."rider" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transaction" TO "anon", "authenticated", "postgres", "service_role";

