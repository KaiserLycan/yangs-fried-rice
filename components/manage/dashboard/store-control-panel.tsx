"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useNow } from "@/lib/hooks/use-now";
import { formatStoreHours, type StoreStatus } from "@/lib/store/store-status";
import { closesAfterOpening } from "@/lib/store-hours";
import {
  CLOSE_BEFORE_OPEN_MESSAGE,
  MAX_PAUSE_MINUTES,
  PAUSE_PRESETS,
} from "@/lib/validation/store-setting";
import {
  pauseStore,
  resumeStore,
  updateStoreSettings,
} from "@/lib/actions/store-setting";
import type { OrderStatusCounts } from "@/lib/orders/status-counts";

/**
 * The manager's switches over `store_setting` (issue #115): pause ordering
 * (for a preset time, a custom time, or until resumed), see where every
 * order stands, and edit opening hours, extra prep time, the busy limit and
 * "Force open".
 *
 * Pause and Resume act at once — they are what a manager reaches for in a
 * rush. The settings below are read-only until Edit is pressed, so a stray
 * click can't change the hours; Save is only live while editing, and only
 * when the form is valid. A close time that is not after the open time is
 * flagged the moment it is picked, not after pressing Save.
 *
 * A timed pause ends by itself — `get_store_status()` stops counting it once
 * `paused_until` passes — so the countdown only has to refresh the page when
 * it reaches zero.
 */

type SettingsForm = {
  open_time: string;
  close_time: string;
  extra_prep_minutes: number;
  max_active_orders: number;
  is_force_open: boolean;
};

/**
 * `<input type="time">` stops at 23:59, but the database allows a close of
 * 24:00 (end of day, carried over from the old whole-hour setting). Shown as
 * 23:59 so the field is never blank.
 */
function toInputTime(value: string): string {
  return value === "24:00" ? "23:59" : value;
}

function formFrom(status: StoreStatus): SettingsForm {
  return {
    open_time: toInputTime(status.openTime),
    close_time: toInputTime(status.closeTime),
    extra_prep_minutes: status.extraPrepMinutes,
    max_active_orders: status.maxActiveOrders,
    is_force_open: status.isForceOpen,
  };
}

export function StoreControlPanel({
  status,
  counts,
}: {
  status: StoreStatus;
  counts: OrderStatusCounts;
}) {
  const router = useRouter();
  const now = useNow(1000);
  const [isPending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<{ tone: "error" | "ok"; text: string } | null>(
    null,
  );
  const [customMinutes, setCustomMinutes] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<SettingsForm>(() => formFrom(status));

  // Keep the form in step with saved values — but never while the manager
  // is mid-edit, or a refresh would throw their changes away.
  const savedKey = `${status.openTime}|${status.closeTime}|${status.extraPrepMinutes}|${status.maxActiveOrders}|${status.isForceOpen}`;
  React.useEffect(() => {
    if (!editing) setForm(formFrom(status));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey, editing]);

  const hoursValid = closesAfterOpening({
    openTime: form.open_time,
    closeTime: form.close_time,
  });
  const numbersValid =
    Number.isInteger(form.extra_prep_minutes) &&
    form.extra_prep_minutes >= 0 &&
    form.extra_prep_minutes <= 120 &&
    Number.isInteger(form.max_active_orders) &&
    form.max_active_orders >= 1 &&
    form.max_active_orders <= 500;
  const canSave = editing && hoursValid && numbersValid && !isPending;

  const msLeft = status.pausedUntil
    ? new Date(status.pausedUntil).getTime() - now.getTime()
    : null;
  const pauseExpired = msLeft !== null && msLeft <= 0;
  const isPaused = status.isPaused && !pauseExpired;

  // When a timed pause runs out, re-read the status once.
  const refreshedForExpiry = React.useRef(false);
  React.useEffect(() => {
    if (pauseExpired && !refreshedForExpiry.current) {
      refreshedForExpiry.current = true;
      router.refresh();
    }
    if (!pauseExpired) refreshedForExpiry.current = false;
  }, [pauseExpired, router]);

  const run = (
    action: () => Promise<{ error: string | null }>,
    done: string,
    after?: () => void,
  ) => {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      after?.();
      setMessage({ tone: "ok", text: done });
      router.refresh();
    });
  };

  const pauseFor = (minutes: number | null) =>
    run(
      () => pauseStore(minutes),
      minutes === null ? "Store paused until you resume." : `Store paused for ${minutes} min.`,
    );

  const onCustomPause = () => {
    const minutes = Number(customMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_PAUSE_MINUTES) {
      setMessage({
        tone: "error",
        text: `Enter a whole number of minutes from 1 to ${MAX_PAUSE_MINUTES}.`,
      });
      return;
    }
    pauseFor(minutes);
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    run(() => updateStoreSettings(form), "Store settings saved.", () => setEditing(false));
  };

  const onCancelEdit = () => {
    setForm(formFrom(status));
    setEditing(false);
    setMessage(null);
  };

  const activeOrders = counts.queue + counts.prep;
  const stateLabel = isPaused
    ? "Paused"
    : status.isBusy
      ? "Busy"
      : status.isOpen
        ? "Open"
        : "Closed";
  const stateTone =
    isPaused || status.isBusy || !status.isOpen ? "text-[#8c1c13]" : "text-[#2f5e3c]";

  return (
    <section
      aria-labelledby="store-control"
      className="flex flex-col gap-4 rounded-[14px] border border-[#e3d6c3] bg-white p-4"
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <h2 id="store-control" className="font-display text-[20px] leading-normal text-[#1a1210]">
          Store status: <span className={stateTone}>{stateLabel}</span>
        </h2>
        <span className="text-[12px] text-[#7a6a60]">
          Hours {formatStoreHours(status)}
          {status.isForceOpen ? " · Forced open" : ""}
        </span>
      </div>

      {/* Where every order stands. Queue + Prep is the "active" figure the
          busy limit is compared against. */}
      <div className="flex flex-col gap-2">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <CountTile label="Queue" value={counts.queue} />
          <CountTile label="Prep" value={counts.prep} />
          <CountTile label="For pickup" value={counts.pickup} />
          <CountTile label="Completed today" value={counts.completedToday} />
          <CountTile label="Cancelled today" value={counts.cancelledToday} />
        </dl>
        <p className="text-[12px] text-[#7a6a60]">
          Active orders (queue + prep):{" "}
          <strong className={status.isBusy ? "text-[#8c1c13]" : "text-[#1a1210]"}>
            {activeOrders} / {status.maxActiveOrders}
          </strong>{" "}
          busy limit. At the limit, new checkouts are refused with “We’re very busy right now”
          until an order moves on.
        </p>
      </div>

      {status.isBusy && !isPaused ? (
        <p className="text-[12px] font-bold text-[#8c1c13]">
          Auto-paused: active orders reached the busy limit.
        </p>
      ) : null}

      {/* Pause / resume — always one click. */}
      <div className="flex flex-col gap-2">
        {isPaused ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] font-bold text-[#8c1c13]">
              {msLeft !== null
                ? `Paused — reopens in ${formatCountdown(msLeft)}`
                : "Paused until you resume"}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(resumeStore, "Store resumed.")}
              className="rounded-[10px] bg-[#2f5e3c] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
            >
              Resume Store
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-bold text-[#1a1210]">Pause Store:</span>
            {PAUSE_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={isPending}
                onClick={() => pauseFor(m)}
                className="rounded-[10px] border border-[#b8352a] px-3 py-1.5 text-[13px] font-bold text-[#b8352a] disabled:opacity-60"
              >
                {m} min
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={MAX_PAUSE_MINUTES}
              inputMode="numeric"
              placeholder="Custom"
              aria-label="Custom pause length in minutes"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-[90px] rounded-[10px] border border-[#e3d6c3] px-2 py-1.5 text-[13px]"
            />
            <button
              type="button"
              disabled={isPending || customMinutes === ""}
              onClick={onCustomPause}
              className="rounded-[10px] border border-[#b8352a] px-3 py-1.5 text-[13px] font-bold text-[#b8352a] disabled:opacity-60"
            >
              Pause
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => pauseFor(null)}
              className="rounded-[10px] bg-[#b8352a] px-3 py-1.5 text-[13px] font-bold text-white disabled:opacity-60"
            >
              Until I resume
            </button>
          </div>
        )}
      </div>

      {/* Settings — read-only until Edit. */}
      <form
        onSubmit={onSave}
        className="flex flex-col gap-3 border-t border-[#e3d6c3] pt-3"
        aria-label="Store settings"
      >
        <fieldset disabled={!editing} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TimeField
            label="Opens at"
            value={form.open_time}
            onChange={(v) => setForm((f) => ({ ...f, open_time: v }))}
          />
          <TimeField
            label="Closes at"
            value={form.close_time}
            // The picker itself offers nothing before the opening time; the
            // message below covers typing one in anyway.
            min={form.open_time || undefined}
            invalid={editing && !hoursValid}
            describedBy={editing && !hoursValid ? "close-time-error" : undefined}
            onChange={(v) => setForm((f) => ({ ...f, close_time: v }))}
          />
          <NumberField
            label="Extra prep (min)"
            value={form.extra_prep_minutes}
            min={0}
            max={120}
            onChange={(v) => setForm((f) => ({ ...f, extra_prep_minutes: v }))}
          />
          <NumberField
            label="Busy limit (queue + prep)"
            value={form.max_active_orders}
            min={1}
            max={500}
            onChange={(v) => setForm((f) => ({ ...f, max_active_orders: v }))}
          />
          <label className="col-span-2 flex items-center gap-2 text-[13px] text-[#1a1210] md:col-span-4">
            <input
              type="checkbox"
              checked={form.is_force_open}
              onChange={(e) => setForm((f) => ({ ...f, is_force_open: e.target.checked }))}
            />
            Force open (ignore opening hours — for demos or special days)
          </label>
        </fieldset>

        {editing && !hoursValid ? (
          <p id="close-time-error" role="alert" className="text-[12px] font-bold text-[#8c1c13]">
            {CLOSE_BEFORE_OPEN_MESSAGE}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={editing || isPending}
            onClick={() => {
              setMessage(null);
              setEditing(true);
            }}
            className="rounded-[10px] border border-[#1a1210] px-4 py-2 text-[13px] font-bold text-[#1a1210] disabled:cursor-not-allowed disabled:border-[#c9c1b8] disabled:text-[#a39a90]"
          >
            Edit
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-[10px] bg-[#1a1210] px-4 py-2 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#c9c1b8]"
          >
            Save settings
          </button>
          {editing ? (
            <button
              type="button"
              disabled={isPending}
              onClick={onCancelEdit}
              className="px-2 py-2 text-[13px] font-bold text-[#7a6a60] underline disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
          {message ? (
            <span
              role={message.tone === "error" ? "alert" : "status"}
              className={`text-[12px] font-bold ${
                message.tone === "error" ? "text-[#8c1c13]" : "text-[#2f5e3c]"
              }`}
            >
              {message.text}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col rounded-[10px] bg-[#faf7f0] px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-[1px] text-[#7a6a60]">{label}</dt>
      <dd className="font-display text-[22px] leading-tight text-[#1a1210]">{value}</dd>
    </div>
  );
}

const FIELD_LABEL =
  "flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[1.1px] text-[#7a6a60]";
const FIELD_INPUT =
  "rounded-[10px] border px-2 py-1.5 text-[13px] font-normal normal-case tracking-normal text-[#1a1210] disabled:cursor-not-allowed disabled:bg-[#f3efe8] disabled:text-[#7a6a60]";

/**
 * A native time picker: the manager can type "06:30" or use the browser's
 * spinner / scroll list to pick it. `step={60}` keeps it to whole minutes.
 */
function TimeField({
  label,
  value,
  min,
  invalid = false,
  describedBy,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={FIELD_LABEL}>
      {label}
      <input
        type="time"
        step={60}
        value={value}
        min={min}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD_INPUT} ${invalid ? "border-[#8c1c13]" : "border-[#e3d6c3]"}`}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={FIELD_LABEL}>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${FIELD_INPUT} border-[#e3d6c3]`}
      />
    </label>
  );
}

/** 754_000 ms → "12:34". Hours are folded into minutes ("75:00"). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
