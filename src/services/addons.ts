import { supabase } from "../lib/supabase";

export type AddOn = {
  id: string;
  procedure_id: string;
  name: string;
  price: number;
  duration_mins: number;
  is_active: boolean;
};

export async function getAddOnsForProcedure(
  procedureId: string
): Promise<AddOn[]> {
  const { data, error } = await supabase
    .from("add_ons")
    .select("*")
    .eq("procedure_id", procedureId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// ADMIN: GET ALL ADD-ONS
// Includes inactive add-ons
// ─────────────────────────────────────────────

export async function getAllAddOns(): Promise<AddOn[]> {
  const { data, error } = await supabase
    .from("add_ons")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// ADMIN: CREATE ADD-ON
// ─────────────────────────────────────────────

export async function createAddOn(
  addOn: Omit<AddOn, "id">
): Promise<AddOn> {
  const { data, error } = await supabase
    .from("add_ons")
    .insert(addOn)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// ADMIN: UPDATE ADD-ON
// ─────────────────────────────────────────────

export async function updateAddOn(
  id: string,
  addOn: Partial<Omit<AddOn, "id">>
): Promise<AddOn> {
  const { data, error } = await supabase
    .from("add_ons")
    .update(addOn)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// ADMIN: DELETE ADD-ON
// Requires authenticated admin session
// ─────────────────────────────────────────────

export async function deleteAddOn(id: string): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error("You must be signed in to delete an add-on.");
  }

  const { data, error } = await supabase
    .from("add_ons")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "The add-on was not deleted. Your account may not have permission."
    );
  }
}