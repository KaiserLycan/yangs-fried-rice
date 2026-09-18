import {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
} from "@/app/api/routers/profile";

export const GET = getMyProfile;
export const PATCH = updateMyProfile;
export const DELETE = deleteMyAccount;