import * as React from "react";
import { DialogRoot } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  auditActionLabel,
  auditChangeRows,
  auditEntityLabel,
  auditFieldLabel,
  formatAuditValue,
} from "@/lib/audit/audit-actions";
import { roleDisplayLabel } from "@/lib/auth/roles";
import type { AuditLogEntry } from "@/lib/actions/audit";

/** "27 Sep 2026, 2:05 PM" in Manila time, whatever the viewer's clock says. */
export function formatAuditTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const SOURCE_LABELS: Record<string, string> = {
  database: "Recorded automatically by the database",
  app: "Recorded by the app",
};

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[6px] w-full">
      <span className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
        {label}
      </span>
      <div className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] w-full">
        <span className="text-[#1A1210] text-[15px] leading-normal break-words">{value}</span>
      </div>
    </div>
  );
}

interface AuditLogModalProps {
  entry: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * One audit entry in full: who, when, what, and every field it changed.
 * Read-only on purpose — there is nothing to edit or delete, because the log
 * itself refuses both (trg_audit_log_append_only).
 */
export function AuditLogModal({ entry, isOpen, onClose }: AuditLogModalProps) {
  if (!entry) return null;

  const changes = auditChangeRows(entry.changes);
  const actor = entry.actor_name
    ? `${entry.actor_name}${entry.actor_role ? ` · ${roleDisplayLabel(entry.actor_role)}` : ""}`
    : "Unknown employee";

  return (
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      className={cn(
        "m-auto max-w-[560px] w-[calc(100%-2rem)] md:w-full overflow-hidden rounded-[20px] border-0 shadow-[0_30px_70px_rgba(26,18,16,0.26)]",
      )}
    >
      <div className="flex flex-col w-full bg-[#FBF6EC] max-h-[90vh]">
        <div className="px-[26px] pt-[26px] pb-4 shrink-0">
          <span className="text-[11px] font-bold tracking-wide uppercase bg-[#f6e9d9] text-[#8c1c13] px-2 py-1 rounded-md">
            {auditActionLabel(entry.action)}
          </span>
          <h2 className="font-display text-[24px] leading-tight text-[#1A1210] mt-3 break-words">
            {entry.summary}
          </h2>
        </div>

        <div className="flex flex-col gap-[14px] px-[26px] pb-[26px] flex-1 overflow-y-auto">
          <div className="flex flex-col gap-[14px] md:flex-row">
            <DisplayField label="When" value={formatAuditTime(entry.occurred_at)} />
            <DisplayField label="Employee" value={actor} />
          </div>
          <div className="flex flex-col gap-[14px] md:flex-row">
            <DisplayField label="Action" value={auditActionLabel(entry.action)} />
            <DisplayField label="Record" value={auditEntityLabel(entry.entity_type)} />
          </div>
          {entry.entity_id && <DisplayField label="Record ID" value={entry.entity_id} />}
          <DisplayField label="Source" value={SOURCE_LABELS[entry.source] ?? entry.source} />

          <div className="flex flex-col gap-[6px] w-full">
            <span className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Changes
            </span>
            {changes.length === 0 ? (
              <div className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[#7A6A60] text-[14px]">
                No field changes recorded for this action.
              </div>
            ) : (
              <div className="bg-white border border-[#DDCDB8] rounded-[12px] overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr] px-[14px] py-[10px] bg-[#EAE0D5] text-[11px] font-bold text-[#7A6A60] uppercase tracking-[1px]">
                  <span>Field</span>
                  <span>Before</span>
                  <span>After</span>
                </div>
                {changes.map((change, index) => (
                  <div
                    key={change.field}
                    className={cn(
                      "grid grid-cols-[1fr_1fr_1fr] gap-2 px-[14px] py-[10px] text-[14px] text-[#1A1210]",
                      index !== changes.length - 1 && "border-b border-[#F0E6D8]",
                    )}
                  >
                    <span className="font-bold break-words">{auditFieldLabel(change.field)}</span>
                    <span className="text-[#7A6A60] break-words">{formatAuditValue(change.from)}</span>
                    <span className="break-words">{formatAuditValue(change.to)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-[10px] pt-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#DDCDB8] rounded-[13px] py-[10px] font-bold text-[#7A6A60] text-[14px] hover:bg-black/5 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </DialogRoot>
  );
}
