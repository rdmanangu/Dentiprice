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