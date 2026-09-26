-- Failed sign-in attempts, for rate limiting (lib/auth/login-rate-limit.ts).
--
-- One row per wrong password. The app counts rows per email hash and per IP
-- over a 15-minute window, clears an email's rows on successful sign-in or
-- password reset, and prunes anything older than a day as it goes.
--
-- Only the service role touches this table. RLS is on with no policies and
-- the anon/authenticated grants are revoked, so a browser holding the anon
-- key can neither read who has been failing to sign in nor delete its own
-- failures to reset the counter.
--
-- The email is stored as a SHA-256 hex digest of the trimmed, lower-cased
-- address: enough to count attempts against it, without keeping a readable
-- list of addresses people typed.

CREATE TABLE IF NOT EXISTS public.login_attempt (
  login_attempt_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email_hash       text        NOT NULL,
  ip               text,
  attempted_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempt_email_time_idx
  ON public.login_attempt (email_hash, attempted_at);
CREATE INDEX IF NOT EXISTS login_attempt_ip_time_idx
  ON public.login_attempt (ip, attempted_at);

ALTER TABLE public.login_attempt ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.login_attempt FROM anon, authenticated;

COMMENT ON TABLE public.login_attempt IS
  'Failed password sign-ins, counted for rate limiting. Service role only.';

NOTIFY pgrst, 'reload schema';
