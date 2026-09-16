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

export default function ProfilePage() {
  // Mock data representing the current logged-in user
  const profile = {
    name: "Liza Reyes",
    dateOfBirth: "1996-06-14", // ISO string required by native date input
    role: "Server",
    shift: "MWF – 12-3PM",
    mobile: "0917 402 8851",
    email: "liza.reyes@gmial.com",
  };

  // Mock manager status to demonstrate conditional editing
  const isManager = true; // Set to true to test the manager role

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
            <EmployeeAvatarCard initials="LR" />
            <div className="min-w-0 w-full flex-1">
              <EmployeePersonalDetailsCard profile={profile} />
            </div>
          </div>

          <EmployeeRoleDetailsCard profile={profile} isManager={isManager} />

          <EmployeeContactDetailsCard profile={profile} />

          <PasswordCard />

        </div>
      </div>
    </ToastProvider>
  );
}