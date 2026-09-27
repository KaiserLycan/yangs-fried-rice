"use server";

import { headers } from "next/headers";
import { clientIpFrom } from "@/lib/auth/login-rate-limit";
import {
  checkContactAllowed,
  contactLimitMessage,
  recordContactSent,
} from "@/lib/contact/contact-rate-limit";
import { escapeHtml, sendEmail } from "@/lib/email/send-email";
import { SITE_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site/site-info";
import {
  CONTACT_TOPIC_LABELS,
  contactSchema,
  type ContactInput,
} from "@/lib/validation/contact";
import { fieldErrorsFromIssues, type FieldErrors } from "@/lib/validation/field-errors";
import { formatMobileNumber } from "@/lib/validation/phone";

type ContactResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: FieldErrors };

const SEND_FAILED = SUPPORT_PHONE
  ? `We couldn't send your message just now. Please try again, or call us at ${SUPPORT_PHONE}.`
  : "We couldn't send your message just now. Please try again in a few minutes.";

/**
 * The landing page's contact form: one email to SUPPORT_EMAIL, with the
 * visitor's address as Reply-To so the store answers from its own inbox.
 *
 * `honeypot` is the hidden field only a bot fills. Such a message is
 * reported as sent — telling a bot it was caught only teaches it to adapt.
 */
export async function sendContactMessage(
  values: ContactInput,
  honeypot = "",
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }
  if (honeypot.trim()) return { success: true };

  if (!SUPPORT_EMAIL) {
    return { success: false, error: SEND_FAILED };
  }

  const ip = clientIpFrom(headers().get("x-forwarded-for"));
  const gate = checkContactAllowed(ip);
  if (!gate.allowed) {
    return { success: false, error: contactLimitMessage(gate) };
  }

  const { name, email, phone, topic, subject, message } = parsed.data;
  const topicLabel = CONTACT_TOPIC_LABELS[topic];
  const phoneShown = phone ? formatMobileNumber(phone) : "—";

  const text = [
    `New message from the ${SITE_NAME} website`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Mobile: ${phoneShown}`,
    `Topic: ${topicLabel}`,
    `Subject: ${subject}`,
    "",
    message,
  ].join("\n");

  const html = `
    <p>New message from the ${escapeHtml(SITE_NAME)} website</p>
    <table cellpadding="4">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td><strong>Mobile</strong></td><td>${escapeHtml(phoneShown)}</td></tr>
      <tr><td><strong>Topic</strong></td><td>${escapeHtml(topicLabel)}</td></tr>
      <tr><td><strong>Subject</strong></td><td>${escapeHtml(subject)}</td></tr>
    </table>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  // Newlines are stripped from the subject line; it goes into a mail header.
  const result = await sendEmail({
    to: SUPPORT_EMAIL,
    subject: `[${topicLabel}] ${subject}`.replace(/[\r\n]+/g, " "),
    html,
    text,
    replyTo: email,
  });

  if (!result.sent) {
    console.error("sendContactMessage:", result.reason, result.detail);
    return { success: false, error: SEND_FAILED };
  }

  recordContactSent(ip);
  return { success: true };
}
