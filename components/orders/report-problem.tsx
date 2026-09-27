"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { reportOrderIssue } from "@/lib/actions/order-issues";
import { compressImage } from "@/lib/image/compress";
import type { TrackedOrderIssue, TrackedOrderLine } from "@/lib/orders/read-tracked-order";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  ORDER_ISSUE_LABELS,
  ORDER_ISSUE_NOTE_MAX,
  ORDER_ISSUE_PHOTO_BUCKET,
  ORDER_ISSUE_TYPES,
  ORDER_ISSUE_WINDOW_HOURS,
  orderIssuePhotoProblem,
  type OrderIssueType,
} from "@/lib/validation/order-issue";

/** Long edge of the uploaded photo. Enough to see a wrong dish, well under 2 MB. */
const PHOTO_MAX_EDGE = 1280;

/**
 * "Report a problem" on a completed order (limitations #24): tick what was
 * missing, wrong or damaged, optionally add a photo and a note. Offered for
 * `ORDER_ISSUE_WINDOW_HOURS` after pickup — the parent decides whether to
 * render it; the server and the database check the window again.
 *
 * Once a report exists this shows its state instead of the button, so a
 * customer is never invited to file the same problem twice.
 */
export function ReportProblem({
  orderId,
  orderNumber,
  items,
  issue,
  canReport,
}: {
  orderId: string;
  orderNumber: string;
  items: TrackedOrderLine[];
  issue: TrackedOrderIssue | null;
  canReport: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  if (issue) {
    return (
      <p className="text-[14px] text-muted-strong" role="status">
        {issue.resolvedAt
          ? `Your report (${ORDER_ISSUE_LABELS[issue.issueType].toLowerCase()}) was resolved by the store.`
          : `You reported a problem (${ORDER_ISSUE_LABELS[issue.issueType].toLowerCase()}). The store will get back to you.`}
      </p>
    );
  }

  if (!canReport || items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] text-[14px] font-bold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        Report a problem
        <span className="sr-only"> with order #{orderNumber}</span>
      </button>
      <ReportProblemDialog
        open={open}
        onClose={() => setOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        items={items}
      />
    </>
  );
}

function ReportProblemDialog({
  open,
  onClose,
  orderId,
  orderNumber,
  items,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  items: TrackedOrderLine[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [issueType, setIssueType] = React.useState<OrderIssueType | null>(null);
  const [note, setNote] = React.useState("");
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setIssueType(null);
    setNote("");
    setPhoto(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [open]);

  const ready = selected.size > 0 && issueType !== null && !pending;

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function pickPhoto(file: File | undefined) {
    setError(null);
    if (!file) {
      setPhoto(null);
      return;
    }
    // Shrunk first, so a 6 MB phone photo still fits the 2 MB bucket limit.
    let candidate = file;
    try {
      candidate = await compressImage(file, PHOTO_MAX_EDGE);
    } catch {
      // Not decodable here (HEIC on some browsers): try the original.
    }
    const problem = orderIssuePhotoProblem(candidate);
    if (problem) {
      setError(problem);
      setPhoto(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setPhoto(candidate);
  }

  async function submit() {
    if (!issueType || selected.size === 0) return;
    setPending(true);
    setError(null);

    const supabase = createClient();
    let photoPath: string | null = null;

    try {
      if (photo) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Your session ended. Please sign in again.");
          return;
        }
        const extension = photo.type === "image/png" ? "png" : photo.type === "image/jpeg" ? "jpg" : "webp";
        photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(ORDER_ISSUE_PHOTO_BUCKET)
          .upload(photoPath, photo, { contentType: photo.type });
        if (uploadError) {
          setError("The photo couldn't be uploaded. Try again, or send the report without it.");
          return;
        }
      }

      const result = await reportOrderIssue({
        order_id: orderId,
        order_item_ids: Array.from(selected),
        issue_type: issueType,
        note,
        photo_path: photoPath,
      });

      if (result.error !== null) {
        // Don't leave an orphaned photo behind for a report that wasn't saved.
        if (photoPath) await supabase.storage.from(ORDER_ISSUE_PHOTO_BUCKET).remove([photoPath]);
        setError(result.error);
        return;
      }

      showToast("Thanks — we've sent your report to the store.", "success");
      onClose();
      router.refresh();
    } catch {
      if (photoPath) await supabase.storage.from(ORDER_ISSUE_PHOTO_BUCKET).remove([photoPath]);
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      placement="sheet"
      title="Report a problem"
      description={`Order #${orderNumber}. Tell us what went wrong within ${ORDER_ISSUE_WINDOW_HOURS} hours of pickup and the store will sort it out with you.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="confirm" onClick={() => void submit()} disabled={!ready}>
            {pending ? "Sending…" : "Send report"}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[55vh] flex-col gap-[16px] overflow-y-auto pr-1">
        {error ? <Alert>{error}</Alert> : null}

        <fieldset className="flex flex-col gap-[8px]">
          <legend className="mb-[6px] text-[14px] font-bold text-foreground">
            Which items? <span className="font-normal text-muted-strong">(tick all that apply)</span>
          </legend>
          {items.map((item) => (
            <label
              key={item.orderItemId}
              className="flex min-h-[44px] cursor-pointer items-center gap-[10px] rounded-[12px] border border-field-border bg-card px-[12px] py-[8px] text-[15px] text-foreground"
            >
              <Checkbox
                checked={selected.has(item.orderItemId)}
                onChange={() => toggle(item.orderItemId)}
              />
              <span>
                {item.quantity}× {item.name}
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-[8px]">
          <legend className="mb-[6px] text-[14px] font-bold text-foreground">What happened?</legend>
          <div className="flex flex-wrap gap-[8px]">
            {ORDER_ISSUE_TYPES.map((type) => (
              <label
                key={type}
                className={cn(
                  "flex min-h-[44px] cursor-pointer items-center rounded-pill border px-[16px] text-[15px] font-bold focus-within:ring-2 focus-within:ring-ring/40",
                  issueType === type
                    ? "border-accent bg-accent text-white"
                    : "border-field-border bg-card text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="issue-type"
                  value={type}
                  checked={issueType === type}
                  onChange={() => setIssueType(type)}
                  className="sr-only"
                />
                {ORDER_ISSUE_LABELS[type]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="report-problem-photo" className="text-[14px] font-bold text-foreground">
            Photo <span className="font-normal text-muted-strong">(optional)</span>
          </label>
          <input
            ref={fileRef}
            id="report-problem-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={(event) => void pickPhoto(event.target.files?.[0])}
            className="text-[14px] text-foreground file:mr-[10px] file:min-h-[44px] file:rounded-[10px] file:border file:border-field-border file:bg-card file:px-[14px] file:text-[14px] file:font-bold file:text-foreground"
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="report-problem-note" className="text-[14px] font-bold text-foreground">
            Anything else? <span className="font-normal text-muted-strong">(optional)</span>
          </label>
          <Textarea
            id="report-problem-note"
            value={note}
            maxLength={ORDER_ISSUE_NOTE_MAX}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="e.g. No egg on the Yangzhou Special"
          />
        </div>
      </div>
    </Dialog>
  );
}
