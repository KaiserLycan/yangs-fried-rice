-- Add partial unique constraint for direct reviews (order_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "review_customer_product_unique" ON "public"."review" ("customer_id", "product_id") WHERE "order_id" IS NULL;

-- Create RPC for direct product reviews
CREATE OR REPLACE FUNCTION public.submit_direct_product_review (
  p_product_id uuid,
  p_rating   integer,
  p_comment  text    DEFAULT NULL::text
)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
DECLARE
  v_product record;
  v_existing_review_id uuid;
  v_new_review review%ROWTYPE;
BEGIN
  -- 1. Validate rating
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;

  -- 2. Verify product exists
  SELECT product_id INTO v_product
  FROM "product"
  WHERE product_id = p_product_id;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  -- 3. Check for existing direct review
  SELECT review_id INTO v_existing_review_id
  FROM review
  WHERE customer_id = auth.uid() AND product_id = p_product_id AND order_id IS NULL;
  
  IF v_existing_review_id IS NOT NULL THEN
    RAISE EXCEPTION 'You have already submitted a direct review for this product.';
  END IF;

  -- 4. Insert the review
  INSERT INTO review (customer_id, order_id, rating, comment, product_id)
  VALUES (auth.uid(), NULL, p_rating, p_comment, p_product_id)
  RETURNING * INTO v_new_review;

  -- 5. Return the new review as JSON
  RETURN json_build_object(
    'review_id', v_new_review.review_id,
    'customer_id', v_new_review.customer_id,
    'rating', v_new_review.rating,
    'comment', v_new_review.comment,
    'product_id', v_new_review.product_id,
    'created_at', v_new_review.created_at
  );
END;
$function$;
