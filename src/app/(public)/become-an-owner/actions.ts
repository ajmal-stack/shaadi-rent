"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OwnerApplication } from "@/types/database";

export interface ApplicationFormData {
  // Step 1: Personal
  full_name: string;
  email: string;
  phone: string;
  alt_phone?: string;
  dob: string;
  gender: "female" | "male" | "other" | "prefer_not_to_say";
  bio?: string;

  // Step 2: Phone OTP
  phone_verified: boolean;

  // Step 3: Identity
  id_type: "aadhaar" | "passport" | "pan" | "driving_license" | "voter_id";
  id_number: string;
  id_front_url: string;
  id_back_url: string;

  // Step 4: Address
  address_line1: string;
  address_line2?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  landmark?: string;

  // Step 5: Declaration & Agreement
  agreed_to_terms: boolean;
  declaration_accepted: boolean;
  signature_name: string;
}

/**
 * Retrieves the currently signed-in user's profile and existing owner application (if any).
 */
export async function getMyApplication(): Promise<{
  user: { id: string; email: string; full_name: string | null; role: string } | null;
  application: OwnerApplication | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, application: null, error: "Unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, phone")
    .eq("id", user.id)
    .single();

  const { data: application } = await supabase
    .from("owner_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user: {
      id: user.id,
      email: user.email || profile?.email || "",
      full_name: profile?.full_name || "",
      role: profile?.role || "customer",
    },
    application: application || null,
    error: null,
  };
}

/**
 * Saves draft progress across application steps.
 */
export async function saveApplicationDraftAction(
  draft: Partial<ApplicationFormData>
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to save progress." };
  }

  const { error } = await supabase.from("owner_applications").upsert(
    {
      user_id: user.id,
      ...draft,
      status: "draft",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Step 2: Generates a 6-digit OTP code and records it for verification.
 * Provides devOtp for rapid testing without external SMS billing hurdles.
 */
export async function sendOtpAction(phone: string): Promise<{
  success: boolean;
  message: string;
  devOtp?: string;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "", error: "Please sign in to continue." };
  }

  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    return {
      success: false,
      message: "",
      error: "Please enter a valid 10-digit mobile number.",
    };
  }

  // Generate secure 6-digit OTP
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Upsert into owner_applications
  const { error } = await supabase.from("owner_applications").upsert(
    {
      user_id: user.id,
      phone: cleanPhone,
      otp_code: generatedOtp,
      otp_expires_at: expiresAt,
      otp_attempts: 0,
      phone_verified: false,
      status: "draft",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { success: false, message: "", error: error.message };
  }

  return {
    success: true,
    message: `Verification OTP generated for +91 ${cleanPhone.slice(-10)}`,
    devOtp: generatedOtp, // Exposed for testability / UI assistance
  };
}

/**
 * Step 2: Verifies the entered 6-digit OTP against the stored code and expiration.
 */
export async function verifyOtpAction(
  phone: string,
  code: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to verify OTP." };
  }

  const cleanCode = code.trim();
  if (cleanCode.length !== 6) {
    return { success: false, error: "Please enter a 6-digit OTP code." };
  }

  // Fetch application record
  const { data: app, error: fetchErr } = await supabase
    .from("owner_applications")
    .select("otp_code, otp_expires_at, otp_attempts, phone_verified")
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !app) {
    return { success: false, error: "OTP request not found. Please request a new code." };
  }

  if (app.otp_attempts >= 5) {
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Please request a new OTP.",
    };
  }

  const now = new Date();
  const expiresAt = app.otp_expires_at ? new Date(app.otp_expires_at) : null;

  if (!expiresAt || now > expiresAt) {
    return { success: false, error: "OTP code has expired. Please request a new one." };
  }

  if (app.otp_code !== cleanCode) {
    // Increment attempts
    await supabase
      .from("owner_applications")
      .update({ otp_attempts: (app.otp_attempts || 0) + 1 })
      .eq("user_id", user.id);

    return { success: false, error: "Incorrect OTP code. Please try again." };
  }

  // Valid OTP: mark phone as verified
  const { error: updateErr } = await supabase
    .from("owner_applications")
    .update({
      phone_verified: true,
      otp_code: null,
      otp_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  return { success: true, error: null };
}

/**
 * Step 5: Final submission of complete owner application.
 * Changes status from 'draft' to 'pending' (Under Review).
 */
export async function submitOwnerApplicationAction(
  formData: ApplicationFormData
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to submit your application." };
  }

  // Validation
  if (!formData.full_name?.trim()) return { success: false, error: "Full name is required." };
  if (!formData.phone?.trim()) return { success: false, error: "Mobile number is required." };
  if (!formData.dob) return { success: false, error: "Date of birth is required." };
  if (!formData.gender) return { success: false, error: "Gender selection is required." };
  if (!formData.phone_verified) return { success: false, error: "Please verify your mobile number first." };
  if (!formData.id_type) return { success: false, error: "Identity document type is required." };
  if (!formData.id_number?.trim()) return { success: false, error: "ID document number is required." };
  if (!formData.id_front_url) return { success: false, error: "Please upload the front of your ID document." };
  if (!formData.id_back_url) return { success: false, error: "Please upload the back of your ID document." };
  if (!formData.address_line1?.trim()) return { success: false, error: "Address line 1 is required." };
  if (!formData.city?.trim()) return { success: false, error: "City is required." };
  if (!formData.district?.trim()) return { success: false, error: "District is required." };
  if (!formData.state?.trim()) return { success: false, error: "State is required." };
  if (!formData.pincode?.trim()) return { success: false, error: "Pincode is required." };
  if (!formData.agreed_to_terms || !formData.declaration_accepted) {
    return { success: false, error: "You must accept all declarations and agreement terms." };
  }
  if (!formData.signature_name?.trim()) {
    return { success: false, error: "Digital signature (full legal name) is required." };
  }

  const now = new Date().toISOString();

  const { error: upsertErr } = await supabase.from("owner_applications").upsert(
    {
      user_id: user.id,
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      alt_phone: formData.alt_phone?.trim() || null,
      dob: formData.dob,
      gender: formData.gender,
      bio: formData.bio?.trim() || null,
      phone_verified: true,
      id_type: formData.id_type,
      id_number: formData.id_number.trim(),
      id_front_url: formData.id_front_url,
      id_back_url: formData.id_back_url,
      address_line1: formData.address_line1.trim(),
      address_line2: formData.address_line2?.trim() || null,
      city: formData.city.trim(),
      district: formData.district.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      landmark: formData.landmark?.trim() || null,
      agreed_to_terms: true,
      declaration_accepted: true,
      signature_name: formData.signature_name.trim(),
      agreed_at: now,
      status: "pending",
      submitted_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (upsertErr) {
    return { success: false, error: upsertErr.message };
  }

  // Update profile verification_status to pending
  await supabase
    .from("profiles")
    .update({
      verification_status: "pending",
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      district: formData.district.trim(),
      state: formData.state.trim(),
      updated_at: now,
    })
    .eq("id", user.id);

  revalidatePath("/become-an-owner");
  revalidatePath("/become-an-owner/status");
  revalidatePath("/list-your-outfit");

  return { success: true, error: null };
}
