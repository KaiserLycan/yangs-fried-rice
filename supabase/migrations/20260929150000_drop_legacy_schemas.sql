-- Final clean-up (handoff item 8), approved by the owner.
--
-- `archive` held the rider and delivery tables dropped when the shop went
-- pickup-only (issue #114); `backup` held a copy of `transaction` taken
-- before the payment-spelling fix. Neither is read by anything. A JSON
-- export of both was taken before this ran.
DROP SCHEMA IF EXISTS archive CASCADE;
DROP SCHEMA IF EXISTS backup CASCADE;

-- One order-type vocabulary (DBA and system-analyst reviews). New orders are
-- always `take_out`; `delivery` stays for orders placed before #114.
ALTER TABLE public."order" DROP CONSTRAINT IF EXISTS order_type_check;
ALTER TABLE public."order"
  ADD CONSTRAINT order_type_check CHECK (order_type IN ('take_out', 'delivery'));
