import { supabase } from "../lib/supabase";

export async function getProcedures() {
  const { data, error } = await supabase
    .from("procedures")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}