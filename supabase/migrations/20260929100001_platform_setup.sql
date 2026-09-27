-- Platform setup that a schema dump does not carry: storage buckets and
-- their policies, the auth.users trigger, and the pg_cron schedule.
-- Idempotent, so it can be replayed on a fresh project or on this one.
--
-- Companion to 20260929100000_baseline.sql. Together they replace the 57
-- incremental migrations squashed on 2026-09-29; the history is in git.

-- ---------------------------------------------------------------------------
-- Storage buckets. Public ones hold menu, promotion and profile photos;
-- private ones hold Senior/PWD ID photos and order-issue evidence.
-- Size and type limits match imageUploadProblem (lib/storage/stored-image.ts).
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('menu-images',        'menu-images',        true,  5242880, '{image/jpeg,image/png,image/webp}'::text[]),
  ('promotion-images',   'promotion-images',   true,  5242880, '{image/jpeg,image/png,image/webp}'::text[]),
  ('avatars',            'avatars',            true,  5242880, '{image/jpeg,image/png,image/webp}'::text[]),
  ('emp-pfp',            'emp-pfp',            true,  5242880, '{image/jpeg,image/png,image/webp}'::text[]),
  ('senior-pwd-ids',     'senior-pwd-ids',     false, 2097152, '{image/jpeg,image/png,image/webp,image/heic}'::text[]),
  ('order-issue-photos', 'order-issue-photos', false, 2097152, '{image/jpeg,image/png,image/webp}'::text[])
ON CONFLICT (id) DO UPDATE
  SET public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage policies.
-- ---------------------------------------------------------------------------

-- Menu photos: public read (bucket is public); employees upload from the
-- browser (app/manage/menu/menu-client.tsx).
DROP POLICY IF EXISTS menu_images_employee_insert ON storage.objects;
CREATE POLICY menu_images_employee_insert ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'menu-images'::text) AND (current_employee_role() = ANY (ARRAY['MANAGER'::text, 'STAFF'::text])));

-- Promotion banners: public read, manager write.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects AS PERMISSIVE FOR SELECT TO public
  USING (bucket_id = 'promotion-images'::text);
DROP POLICY IF EXISTS "Managers can upload promotion images" ON storage.objects;
CREATE POLICY "Managers can upload promotion images" ON storage.objects AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((bucket_id = 'promotion-images'::text) AND (current_employee_role() = 'MANAGER'::text));
DROP POLICY IF EXISTS "Managers can update promotion images" ON storage.objects;
CREATE POLICY "Managers can update promotion images" ON storage.objects AS PERMISSIVE FOR UPDATE TO public
  USING ((bucket_id = 'promotion-images'::text) AND (current_employee_role() = 'MANAGER'::text));
DROP POLICY IF EXISTS "Managers can delete promotion images" ON storage.objects;
CREATE POLICY "Managers can delete promotion images" ON storage.objects AS PERMISSIVE FOR DELETE TO public
  USING ((bucket_id = 'promotion-images'::text) AND (current_employee_role() = 'MANAGER'::text));

-- Customer avatars: public read; a customer writes only <auth.uid()>/.
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
CREATE POLICY "Public Access for avatars" ON storage.objects AS PERMISSIVE FOR SELECT TO public
  USING (bucket_id = 'avatars'::text);
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

-- Employee photos: public read; written only by the service role
-- (lib/actions/admin.ts), which bypasses RLS.
DROP POLICY IF EXISTS "Can view pfp 1852egl_0" ON storage.objects;
CREATE POLICY "Can view pfp 1852egl_0" ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (bucket_id = 'emp-pfp'::text);

-- Senior/PWD ID photos: the customer uploads into their own folder; staff
-- view and delete (deleted once the order is done).
DROP POLICY IF EXISTS senior_pwd_ids_customer_insert_own ON storage.objects;
CREATE POLICY senior_pwd_ids_customer_insert_own ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'senior-pwd-ids'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));
DROP POLICY IF EXISTS senior_pwd_ids_staff_select ON storage.objects;
CREATE POLICY senior_pwd_ids_staff_select ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING ((bucket_id = 'senior-pwd-ids'::text) AND (current_employee_role() = ANY (ARRAY['MANAGER'::text, 'STAFF'::text])));
DROP POLICY IF EXISTS senior_pwd_ids_staff_delete ON storage.objects;
CREATE POLICY senior_pwd_ids_staff_delete ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING ((bucket_id = 'senior-pwd-ids'::text) AND (current_employee_role() = ANY (ARRAY['MANAGER'::text, 'STAFF'::text])));

-- Order-issue photos: the customer's own folder; staff can view.
DROP POLICY IF EXISTS order_issue_photos_customer_insert_own ON storage.objects;
CREATE POLICY order_issue_photos_customer_insert_own ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'order-issue-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));
DROP POLICY IF EXISTS order_issue_photos_customer_select_own ON storage.objects;
CREATE POLICY order_issue_photos_customer_select_own ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING ((bucket_id = 'order-issue-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));
DROP POLICY IF EXISTS order_issue_photos_customer_delete_own ON storage.objects;
CREATE POLICY order_issue_photos_customer_delete_own ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING ((bucket_id = 'order-issue-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));
DROP POLICY IF EXISTS order_issue_photos_staff_select ON storage.objects;
CREATE POLICY order_issue_photos_staff_select ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING ((bucket_id = 'order-issue-photos'::text) AND (current_employee_role() = ANY (ARRAY['MANAGER'::text, 'STAFF'::text])));

-- ---------------------------------------------------------------------------
-- auth.users triggers.
-- ---------------------------------------------------------------------------

-- Keep customer/employee.password_last_updated in step.
DROP TRIGGER IF EXISTS on_auth_user_password_update ON auth.users;
CREATE TRIGGER on_auth_user_password_update
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_password_timestamp_update();

-- A customer who changes their email (lib/actions/profile.ts) gets the new
-- address copied into customer.email once they confirm it. Used to live in
-- the hand-run supabase/profile-rls-and-triggers.sql and was never applied
-- to the live project, so customer.email kept the old address.
CREATE OR REPLACE FUNCTION public.sync_customer_email_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.email IS DISTINCT FROM old.email
     OR (new.email_confirmed_at IS DISTINCT FROM old.email_confirmed_at AND new.email_confirmed_at IS NOT NULL) THEN
    UPDATE public.customer SET email = new.email
    WHERE customer_id = new.id AND email IS DISTINCT FROM new.email;
  END IF;
  RETURN new;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_customer_email_on_confirm() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_email_confirmed
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_customer_email_on_confirm();

-- ---------------------------------------------------------------------------
-- pg_cron. cron.schedule() replaces a job with the same name.
-- process-refunds calls the edge function with two Vault secrets that must
-- exist on the project: `project_url` and `refund_cron_secret`.
-- ---------------------------------------------------------------------------
SELECT cron.schedule('expire-abandoned-orders', '*/5 * * * *',
  $$SELECT public.expire_abandoned_orders(interval '30 minutes')$$);

SELECT cron.schedule('expire-unaccepted-orders', '*/5 * * * *',
  $$SELECT public.expire_unaccepted_orders(interval '20 minutes')$$);

SELECT cron.schedule('process-refunds', '*/5 * * * *', $$
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
$$);
