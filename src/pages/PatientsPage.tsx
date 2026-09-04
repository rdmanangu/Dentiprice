import { useEffect, useState } from "react";
import type { PatientListItem } from "../types/patient";
import {
  getPatientsList,
  searchPatients,
} from "../services/patients";
import { DataTable, SectionHeader } from "../components/ui";
import PatientHistory from "../components/admin/PatientHistory";

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function PatientsPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PatientListItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPatientsList()
      .then((data) => {
        if (!cancelled) {
          setPatients(data);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Unable to load patients.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch(value: string) {
    setSearch(value);

    if (!value.trim()) {
      if (!loading) {
        setLoading(true);
        try {
          const data = await getPatientsList();
          setPatients(data);
          setError(null);
        } catch (err) {
          console.error(err);
          setError("Unable to load patients.");
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const data = await searchPatients(value);
      setPatients(
        data.map((patient) => ({
          ...patient,
          inquiry_count: 0,
          appointment_count: 0,
          latest_activity: null,
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Unable to search patients.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Patients"
        subtitle="View patient records and unified activity history."
      />

      <div className="max-w-md">
        <label htmlFor="patient-search" className="sr-only">
          Search patients
        </label>
        <input
          id="patient-search"
          type="search"
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <DataTable
        className="mt-2"
        ariaLabel="Patients"
        loading={loading || searching}
        loadingLabel={
          searching
            ? "Searching patients..."
            : "Loading patients..."
        }
        error={error}
        emptyTitle={
          search.trim()
            ? "No patients match your search."
            : "No patients found."
        }
        emptyDescription={
          search.trim()
            ? "Try a different name, phone, or email."
            : "Patient records will appear here once inquiries are submitted."
        }
        rows={patients}
        getRowId={(patient) => patient.id}
        onRowClick={(patient) => setSelected(patient)}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (patient) => (
              <p className="font-medium text-ink">{patient.full_name}</p>
            ),
          },
          {
            key: "contact",
            header: "Contact",
            render: (patient) => (
              <>
                <p className="text-sm">{patient.phone}</p>
                <p className="text-sm text-slate-500">{patient.email}</p>
              </>
            ),
          },
          {
            key: "inquiries",
            header: "Inquiries",
            align: "center",
            render: (patient) => (
              <span className="text-sm">{patient.inquiry_count}</span>
            ),
          },
          {
            key: "appointments",
            header: "Appointments",
            align: "center",
            render: (patient) => (
              <span className="text-sm">{patient.appointment_count}</span>
            ),
          },
          {
            key: "latest",
            header: "Latest activity",
            render: (patient) => (
              <span className="text-sm">
                {formatDate(patient.latest_activity)}
              </span>
            ),
          },
        ]}
      />

      {selected && (
        <PatientHistory
          patientId={selected.id}
          patientName={selected.full_name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default PatientsPage;
