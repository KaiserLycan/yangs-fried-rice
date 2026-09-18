/**
 * Employee Profile Page (/manage/profile)
 * 
 * What's Added/Changed:
 * - Implemented the main layout matching the Figma design for the employee's personal profile view.
 * - Refactored into a composition of smaller interactive cards (`EmployeePersonalDetailsCard`, `EmployeeRoleDetailsCard`, etc.).
 * - Reused the existing `PasswordCard` from the customer profile since the password change flow is identical.
 * 
 * TODO (Backend Integration & Improvements):
 * - [ ] Fetch the live employee session data from Supabase Auth and employee table on page load.
 * - [ ] Replace the hardcoded `profile` mock object with actual state derived from the fetched data.
 * - [ ] Dynamically compute `isManager` based on the authenticated user's role to control access to the Employee Details card.
 */

import { EmployeePersonalDetailsCard } from "@/components/manage/profile/employee-personal-details-card";
import { EmployeeRoleDetailsCard } from "@/components/manage/profile/employee-role-details-card";
import { EmployeeContactDetailsCard } from "@/components/manage/profile/employee-contact-details-card";
import { EmployeeAvatarCard } from "@/components/manage/profile/employee-avatar-card";
import { PasswordCard } from "@/components/profile/password-card";
import { ToastProvider } from "@/components/ui/toast";
import { getMyEmployeeProfile } from "@/lib/actions/employee-profile";
import { isManager } from "@/lib/auth/roles";

export default async function ProfilePage() {
  const result = await getMyEmployeeProfile();

  if (!result.success) {
    return (
      <ToastProvider>
        <div className="flex h-full w-full items-center justify-center p-6">
          <div className="rounded-[16px] border border-[#DDCDB8] bg-[#FAF5EB] p-6 text-center text-[#1a1210]">
            <p className="font-display text-[24px] uppercase">Profile unavailable</p>
            <p className="mt-2 text-sm text-[#7A6A60]">{result.error}</p>
          </div>
        </div>
      </ToastProvider>
    );
  }

  const profile = {
    name: result.data.name,
    dateOfBirth: result.data.dateOfBirth ?? null,
    role: result.data.role,
    shift: result.data.scheduleShift ?? "Not set",
    mobile: result.data.phoneNumber ?? "",
    email: result.data.email,
  };

  const canManageEmployeeProfile = isManager(result.data.role);
  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "E";

  return (
    <ToastProvider>
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-4 mb-[16px] md:mb-[24px]">
          <h1 className="font-display text-[24px] md:text-[32px] leading-none tracking-[0.32px] text-[#1a1210]">
            MY PROFILE
          </h1>
          <p className="font-sans text-[13px] text-[#7a6a60] pb-[2px]">
            name, contact, addresses and password
          </p>
        </div>

        <div className="flex flex-col gap-[16px] md:gap-[20px] flex-1 overflow-y-auto min-h-0 pb-10">

          {/* Top Row: Avatar & Personal Details */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-[16px] md:gap-[18px]">
            <EmployeeAvatarCard initials={initials} avatarUrl={result.data.profileImageUrl} />
            <div className="min-w-0 w-full flex-1">
              <EmployeePersonalDetailsCard profile={profile} />
            </div>
          </div>

          <EmployeeRoleDetailsCard profile={profile} isManager={canManageEmployeeProfile} />

          <EmployeeContactDetailsCard profile={profile} />

          <PasswordCard />

        </div>
      </div>
    </ToastProvider>
  );
}