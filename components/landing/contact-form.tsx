"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/actions/contact";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import { cn } from "@/lib/utils";
import {
  CONTACT_HONEYPOT,
  CONTACT_TOPIC_LABELS,
  CONTACT_TOPICS,
  contactSchema,
} from "@/lib/validation/contact";
import { FIELD_LIMITS, lengthProps } from "@/lib/validation/fields";

const ID_PREFIX = "contact-";

/**
 * "Send us a message" on the landing page. The same live validation, length
 * limits and disabled-until-valid Submit button as every other form; the
 * server action checks it all again and emails the store.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [messageLength, setMessageLength] = useState(0);
  const [isPending, startTransition] = useTransition();

  const live = useLiveValidation({
    schema: contactSchema,
    read: (data) => ({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      topic: String(data.get("topic") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    }),
  });
  const { errors } = live;
  useSubmitShortcut(live.formRef);

  const handleSubmit = live.handleSubmit(async (values) => {
    setServerError(null);
    const honeypot = String(
      new FormData(live.formRef.current ?? undefined).get(CONTACT_HONEYPOT) ?? "",
    );
    startTransition(async () => {
      const outcome = await sendContactMessage(values, honeypot);
      if (outcome.success) {
        live.formRef.current?.reset();
        live.reset();
        setMessageLength(0);
        setSent(true);
      } else {
        setServerError(outcome.error);
        live.setServerErrors(outcome.fieldErrors);
      }
    });
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-rule bg-card p-5 shadow-sm md:p-7">
        <h3 className="font-display text-2xl uppercase text-foreground">Message sent</h3>
        <Alert tone="success" role="status">
          Thanks for reaching out — we&apos;ll reply to the email you gave us.
        </Alert>
        <Button
          type="button"
          variant="unstyled"
          onClick={() => setSent(false)}
          className="self-start text-sm font-bold text-primary hover:underline"
        >
          Send another message
        </Button>
      </div>
    );
  }

  const messageMax = FIELD_LIMITS.contactMessage.max;

  return (
    <form
      {...live.formProps}
      onSubmit={handleSubmit}
      aria-labelledby="contact-form-heading"
      className="flex flex-col gap-4 rounded-lg border border-rule bg-card p-5 shadow-sm md:p-7"
    >
      <div className="flex flex-col gap-1">
        <h3 id="contact-form-heading" className="font-display text-2xl uppercase text-foreground">
          Send us a message
        </h3>
        <p className="text-sm text-muted-foreground">
          Questions, feedback or a bulk order enquiry — we&apos;ll reply by email.
        </p>
      </div>

      {serverError ? <Alert>{serverError}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" htmlFor={`${ID_PREFIX}name`} error={errors.name}>
          <Input
            id={`${ID_PREFIX}name`}
            name="name"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            required
            {...lengthProps("contactName")}
            invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${ID_PREFIX}name-error` : undefined}
          />
        </Field>
        <Field label="Email" htmlFor={`${ID_PREFIX}email`} error={errors.email}>
          <Input
            id={`${ID_PREFIX}email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            {...lengthProps("email")}
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${ID_PREFIX}email-error` : undefined}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Mobile (optional)" htmlFor={`${ID_PREFIX}phone`} error={errors.phone}>
          <PhoneInput
            id={`${ID_PREFIX}phone`}
            name="phone"
            invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${ID_PREFIX}phone-error` : undefined}
            className={cn(
              "rounded-md border bg-white focus-within:ring-2 focus-within:ring-ring/40",
              errors.phone ? "border-error-border" : "border-field-border",
            )}
            prefixClassName="pl-[14px] text-base text-muted-foreground"
            inputClassName="px-[6px] py-[13px] text-base text-foreground placeholder:text-placeholder md:py-[14px]"
          />
        </Field>
        <Field label="Topic" htmlFor={`${ID_PREFIX}topic`} error={errors.topic}>
          <select
            id={`${ID_PREFIX}topic`}
            name="topic"
            required
            defaultValue="general"
            aria-invalid={Boolean(errors.topic) || undefined}
            className={cn(
              "w-full rounded-md border bg-white px-[14px] py-[13px] text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:p-[14px]",
              errors.topic ? "border-error-border" : "border-field-border",
            )}
          >
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {CONTACT_TOPIC_LABELS[topic]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Subject" htmlFor={`${ID_PREFIX}subject`} error={errors.subject}>
        <Input
          id={`${ID_PREFIX}subject`}
          name="subject"
          placeholder="What is this about?"
          required
          {...lengthProps("contactSubject")}
          invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? `${ID_PREFIX}subject-error` : undefined}
        />
      </Field>

      <Field label="Message" htmlFor={`${ID_PREFIX}message`} error={errors.message}>
        <Textarea
          id={`${ID_PREFIX}message`}
          name="message"
          rows={5}
          placeholder="Tell us how we can help."
          required
          {...lengthProps("contactMessage")}
          invalid={Boolean(errors.message)}
          aria-describedby={`${ID_PREFIX}message-count${errors.message ? ` ${ID_PREFIX}message-error` : ""}`}
          onInput={(event) => setMessageLength(event.currentTarget.value.length)}
        />
        <p
          id={`${ID_PREFIX}message-count`}
          className={cn(
            "self-end text-sm",
            messageLength > messageMax ? "text-primary" : "text-muted-foreground",
          )}
        >
          {messageLength}/{messageMax}
        </p>
      </Field>

      {/* Honeypot: off-screen and out of the tab order, so only bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${ID_PREFIX}${CONTACT_HONEYPOT}`}>Leave this empty</label>
        <input
          id={`${ID_PREFIX}${CONTACT_HONEYPOT}`}
          name={CONTACT_HONEYPOT}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <SubmitButton
        pending={isPending}
        invalid={!live.isValid}
        pendingLabel="Sending…"
        hint="Email your message to the store"
        wrapperClassName="w-full md:w-auto md:self-start"
      >
        Send message
      </SubmitButton>
    </form>
  );
}
