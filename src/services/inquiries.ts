import { supabase } from "../lib/supabase";

type CreateInquiryInput = {
  patientName: string;
  phone: string;
  email: string;
  procedureId: string;
  procedureName: string;
  procedurePrice: number;
  selectedAddOns: {
    id: string;
    name: string;
    price: number;
  }[];
  totalPrice: number;
  preferredDate: string;
  preferredTimeSlot: string;
};

export async function createInquiry(
  input: CreateInquiryInput
) {
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

  // 1. Create the inquiry
  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries")
    .insert({
      patient_name: patientName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      calculated_total_price: totalPrice,
      preferred_date: preferredDate,
      preferred_time_slot: preferredTimeSlot,
      status: "pending",
    })
    .select()
    .single();

  if (inquiryError) {
    throw inquiryError;
  }

  // 2. Create the main procedure item
  const items = [
    {
      inquiry_id: inquiry.id,
      procedure_id: procedureId,
      add_on_id: null,
      item_name: procedureName,
      item_price: procedurePrice,
    },

    // 3. Add selected add-ons
    ...selectedAddOns.map((addOn) => ({
      inquiry_id: inquiry.id,
      procedure_id: null,
      add_on_id: addOn.id,
      item_name: addOn.name,
      item_price: addOn.price,
    })),
  ];

  const { error: itemsError } = await supabase
    .from("inquiry_items")
    .insert(items);

  if (itemsError) {
    throw itemsError;
  }

  return inquiry;
}