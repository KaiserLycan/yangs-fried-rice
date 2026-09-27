/**
 * Transactional email through Resend's HTTP API (free tier: 3,000 emails a
 * month, 100 a day). Called directly with `fetch` rather than through the
 * SDK — it is one POST, and a dependency for one POST is not worth carrying.
 *
 * Server-only: it reads `RESEND_API_KEY`. Configure in `.env.local`:
 *
 *   RESEND_API_KEY=re_…
 *   EMAIL_FROM="Yang's Fried Rice <orders@your-verified-domain>"
 *
 * Without a key this does nothing and says so, so local development and the
 * tests never send mail. Until a domain is verified in Resend, `EMAIL_FROM`
 * can be `onboarding@resend.dev`, which only delivers to the Resend account's
 * own address — enough to demo, not enough for customers.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 5000;

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Where "Reply" goes — the visitor, for a contact-form message. */
  replyTo?: string;
};

export type SendEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: "not_configured" | "failed"; detail?: string };

export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.log("Mock sending email (no RESEND_API_KEY or EMAIL_FROM configured):", {
      to: message.to,
      subject: message.subject,
    });
    return { sent: true, id: "mock-id" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { sent: false, reason: "failed", detail: `Resend answered ${response.status}` };
    }
    const body = (await response.json().catch(() => null)) as { id?: string } | null;
    return { sent: true, id: body?.id ?? null };
  } catch (error) {
    return {
      sent: false,
      reason: "failed",
      detail: error instanceof Error ? error.message : "unknown error",
    };
  }
}

/** For interpolating text a person typed (a cancel reason, a name) into HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
