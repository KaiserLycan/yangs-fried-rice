import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, phone_number, address } = parsed.data;
  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }
  if (!authData.user) {
    return NextResponse.json(
      { error: "Registration failed — no user returned." },
      { status: 500 }
    );
  }

  const userId = authData.user.id;
  let profileSaved = true;
  let profileError: string | null = null;

  try {
    const { error: customerError } = await supabase.from("Customer").insert({
      customer_id: userId,
      name,
      email,
      phone_number: phone_number ?? null,
    });
    if (customerError) throw customerError;

    const { error: addressError } = await supabase
      .from("Customer_Address")
      .insert({
        customer_id: userId,
        label: address.label,
        address_details: address.address_details,
      });
    if (addressError) throw addressError;
  } catch (err) {
    profileSaved = false;
    profileError =
      err instanceof Error
        ? err.message
        : "Could not save profile — Customer/Customer_Address tables may not be ready yet.";
  }

  return NextResponse.json(
    {
      success: true,
      userId,
      profileSaved,
      ...(profileError ? { profileWarning: profileError } : {}),
    },
    { status: 201 }
  );
}