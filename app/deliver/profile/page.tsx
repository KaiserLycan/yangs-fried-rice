"use client";

import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast";
import { PersonalDetailsCard } from "@/components/profile/personal-details-card";
import { ContactDetailsCard } from "@/components/profile/contact-details-card";
import { PasswordCard } from "@/components/profile/password-card";
import { EmployeeDetailsCard, DriverDetailsCard } from "@/components/profile/rider-details-cards";
import type { CustomerProfile } from "@/lib/profile/customer-profile";

export default function RiderProfilePage() {
  // Mock data for the rider structured as a CustomerProfile
  const profile: CustomerProfile = {
    name: "Liza Reyes",
    dateOfBirth: "1996-06-14",
    mobile: "09174028851",
    email: "liza.reyes@gmial.com", // Keeping typo from Figma exactly as requested
    memberSince: null,
    orderCount: 0,
    deliverToAddress: null,
    activeAddressId: null,
    addresses: [],
    profileImageUrl: null,
  };

  const employeeData = {
    role: "Delivery",
    shift: "MWF – 12-3PM",
  };

  const driverData = {
    vehicleMakeModel: "Honda XRM125",
    vehiclePlateNumber: "AB-12345",
  };

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
            {/* Avatar Area */}
            <div className="shrink-0 w-[140px] h-[140px] rounded-full bg-[#8c1c13] flex items-center justify-center mb-6 md:mb-0">
              <span className="font-display text-[32px] text-[#fbf6ec] tracking-wide">
                LR
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-[20px] w-full pb-10">
              <PersonalDetailsCard profile={profile} />
              
              <EmployeeDetailsCard 
                role={employeeData.role} 
                shift={employeeData.shift} 
              />
              
              <DriverDetailsCard 
                vehicleMakeModel={driverData.vehicleMakeModel} 
                vehiclePlateNumber={driverData.vehiclePlateNumber} 
              />
              
              <ContactDetailsCard profile={profile} />
              
              <PasswordCard />
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
