import {
  getMyEmployeeProfile,
  updateMyEmployeeProfile,
} from "@/app/api/routers/employee-profile";

export const GET = getMyEmployeeProfile;
export const PATCH = updateMyEmployeeProfile;