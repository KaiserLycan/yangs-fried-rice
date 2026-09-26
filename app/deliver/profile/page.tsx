export const revalidate = 0;

import { ToastProvider } from "@/components/ui/toast";
import { EmployeePersonalDetailsCard } from "@/components/manage/profile/employee-personal-details-card";
import { EmployeeContactDetailsCard } from "@/components/manage/profile/employee-contact-details-card";
import { PasswordCard } from "@/components/profile/password-card";
import {
  EmployeeDetailsCard,
  DriverDetailsCard,
} from "@/components/profile/rider-details-cards";
import { getMyEmployeeProfile } from "@/lib/actions/employee-profile";

export default async function RiderProfilePage() {
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
    firstName: result.data.firstName,
    lastName: result.data.lastName,
    name: result.data.name,
    dateOfBirth: result.data.dateOfBirth ?? null,
    mobile: result.data.phoneNumber ?? "",
    email: result.data.email,
  };

  const employeeData = {
    role: result.data.role === "RIDER" ? "Delivery" : result.data.role,
    shift: result.data.scheduleShift ?? "Not set",
  };

  const driverData = {
    vehicleMakeModel: result.data.rider?.vehicleMakeModel ?? "Not added yet",
    vehiclePlateNumber: result.data.rider?.vehiclePlateNumber ?? "Not added yet",
  };

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "R";

  return (
    <ToastProvider>
      <div className="flex-1 w-full h-full bg-[#fbf6ec] overflow-y-auto relative p-[20px] md:p-[40px]">
        <div className="max-w-[800px] mx-auto pt-10 md:pt-0">
          <div className="mb-[40px]">
            <h2 className="font-display text-[32px] tracking-[0.32px] text-[#1a1210] uppercase mb-1">
              MY PROFILE
            </h2>
            <p className="font-sans text-[13px] text-[#7a6a60]">
              name, contact, addresses and password
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-[18px] items-start w-full">
            <div className="shrink-0 w-[140px] h-[140px] rounded-full bg-[#8c1c13] flex items-center justify-center mb-6 md:mb-0">
              <span className="font-display text-[32px] text-[#fbf6ec] tracking-wide">
                {initials}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-[20px] w-full pb-10">
              <EmployeePersonalDetailsCard profile={profile} />

              <EmployeeDetailsCard
                role={employeeData.role}
                shift={employeeData.shift}
              />

              <DriverDetailsCard
                vehicleMakeModel={driverData.vehicleMakeModel}
                vehiclePlateNumber={driverData.vehiclePlateNumber}
              />

              <EmployeeContactDetailsCard profile={profile} />

              <PasswordCard lastUpdated={result.data.passwordLastUpdated} />
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
