import { supabase } from "../lib/supabase";
import type { Procedure } from "../types/procedure";

export async function getProcedures(): Promise<Procedure[]> {
  const { data, error } = await supabase
    .from("procedures")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createProcedure(
  procedure: Omit<Procedure, "id">
): Promise<Procedure> {
  const { data, error } = await supabase
    .from("procedures")
    .insert(procedure)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProcedure(
  id: string,
  procedure: Partial<Omit<Procedure, "id">>
): Promise<Procedure> {
  const { data, error } = await supabase
    .from("procedures")
    .update(procedure)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteProcedure(
  id: string
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error("You must be signed in to delete a procedure.");
  }

  const { data, error } = await supabase
    .from("procedures")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "The procedure was not deleted. Your account may not have permission."
    );
  }
}
