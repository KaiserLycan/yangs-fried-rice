"use client";

/**
 * Employee Role Details Card
 * 
 * What's Added/Changed:
 * - Built an Employee Details section showing Role and Scheduled Shift.
 * - Restricted the "Edit" capability strictly to Manager roles via the `isManager` prop.
 * - Replaced standard text inputs with custom dropdown menus for Role and Shift selections to match the Employee tab pattern.
 * - Managed hidden inputs so that `useCardEditor` can properly serialize the custom dropdown values to FormData.
 * 
 * TODO (Backend Integration & Improvements):
 * - [ ] Ensure `isManager` prop is securely derived from the authenticated session's user role on the server.
 * - [ ] Replace the hardcoded `ROLES` and `SHIFTS` arrays with dynamic data fetched from the backend schema.
 * - [ ] Implement actual mutation logic to save role/shift changes when a manager edits a profile.
 */

import { useState } from "react";
import { z } from "zod";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CardField,
  CardInput,
  CardValue,
  ProfileCard,
} from "@/components/profile/profile-card";
import { useCardEditor } from "@/components/profile/use-card-editor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const ROLES = ["Manager", "Server", "Cook", "Cashier", "Delivery"];
const SHIFTS = ["MWF – 12-3PM", "TThS – 9-5PM", "Weekends – 10-10PM", "Mon-Fri – 8-4PM"];

const SAVE_TOAST =
  "Updating employee role details isn’t available yet. We’re still building it.";

const roleDetailsSchema = z.object({
  role: z.string().min(1, "Role is required"),
  shift: z.string().min(1, "Shift is required"),
});

export function EmployeeRoleDetailsCard({
  profile,
  isManager = false,
}: {
  profile: { role: string; shift: string };
  isManager?: boolean;
}) {
  const showToast = useToast();
  
  const [roleOpen, setRoleOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [roleValue, setRoleValue] = useState(profile.role);
  const [shiftValue, setShiftValue] = useState(profile.shift);

  const { isEditing, edit, cancel, errors, handleSubmit } = useCardEditor({
    schema: roleDetailsSchema,
    read: (form) => ({
      role: String(form.get("role") ?? ""),
      shift: String(form.get("shift") ?? ""),
    }),
    onValid: () => showToast(SAVE_TOAST),
  });

  return (
    <ProfileCard
      title="Employee DETAILS"
      isEditing={isEditing}
      showEditButton={isManager}
      onEdit={isManager ? edit : () => {}}
      onCancel={cancel}
    >
      {/* If they are not a manager, they should not see the edit button. We can hide the button with CSS or just not show the edit state, but ProfileCard always renders an Edit button.
          To keep the Employee Details uneditable for non-managers, we will just render the view state without passing onEdit to ProfileCard if they aren't a manager. 
          Wait, `ProfileCard` takes `onEdit` and renders an Edit button unconditionally.
          We can wrap the returned JSX and conditionally render a custom view if not a manager.
          Let's just use the view mode if not a manager.
      */}
      {isEditing && isManager ? (
        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col gap-[12px] md:gap-[16px]"
        >
          <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
            <CardField label="Role" htmlFor="role" error={errors.role}>
              <input type="hidden" name="role" value={roleValue} />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleOpen(!roleOpen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm bg-card px-[12px] py-[13px] text-[15px] md:py-[11px] md:text-[14px]",
                    "border border-input transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring/40",
                    Boolean(errors.role) && "border-primary"
                  )}
                >
                  <span>{roleValue}</span>
                  {roleOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {roleOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-card border border-input rounded-[8px] p-1 shadow-lg max-h-[160px] overflow-y-auto">
                      {ROLES.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setRoleValue(r); setRoleOpen(false); }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-[14px] transition-colors",
                            roleValue === r ? "bg-accent/50 font-bold" : "hover:bg-background"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardField>

            <CardField label="Shift" htmlFor="shift" error={errors.shift}>
              <input type="hidden" name="shift" value={shiftValue} />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShiftOpen(!shiftOpen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm bg-card px-[12px] py-[13px] text-[15px] md:py-[11px] md:text-[14px]",
                    "border border-input transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring/40",
                    Boolean(errors.shift) && "border-primary"
                  )}
                >
                  <span>{shiftValue}</span>
                  {shiftOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {shiftOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShiftOpen(false)} />
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-card border border-input rounded-[8px] p-1 shadow-lg max-h-[160px] overflow-y-auto">
                      {SHIFTS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setShiftValue(s); setShiftOpen(false); }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-[14px] transition-colors",
                            shiftValue === s ? "bg-accent/50 font-bold" : "hover:bg-background"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardField>
          </div>

          <Button type="submit" variant="save" className="self-start">
            Save changes
          </Button>
        </form>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
          <CardField label="Role">
            <CardValue value={profile.role} emptyState="Not added yet" />
          </CardField>
          <CardField label="Shift">
            <CardValue value={profile.shift} emptyState="Not added yet" />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
