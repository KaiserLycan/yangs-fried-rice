"use client";

import { useEffect, useState } from "react";
import { getCashRemittedDaily, type CashRemittedDay } from "@/lib/actions/reports";

interface CashRemittedTableProps {
  startDate: string;
  endDate: string;
}

function formatPeso(amount: number): string {
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Cash taken at the counter per day (completed pay-in-store orders, Manila
 * days) — what the till should have held at close, day by day.
 */
export function CashRemittedTable({ startDate, endDate }: CashRemittedTableProps) {
  const [days, setDays] = useState<CashRemittedDay[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getCashRemittedDaily({ start_date: startDate, end_date: endDate })
      .then((result) => {
        if (cancelled) return;
        if (result.error || !result.data) {
          setError(result.error ?? "Couldn't load cash remitted.");
        } else {
          setDays(result.data.days);
          setTotal(result.data.total);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load cash remitted.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  const orderCount = days.reduce((sum, row) => sum + row.totalOrders, 0);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#e3d6c3] bg-white p-[18px]">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[15px] font-bold text-[#1a1210]">Cash remitted</h3>
        <p className="text-[12px] text-[#7a6a60]">
          Cash collected at the counter each day, from completed pay-in-store orders.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded-lg bg-[#efe6d8] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg bg-[#f6e9d9] p-3 text-[13px] text-[#b8352a]">{error}</p>
      ) : days.length === 0 ? (
        <p className="rounded-lg bg-[#faf7f0] p-4 text-center text-[13px] text-[#7a6a60]">
          No cash was collected at the counter in this period.
        </p>
      ) : (
        <div className="max-h-[360px] overflow-auto rounded-lg border border-[#efe6d8]">
          <table className="w-full min-w-[360px] text-[13px]">
            <thead className="sticky top-0 bg-[#eae0d5] text-[11px] font-bold uppercase tracking-[1px] text-[#7a6a60]">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">Date</th>
                <th scope="col" className="px-3 py-2 text-right">Orders</th>
                <th scope="col" className="px-3 py-2 text-right">Cash</th>
              </tr>
            </thead>
            <tbody>
              {days.map((row) => (
                <tr key={row.day} className="border-t border-[#efe6d8]">
                  <td className="px-3 py-2 text-[#1a1210]">{formatDay(row.day)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#1a1210]">{row.totalOrders}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1a1210]">
                    {formatPeso(row.cashTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-[#faf7f0] font-bold text-[#1a1210]">
              <tr className="border-t-2 border-[#ddcdb8]">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right tabular-nums">{orderCount}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[#2f7a45]">{formatPeso(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
