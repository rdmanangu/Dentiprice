import type { Inquiry, InquiryStatus } from "./inquiry";
import type { Appointment, AppointmentStatus } from "./appointment";

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

// The patient's next active appointment. Only appointments in the
// scheduled or confirmed status and on or after today count.
export interface UpcomingAppointment {
  id: string;
  appointment_date: string;
  appointment_start_time: string;
  appointment_end_time: string;
  status: AppointmentStatus;
}

// The patient's most recent inquiry, with its item snapshots, so the
// patient list can surface the latest treatment, add-ons, estimated
// total, reference, and relative age of the inquiry.
export interface LatestInquirySummary {
  id: string;
  calculated_total_price: number;
  status: InquiryStatus;
  created_at: string;
  items: InquiryItemSnapshot[];
}

export interface PatientListItem extends Patient {
  inquiry_count: number;
  appointment_count: number;
  latest_activity: string | null;
  upcoming_appointment: UpcomingAppointment | null;
  latest_inquiry: LatestInquirySummary | null;
}

export interface PatientListResult {
  patients: PatientListItem[];
  total: number;
}

export type UpdatePatientInput = {
  full_name: string;
  phone: string;
  email: string;
  date_of_birth?: string | null;
  notes?: string | null;
};

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
  upcoming_appointment: UpcomingAppointment | null;
}
