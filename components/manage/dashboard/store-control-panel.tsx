"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useNow } from "@/lib/hooks/use-now";
import { formatStoreHours, type StoreStatus } from "@/lib/store/store-status";
import { formatHour } from "@/lib/store-hours";
import { PAUSE_PRESETS, MAX_PAUSE_MINUTES } from "@/lib/validation/store-setting";
import {
  pauseStore,
  resumeStore,
  updateStoreSettings,
} from "@/lib/actions/store-setting";

/**
 * The manager's switches over `store_setting` (issue #115): pause ordering
 * (for a preset time, a custom time, or until resumed), see the busy limit,
 * and edit opening hours, extra prep time, the busy limit and "Force open".
 *
 * A timed pause ends by itself — `get_store_status()` stops counting it once
 * `paused_until` passes — so the countdown here only has to refresh the page
 * when it reaches zero; nothing needs to write "resumed".
 */
export function StoreControlPanel({ status }: { status: StoreStatus }) {
  const router = useRouter();
  const now = useNow(1000);
  const [isPending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<{ tone: "error" | "ok"; text: string } | null>(
    null,
  );
  const [customMinutes, setCustomMinutes] = React.useState("");

  const [form, setForm] = React.useState({
    open_hour: status.openHour,
    close_hour: status.closeHour,
    extra_prep_minutes: status.extraPrepMinutes,
    max_active_orders: status.maxActiveOrders,
    is_force_open: status.isForceOpen,
  });

  // Keep the form in step when the page refreshes with saved values.
  React.useEffect(() => {
    setForm({
      open_hour: status.openHour,
      close_hour: status.closeHour,
      extra_prep_minutes: status.extraPrepMinutes,
      max_active_orders: status.maxActiveOrders,
      is_force_open: status.isForceOpen,
    });
  }, [
    status.openHour,
    status.closeHour,
    status.extraPrepMinutes,
    status.maxActiveOrders,
    status.isForceOpen,
  ]);

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

  const run = (action: () => Promise<{ error: string | null }>, done: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
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
    run(() => updateStoreSettings(form), "Store settings saved.");
  };

  const stateLabel = isPaused
    ? "Paused"
    : status.isBusy
      ? "Busy"
      : status.isOpen
        ? "Open"
        : "Closed";
  const stateTone = isPaused || status.isBusy || !status.isOpen ? "text-[#8c1c13]" : "text-[#2f5e3c]";

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
          {status.isForceOpen ? " · Forced open" : ""} · Active orders{" "}
          <strong className={status.isBusy ? "text-[#8c1c13]" : "text-[#1a1210]"}>
            {status.activeOrders} / {status.maxActiveOrders}
          </strong>
        </span>
      </div>

      {status.isBusy && !isPaused ? (
        <p className="text-[12px] font-bold text-[#8c1c13]">
          Auto-paused: active orders reached the limit. Customers see “We’re very busy right
          now” until the queue drops.
        </p>
      ) : null}

      {/* Pause / resume */}
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

      {/* Settings */}
      <form onSubmit={onSave} className="flex flex-col gap-3 border-t border-[#e3d6c3] pt-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <HourSelect
            label="Opens at"
            value={form.open_hour}
            hours={range(0, 23)}
            onChange={(v) => setForm((f) => ({ ...f, open_hour: v }))}
          />
          <HourSelect
            label="Closes at"
            value={form.close_hour}
            hours={range(1, 24)}
            onChange={(v) => setForm((f) => ({ ...f, close_hour: v }))}
          />
          <NumberField
            label="Extra prep (min)"
            value={form.extra_prep_minutes}
            min={0}
            max={120}
            onChange={(v) => setForm((f) => ({ ...f, extra_prep_minutes: v }))}
          />
          <NumberField
            label="Busy limit (orders)"
            value={form.max_active_orders}
            min={1}
            max={500}
            onChange={(v) => setForm((f) => ({ ...f, max_active_orders: v }))}
          />
        </div>

        <label className="flex items-center gap-2 text-[13px] text-[#1a1210]">
          <input
            type="checkbox"
            checked={form.is_force_open}
            onChange={(e) => setForm((f) => ({ ...f, is_force_open: e.target.checked }))}
          />
          Force open (ignore opening hours — for demos or special days)
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[10px] bg-[#1a1210] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
          >
            Save settings
          </button>
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

function HourSelect({
  label,
  value,
  hours,
  onChange,
}: {
  label: string;
  value: number;
  hours: number[];
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[1.1px] text-[#7a6a60]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-[10px] border border-[#e3d6c3] px-2 py-1.5 text-[13px] font-normal normal-case tracking-normal text-[#1a1210]"
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {h === 24 ? "12:00 AM (midnight)" : formatHour(h)}
          </option>
        ))}
      </select>
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
    <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[1.1px] text-[#7a6a60]">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-[10px] border border-[#e3d6c3] px-2 py-1.5 text-[13px] font-normal normal-case tracking-normal text-[#1a1210]"
      />
    </label>
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** 754_000 ms → "12:34". Hours are folded into minutes ("75:00"). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
