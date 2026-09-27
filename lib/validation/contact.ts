import { z } from "zod";
import { emailSchema, PERSON_NAME_PATTERN, requiredText } from "./fields";
import { optionalPhoneSchema } from "./phone";

/**
 * The landing page's "Send us a message" form. Shared by the form (live
 * hints, the disabled Submit button) and `sendContactMessage`, which parses
 * again because a server action can be called without the form.
 *
 * Nothing is stored: a valid message becomes one email to the store's inbox,
 * with the visitor's address as Reply-To.
 */

export const CONTACT_TOPICS = ["general", "bulk", "order", "feedback"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  general: "General question",
  bulk: "Bulk order / catering",
  order: "An existing order",
  feedback: "Feedback",
};

/**
 * The honeypot's field name. Hidden from people, left in for bots that fill
 * every input; a message with it filled is dropped without an error.
 */
export const CONTACT_HONEYPOT = "website";

export const contactSchema = z.object({
  name: requiredText("contactName", "Name", "Enter your name.").pipe(
    z
      .string()
      .regex(
        PERSON_NAME_PATTERN,
        "Name can only contain letters, spaces, hyphens, apostrophes and periods.",
      ),
  ),
  email: emailSchema,
  phone: z.string().trim().pipe(optionalPhoneSchema),
  topic: z.enum(CONTACT_TOPICS, {
    errorMap: () => ({ message: "Choose what your message is about." }),
  }),
  subject: requiredText("contactSubject", "Subject", "Enter a subject."),
  message: requiredText("contactMessage", "Message", "Enter your message."),
});

export type ContactValues = z.infer<typeof contactSchema>;
export type ContactInput = z.input<typeof contactSchema>;
