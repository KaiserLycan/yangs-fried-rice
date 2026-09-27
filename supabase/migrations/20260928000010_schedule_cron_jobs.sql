-- Issue #115: switch on the three timed jobs, every 5 minutes.
--
--   expire-abandoned-orders   unpaid GCash / Maya orders older than 30
--                             minutes → cancelled (20260926000003)
--   expire-unaccepted-orders  orders pending (not accepted by staff) for 20
--                             minutes → cancelled "Store didn't confirm in
--                             time"; paid ones flagged for refund
--                             (20260928000009, 20260928000004)
--   process-refunds           calls the process-refunds edge function,
--                             which sends PayMongo refunds for everything
--                             flagged refund_pending
--
-- Needs, before running (DB-7):
--   * extensions pg_cron (already on) and pg_net;
--   * Vault secrets `project_url` (https://<ref>.supabase.co) and
--     `refund_cron_secret` (equal to the function's REFUND_CRON_SECRET);
--   * the process-refunds function deployed with JWT verification off.
--
-- Safe to run twice: any existing job with the same name is removed first.
-- To switch everything off again:
--   SELECT cron.unschedule(jobname) FROM cron.job
--   WHERE jobname IN ('expire-abandoned-orders','expire-unaccepted-orders','process-refunds');

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('expire-abandoned-orders', 'expire-unaccepted-orders', 'process-refunds');

SELECT cron.schedule(
  'expire-abandoned-orders',
  '*/5 * * * *',
  $$SELECT public.expire_abandoned_orders(interval '30 minutes')$$
);

SELECT cron.schedule(
  'expire-unaccepted-orders',
  '*/5 * * * *',
  $$SELECT public.expire_unaccepted_orders(interval '20 minutes')$$
);

-- The secret is read from Vault when the job runs, so it never appears in
-- cron.job's command text.
SELECT cron.schedule(
  'process-refunds',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/process-refunds',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets
                                   WHERE name = 'refund_cron_secret')
               ),
    body    := '{}'::jsonb
  );
  $$
);
