-- Best sellers (limitations L14): the dishes ordered most over the last
-- `p_days` days, for the landing page and the "Best Seller" badge on menu
-- cards. Counts completed orders only, so a burst of cancelled orders can't
-- promote a dish.
--
-- SECURITY DEFINER because guests can't read order_item; the function only
-- ever returns product ids and counts, never who ordered what.
create or replace function public.best_sellers(p_days integer default 30, p_limit integer default 3)
returns table (product_id uuid, units_sold bigint)
language sql
stable
security definer
set search_path = public
as $$
  select oi.product_id, sum(oi.quantity)::bigint as units_sold
  from public.order_item oi
  join public."order" o on o.order_id = oi.order_id
  join public.product p on p.product_id = oi.product_id
  where o.order_status = 'completed'
    and o.created_at >= now() - make_interval(days => greatest(1, least(p_days, 365)))
    and p.archived_at is null
  group by oi.product_id
  order by units_sold desc, oi.product_id
  limit greatest(1, least(p_limit, 20));
$$;

revoke all on function public.best_sellers(integer, integer) from public;
grant execute on function public.best_sellers(integer, integer) to anon, authenticated;
