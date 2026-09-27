import { NextResponse } from "next/server";
import {
  getMyProfile as getMyProfileAction,
  updateMyProfile as updateMyProfileAction,
  changeMyPassword as changeMyPasswordAction,
  deleteMyAccount as deleteMyAccountAction,
} from "@/lib/actions/profile";

function errorToStatus(error: string): number {
  if (error.includes("must be signed in")) {
    return 401;
  }
  if (error.toLowerCase().includes("not found")) {
    return 404;
  }
  return 400;
}

export async function getMyProfile() {
  const result = await getMyProfileAction();
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error, fieldErrors: result.fieldErrors },
      { status: errorToStatus(result.error || "") }
    );
  }
  return NextResponse.json({ data: result.data });
}

export async function updateMyProfile(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const result = await updateMyProfileAction(body as any);
  if (result.error) {
    return NextResponse.json(
      { error: result.error, fieldErrors: result.fieldErrors },
      { status: errorToStatus(result.error) }
    );
  }

  return NextResponse.json({
    message: "Profile updated successfully",
    data: result.data,
  });
}

export async function deleteMyAccount() {
  const result = await deleteMyAccountAction();
  if (result.error) {
    return NextResponse.json(
      { error: result.error, fieldErrors: result.fieldErrors },
      { status: errorToStatus(result.error) }
    );
  }
  return NextResponse.json({ message: "Account deleted successfully" });
}

export async function changeMyPassword(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const result = await changeMyPasswordAction(body as any);
  if (result.error) {
    return NextResponse.json(
      { error: result.error, fieldErrors: result.fieldErrors },
      { status: errorToStatus(result.error) }
    );
  }

  return NextResponse.json({ message: "Password updated successfully" });
}