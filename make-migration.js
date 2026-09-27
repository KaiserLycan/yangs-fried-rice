const fs = require('fs');

let content = fs.readFileSync('scratch/migration_base.sql', 'utf8');

// We only need the CREATE OR REPLACE FUNCTION public.submit_cart_to_order
let startIndex = content.indexOf('CREATE OR REPLACE FUNCTION public.submit_cart_to_order');
let endIndex = content.indexOf('REVOKE ALL ON FUNCTION public.submit_cart_to_order');
let func = content.substring(startIndex, endIndex);

func = func.replace(
  	o_char(make_time((v_store->>'open_hour')::integer, 0, 0), 'FMHH12:MI AM'),
  	o_char((v_store->>'open_time')::time, 'FMHH12:MI AM')
);

let limitsCheck = \
  -- Per-dish limit (issue #115) --------------------------------------------
  SELECT p.product_name
  INTO v_unavailable
  FROM public.cart_item ci
  JOIN public.product p ON p.product_id = ci.product_id
  WHERE ci.cart_id = p_cart_id
  GROUP BY p.product_id, p.product_name
  HAVING sum(ci.quantity) > 20
  LIMIT 1;

  IF v_unavailable IS NOT NULL THEN
    RAISE EXCEPTION 'You can only order up to 20 of each dish (%).', v_unavailable
      USING HINT = 'ITEM_LIMIT_EXCEEDED';
  END IF;

\;

func = func.replace(
    -- Everything in the cart must still be on sale.,
  limitsCheck +   -- Everything in the cart must still be on sale.
);

let migration = \-- Issue #115: Per-dish limits and dynamic open_time

DROP FUNCTION IF EXISTS public.submit_cart_to_order(uuid, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.submit_cart_to_order(uuid, text, text, text);

\ + func + \
REVOKE ALL ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, jsonb, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
\;

fs.writeFileSync('supabase/migrations/20260928000008_submit_cart_to_order_limits.sql', migration, 'utf8');
