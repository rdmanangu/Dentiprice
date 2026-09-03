export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  patient_id: string;
  inquiry_id: string | null;
  appointment_date: string;
  appointment_start_time: string;
  appointment_end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentItem {
  id: string;
  appointment_id: string;
  procedure_id: string | null;
  add_on_id: string | null;
  item_name: string;
  item_price: number;
  created_at: string;
}

export interface ConfirmScheduleResult {
  appointment_id: string;
  inquiry_id: string;
  patient_id: string;
  appointment_date: string;
  appointment_start_time: string;
  appointment_end_time: string;
  appointment_status: AppointmentStatus;
  inquiry_status: "confirmed";
  items: { item_name: string; item_price: number }[];
}

export interface AppointmentPatient {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

export interface AppointmentWithDetails extends Appointment {
  patient: AppointmentPatient | null;
  appointment_items: AppointmentItem[];
}

