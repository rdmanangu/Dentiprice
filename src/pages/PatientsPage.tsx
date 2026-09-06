import { useEffect, useState } from "react";
import type {
  PatientListItem,
  UpcomingAppointment,
} from "../types/patient";
import { listPatients } from "../services/patients";
import { Button, DataTable, SectionHeader } from "../components/ui";
import PatientHistory from "../components/admin/PatientHistory";

const PAGE_SIZE = 20;

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");

  if (!h || !m) {
    return time;
  }

  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
}

function formatUpcoming(
  appointment: UpcomingAppointment | null
): string {
  if (!appointment) {
    return "—";
  }

  const date = new Date(`${appointment.appointment_date}T00:00:00`);
  const dateLabel = Number.isNaN(date.getTime())
    ? appointment.appointment_date
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

  return `${dateLabel} · ${formatTime(appointment.appointment_start_time)}`;
}

function PatientsPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<PatientListItem | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  // Debounce search input so each keystroke does not issue a database query.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setLoading(true);
      setQuery(searchInput);
      setPage(1);
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    listPatients({
      query: query.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (!cancelled) {
          setPatients(result.patients);
          setTotal(result.total);
          setError(null);

          const totalPages = Math.max(
            1,
            Math.ceil(result.total / PAGE_SIZE)
          );

          if (
            result.patients.length === 0 &&
            result.total > 0 &&
            page > totalPages
          ) {
            setPage(totalPages);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setPatients([]);
          setTotal(0);
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
  }, [query, page, refreshToken]);

  function handleDataChanged() {
    setLoading(true);
    setRefreshToken((current) => current + 1);
  }

  function handleCloseDetails() {
    setSelected(null);
    setLoading(true);
    setRefreshToken((current) => current + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

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
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <DataTable
        className="mt-2"
        ariaLabel="Patients"
        loading={loading}
        loadingLabel={
          searchInput.trim()
            ? "Searching patients..."
            : "Loading patients..."
        }
        error={error}
        emptyTitle={
          query.trim()
            ? "No patients match your search."
            : "No patients found."
        }
        emptyDescription={
          query.trim()
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
            key: "dob",
            header: "Date of birth",
            render: (patient) => (
              <span className="text-sm">
                {formatDate(patient.date_of_birth)}
              </span>
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
          {
            key: "upcoming",
            header: "Upcoming appointment",
            render: (patient) => (
              <span className="text-sm">
                {formatUpcoming(patient.upcoming_appointment)}
              </span>
            ),
          },
        ]}
      />

      {/* PAGINATION */}
      {!loading && !error && total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500" aria-live="polite">
            Showing {rangeStart}–{rangeEnd} of {total}{" "}
            {total === 1 ? "patient" : "patients"}
          </p>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}
              disabled={page <= 1}
            >
              Previous
            </Button>

            <span className="text-sm text-slate-500">
              Page {Math.min(page, totalPages)} of {totalPages}
            </span>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setLoading(true);
                setPage((current) => current + 1);
              }}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {selected && (
        <PatientHistory
          patientId={selected.id}
          patientName={selected.full_name}
          onClose={handleCloseDetails}
          onDataChanged={handleDataChanged}
        />
      )}
    </div>
  );
}

export default PatientsPage;
