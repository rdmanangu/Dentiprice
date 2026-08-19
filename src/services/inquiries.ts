import { supabase } from "../lib/supabase";
import type { Inquiry, InquiryStatus, CreateInquiryInput } from "../types/inquiry";

// ─── CREATE (atomic via RPC) ──────────────────────────
export async function createInquiry(input: CreateInquiryInput) {
  const {
    patientName,
    phone,
    email,
    procedureId,
    procedureName,
    procedurePrice,
    selectedAddOns,
    totalPrice,
    preferredDate,
    preferredTimeSlot,
  } = input;

  // Build the items array for the RPC
  const items = [
    {
      procedure_id: procedureId,
      add_on_id: null,
      item_name: procedureName,
      item_price: procedurePrice,
    },
    ...selectedAddOns.map((addOn) => ({
      procedure_id: null,
      add_on_id: addOn.id,
      item_name: addOn.name,
      item_price: addOn.price,
    })),
  ];

  // Call the database function
  const { data, error } = await supabase.rpc('create_inquiry_with_items', {
    p_patient_name: patientName.trim(),
    p_phone: phone.trim(),
    p_email: email.trim().toLowerCase(),
    p_calculated_total_price: totalPrice,
    p_preferred_date: preferredDate,
    p_preferred_time_slot: preferredTimeSlot,
    p_items: items, // send as JSONB
  });

  if (error) {
    console.error('RPC create_inquiry_with_items error:', error);
    throw error;
  }

  return data as { id: string; status: string; patient_name: string };
}

// ─── READ all inquiries ────────────────────────────────
export async function getInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get inquiries error:', error);
    throw error;
  }

  return data ?? [];
}

// ─── UPDATE status ──────────────────────────────────────
export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
  const { data, error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Update inquiry status error:', error);
    throw error;
  }

  return data;
}

// ─── DELETE (requires authentication) ──────────────────
export async function deleteInquiry(id: string): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error('You must be signed in to delete an inquiry.');
  }

  const { data, error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Delete inquiry error:', error);
    throw error;
  }

  if (!data) {
    throw new Error('The inquiry was not deleted. Your account may not have permission.');
  }
}