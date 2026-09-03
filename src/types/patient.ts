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
