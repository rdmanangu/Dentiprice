import { supabase } from "../lib/supabase";
import type {
  Patient,
  CreatePatientInput,
} from "../types/patient";

// ─────────────────────────────────────────────
// PHONE NORMALIZATION
// Strips non-digit characters, preserves
// leading + if present.
// ─────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();

  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }

  return trimmed.replace(/\D/g, "");
}

// ─────────────────────────────────────────────
// EMAIL NORMALIZATION
// Lowercases and trims.
// ─────────────────────────────────────────────

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ─────────────────────────────────────────────
// GET PATIENT BY ID
// ─────────────────────────────────────────────

export async function getPatientById(
  id: string
): Promise<Patient | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get patient by ID error:", error);
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// FIND PATIENT BY CONTACT
// Matching strategy:
//   1. normalized email AND phone
//   2. normalized phone only
//   3. normalized email only
// Returns the first match found, or null.
// ─────────────────────────────────────────────

export async function findPatientByContact(
  phone: string,
  email: string
): Promise<Patient | null> {
  const normPhone = normalizePhone(phone);
  const normEmail = normalizeEmail(email);

  // Strategy 1: match both email AND phone
  const { data: byBoth, error: errBoth } = await supabase
    .from("patients")
    .select("*")
    .eq("phone", normPhone)
    .eq("email", normEmail)
    .limit(1)
    .maybeSingle();

  if (errBoth) {
    console.error(
      "Find patient by contact (email+phone) error:",
      errBoth
    );
    throw errBoth;
  }

  if (byBoth) {
    return byBoth;
  }

  // Strategy 2: match phone only
  const { data: byPhone, error: errPhone } = await supabase
    .from("patients")
    .select("*")
    .eq("phone", normPhone)
    .limit(1)
    .maybeSingle();

  if (errPhone) {
    console.error(
      "Find patient by contact (phone) error:",
      errPhone
    );
    throw errPhone;
  }

  if (byPhone) {
    return byPhone;
  }

  // Strategy 3: match email only
  const { data: byEmail, error: errEmail } = await supabase
    .from("patients")
    .select("*")
    .eq("email", normEmail)
    .limit(1)
    .maybeSingle();

  if (errEmail) {
    console.error(
      "Find patient by contact (email) error:",
      errEmail
    );
    throw errEmail;
  }

  return byEmail;
}

// ─────────────────────────────────────────────
// CREATE PATIENT
// ─────────────────────────────────────────────

export async function createPatient(
  input: CreatePatientInput
): Promise<Patient> {
  const { data, error } = await supabase
    .from("patients")
    .insert({
      full_name: input.full_name.trim(),
      phone: normalizePhone(input.phone),
      email: normalizeEmail(input.email),
      date_of_birth: input.date_of_birth ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Create patient error:", error);
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// FIND OR CREATE PATIENT
// Uses the matching strategy to find an existing
// patient. Creates one if none found.
// ─────────────────────────────────────────────

export async function findOrCreatePatient(
  fullName: string,
  phone: string,
  email: string
): Promise<Patient> {
  const existing = await findPatientByContact(
    phone,
    email
  );

  if (existing) {
    return existing;
  }

  return createPatient({
    full_name: fullName,
    phone,
    email,
  });
}

// ─────────────────────────────────────────────
// GET PATIENTS (admin list)
// ─────────────────────────────────────────────

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get patients error:", error);
    throw error;
  }

  return data ?? [];
}
