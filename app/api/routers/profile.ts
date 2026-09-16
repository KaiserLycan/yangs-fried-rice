import { NextResponse } from "next/server";
import {
  getMyProfile as getMyProfileAction,
  updateMyProfile as updateMyProfileAction,
  addMyAddress as addMyAddressAction,
  updateMyAddress as updateMyAddressAction,
  deleteMyAddress as deleteMyAddressAction,
  setDefaultAddress as setDefaultAddressAction,
  changeMyPassword as changeMyPasswordAction,
  deleteMyAccount as deleteMyAccountAction,
} from "@/lib/actions/profile";

interface RouteParams {
  params: {
    id: string;
  };
}

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
      { error: result.error },
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
      { error: result.error },
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
      { error: result.error },
      { status: errorToStatus(result.error) }
    );
  }
  return NextResponse.json({ message: "Account deleted successfully" });
}

export async function addMyAddress(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const result = await addMyAddressAction(body as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json(
    { message: "Address added successfully", data: result.data },
    { status: 201 }
  );
}

export async function updateMyAddress(
  request: Request,
  { params }: RouteParams
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const result = await updateMyAddressAction(params.id, body as any);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error) }
    );
  }

  return NextResponse.json({ message: "Address updated successfully" });
}

export async function deleteMyAddress(
  _request: Request,
  { params }: RouteParams
) {
  const result = await deleteMyAddressAction(params.id);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error) }
    );
  }
  return NextResponse.json({ message: "Address deleted successfully" });
}

export async function setDefaultAddress(
  _request: Request,
  { params }: RouteParams
) {
  const result = await setDefaultAddressAction(params.id);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error) }
    );
  }
  return NextResponse.json({ message: "Default address updated" });
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
      { error: result.error },
      { status: errorToStatus(result.error) }
    );
  }

  return NextResponse.json({ message: "Password updated successfully" });
}