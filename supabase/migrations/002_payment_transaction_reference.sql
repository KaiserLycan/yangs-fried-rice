-- ============================================================
-- Migration: Payment transaction reference (US-04)
--
-- Additive only — adds a nullable column, no existing data or
-- policies touched. Needed so payment-webhook can reliably match an
-- incoming PayMongo event back to the transaction it belongs to,
-- and so a retried webhook delivery can be detected as a duplicate
-- rather than double-processed.
-- ============================================================

ALTER TABLE transaction
  ADD COLUMN IF NOT EXISTS provider_reference_id text;

CREATE INDEX IF NOT EXISTS idx_transaction_provider_reference
  ON transaction (provider_reference_id);