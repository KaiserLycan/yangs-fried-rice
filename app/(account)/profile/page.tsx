import { redirect } from "next/navigation";
import { AccountActions } from "@/components/profile/account-actions";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import { ToastProvider } from "@/components/ui/toast";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Customer profile (Cust3, Cust4, Cust5).
 *
 * This ticket builds the shell, log out and delete account. The personal,
 * contact, address and password sections land in later tickets and slot into
 * the marked gap below.
 *
 * Reads are real; writes are not. Everything displayed here comes from live
 * data so the screen can be reviewed against the design, but every mutation
 * except signing out raises a toast, because server-side work on this screen
 * belongs to the backend developer. See
 * `.scratch/profile-page/issues/05-backend-handoff.md`.
 */
export default async function ProfilePage() {
  const profile = await readCustomerProfile();

  // Middleware already turns signed-out visitors away, so reaching this is
  // not expected. Guarding anyway: without it a missing session would render
  // a profile page with nobody's details on it rather than sending them to
  // sign in.
  if (!profile) redirect("/login?next=/profile");

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <ProfileHeader profile={profile} />

        <div className="flex flex-1">
          <ProfileSidebar profile={profile} />

          <main
            id="profile"
            className="flex-1 px-[14px] py-[16px] md:px-[32px] md:py-[26px]"
          >
            <div className="flex flex-col gap-[12px] md:max-w-[880px] md:gap-[18px]">
              <div className="hidden items-baseline gap-[12px] md:flex">
                <h1 className="font-display text-[32px] tracking-[0.32px] text-foreground">
                  MY PROFILE
                </h1>
                <p className="text-[13px] text-muted-foreground">
                  name, contact, addresses and password
                </p>
              </div>

              <ProfileSummaryCard profile={profile} />

              {/* Personal details, contact details, addresses and password
                  sections land here. Their anchor ids are what the sidebar
                  links already point at. */}

              <AccountActions />
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
