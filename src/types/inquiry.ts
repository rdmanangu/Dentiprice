export type InquiryStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Inquiry {
  id: string;
  patient_name: string;
  phone: string;
  email: string;
  calculated_total_price: number;
  preferred_date: string;      // ISO date
  preferred_time_slot: string; // e.g., 'morning', 'afternoon', 'evening'
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
  // optionally include items if you want to fetch them together
}

// Type for the input expected by the RPC function
export type CreateInquiryInput = {
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