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
import { Button } from "@/components/ui/button";

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
      <span className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
        {label}
      </span>
      <div className="bg-white border border-field-border rounded-md p-[14px] w-full">
        <span className="text-foreground text-base leading-normal break-words">{value}</span>
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
        "m-auto max-w-[560px] w-[calc(100%-2rem)] md:w-full overflow-hidden rounded-lg border-0 shadow-[0_30px_70px_rgba(26,18,16,0.26)]",
      )}
    >
      <div className="flex flex-col w-full bg-background max-h-[90vh]">
        <div className="px-[26px] pt-[26px] pb-4 shrink-0">
          <span className="text-xs font-bold tracking-wide uppercase bg-highlight text-primary px-2 py-1 rounded-md">
            {auditActionLabel(entry.action)}
          </span>
          <h2 className="font-display text-2xl leading-tight text-foreground mt-3 break-words">
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
            <span className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
              Changes
            </span>
            {changes.length === 0 ? (
              <div className="bg-white border border-field-border rounded-md p-[14px] text-muted-foreground text-sm">
                No field changes recorded for this action.
              </div>
            ) : (
              <div className="bg-white border border-field-border rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr] px-[14px] py-[10px] bg-track text-xs font-bold text-muted-foreground uppercase tracking-[1px]">
                  <span>Field</span>
                  <span>Before</span>
                  <span>After</span>
                </div>
                {changes.map((change, index) => (
                  <div
                    key={change.field}
                    className={cn(
                      "grid grid-cols-[1fr_1fr_1fr] gap-2 px-[14px] py-[10px] text-sm text-foreground",
                      index !== changes.length - 1 && "border-b border-track",
                    )}
                  >
                    <span className="font-bold break-words">{auditFieldLabel(change.field)}</span>
                    <span className="text-muted-foreground break-words">{formatAuditValue(change.from)}</span>
                    <span className="break-words">{formatAuditValue(change.to)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-[10px] pt-3 shrink-0">
            <Button variant="unstyled"
              type="button"
              onClick={onClose}
              className="flex-1 border border-field-border rounded-md py-[10px] font-bold text-muted-foreground text-sm hover:bg-black/5 transition-colors"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </DialogRoot>
  );
}
