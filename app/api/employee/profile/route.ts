import {
  getMyEmployeeProfile,
  updateMyEmployeeProfile,
  deleteMyEmployeeAccount,
} from "@/app/api/routers/employee-profile";

export const GET = getMyEmployeeProfile;
export const PATCH = updateMyEmployeeProfile;
export const DELETE = deleteMyEmployeeAccount;