-- The automatic-refund flow (issue #115) moves a paid wallet order's payment
-- to refund_pending when the order is cancelled (flag_refund_on_cancel), and
-- the process-refunds job moves it on to refunded or refund_failed. The
-- CHECK constraint added later listed only pending / paid / failed / refunded,
-- so cancelling any paid GCash or Maya order failed outright: the trigger's
-- update broke the constraint and rolled the cancellation back.
ALTER TABLE public.transaction DROP CONSTRAINT IF EXISTS transaction_payment_status_check;
ALTER TABLE public.transaction
  ADD CONSTRAINT transaction_payment_status_check CHECK (
    payment_status = ANY (ARRAY['pending', 'paid', 'failed', 'refund_pending', 'refunded', 'refund_failed'])
  );
