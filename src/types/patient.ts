import type { Inquiry } from "./inquiry";
import type { Appointment } from "./appointment";

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreatePatientInput = {
  full_name: string;
  phone: string;
  email: string;
  date_of_birth?: string | null;
  notes?: string | null;
};

export interface PatientListItem extends Patient {
  inquiry_count: number;
  appointment_count: number;
  latest_activity: string | null;
}

export interface InquiryItemSnapshot {
  id: string;
  inquiry_id: string;
  procedure_id: string | null;
  add_on_id: string | null;
  item_name: string;
  item_price: number;
}

export interface InquiryWithItems {
  inquiry: Inquiry;
  items: InquiryItemSnapshot[];
}

export interface AppointmentItemSnapshot {
  id: string;
  appointment_id: string;
  procedure_id: string | null;
  add_on_id: string | null;
  item_name: string;
  item_price: number;
  created_at: string;
}

export interface AppointmentWithItems {
  appointment: Appointment;
  items: AppointmentItemSnapshot[];
}

export type PatientHistoryEntry =
  | {
      key: string;
      type: "inquiry";
      date: string;
      inquiry: Inquiry;
      items: InquiryItemSnapshot[];
    }
  | {
      key: string;
      type: "appointment";
      date: string;
      appointment: Appointment;
      items: AppointmentItemSnapshot[];
    };

export interface PatientHistory {
  patient: Patient;
  inquiries: InquiryWithItems[];
  appointments: AppointmentWithItems[];
  entries: PatientHistoryEntry[];
}
