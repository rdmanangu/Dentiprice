import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Patient, PatientListItem } from "../types/patient";
import type { Procedure } from "../types/procedure";
import { listPatients } from "../services/patients";
import { getProcedures } from "../services/procedures";
import {
  Button,
  DataTable,
  SectionHeader,
  Select,
} from "../components/ui";
import { formatPrice } from "../lib/formatPrice";
import {
  IconDownload,
  IconSearch,
} from "../components/admin/icons";
import {
  PatientAvatar,
  PatientStatusBadge,
} from "../components/admin/patientPrimitives";
import {
  derivePatientStatus,
  formatShortDate,
  formatTime12,
  inquiryRef,
  relativeTime,
} from "../lib/patientDisplay";
import { PatientFormModal } from "../components/admin/PatientFormModal";

const PAGE_SIZE = 6;

type StatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

type DateFilter = "all" | "today" | "7d" | "30d";

const statusTabOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const dateOptions: { label: string; value: DateFilter }[] = [
  { label: "Date range: All", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
];

function inDateRange(
  value: string | null | undefined,
  filter: DateFilter
): boolean {
  if (filter === "all") {
    return true;
  }

  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  if (filter === "today") {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    return date >= startOfToday;
  }

  const days = filter === "7d" ? 7 : 30;
  return date >= new Date(now.getTime() - days * 86_400_000);
}

function pageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    items.push("…");
  }

  for (let value = start; value <= end; value += 1) {
    items.push(value);
  }

  if (end < total - 1) {
    items.push("…");
  }

  items.push(total);
  return items;
}

function exportPatients(rows: PatientListItem[]) {
  const escape = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""')}"`;

  const header = [
    "Patient",
    "Phone",
    "Email",
    "Treatment",
    "Add-ons",
    "Estimated total",
    "Inquiry reference",
    "Appointment",
    "Status",
  ];

  const body = rows.map((patient) => {
    const inquiry = patient.latest_inquiry;
    const treatment = inquiry?.items.find((item) => item.procedure_id)?.item_name;
    const addOnCount = inquiry
      ? inquiry.items.filter((item) => item.add_on_id).length
      : 0;
    const status = derivePatientStatus(patient);

    return [
      patient.full_name,
      patient.phone,
      patient.email,
      treatment ?? "",
      addOnCount ? `+${addOnCount}` : "",
      inquiry
        ? formatPrice(inquiry.calculated_total_price).replace("₱", "")
        : "",
      inquiry ? inquiryRef(inquiry.id) : "",
      patient.upcoming_appointment
        ? `${patient.upcoming_appointment.appointment_date} ${patient.upcoming_appointment.appointment_start_time}`
        : "",
      status ? status.charAt(0).toUpperCase() + status.slice(1) : "",
    ]
      .map(escape)
      .join(",");
  });

  const csv = [header.map(escape).join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "patients.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function PatientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlSearchTerm = searchParams.get("search") ?? "";

  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState(urlSearchTerm);
  const [query, setQuery] = useState(urlSearchTerm);

  // Deep-links from the dashboard search bar arrive as ?search=... while the
  // component may already be mounted, so sync the local state to the URL term
  // during render (React's recommended pattern for prop->state adjustment).
  const [syncedSearchTerm, setSyncedSearchTerm] = useState(urlSearchTerm);

  if (urlSearchTerm !== syncedSearchTerm) {
    setSyncedSearchTerm(urlSearchTerm);
    setSearchInput(urlSearchTerm);
    setQuery(urlSearchTerm);
    setPage(1);
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [treatmentFilter, setTreatmentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const [treatments, setTreatments] = useState<Procedure[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    getProcedures()
      .then(setTreatments)
      .catch(() => setTreatments([]));
  }, []);

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

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (
        statusFilter !== "all" &&
        derivePatientStatus(patient) !== statusFilter
      ) {
        return false;
      }

      if (treatmentFilter !== "all") {
        const itemNames =
          patient.latest_inquiry?.items.map((item) =>
            item.item_name.toLowerCase()
          ) ?? [];

        if (!itemNames.includes(treatmentFilter.toLowerCase())) {
          return false;
        }
      }

      if (!inDateRange(patient.latest_inquiry?.created_at, dateFilter)) {
        return false;
      }

      return true;
    });
  }, [patients, statusFilter, treatmentFilter, dateFilter]);

  const hasActiveFilters =
    statusFilter !== "all" || treatmentFilter !== "all" || dateFilter !== "all";

  function handleClearFilters() {
    setStatusFilter("all");
    setTreatmentFilter("all");
    setDateFilter("all");
  }

  function handleSaved(saved: Patient) {
    setFormOpen(false);
    setEditingPatient(null);

    if (saved.id === editingPatient?.id) {
      setRefreshToken((current) => current + 1);
    } else {
      navigate(`/admin/patients/${saved.id}`);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <SectionHeader
        as="h1"
        title="Patients & Inquiries"
        subtitle="Manage patient records, inquiries, and appointment status"
      />

      {/* FILTER PANEL */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="patient-search" className="sr-only">
              Search patients, inquiries
            </label>
            <input
              id="patient-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, phone, or reference no."
              className="w-full rounded-control border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            aria-label="Filter by status"
          >
            {statusTabOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === "all"
                  ? "Status: All"
                  : option.label}
              </option>
            ))}
          </Select>

          <Select
            value={treatmentFilter}
            onChange={(event) => setTreatmentFilter(event.target.value)}
            aria-label="Filter by treatment"
          >
            <option value="all">Treatment: All</option>
            {treatments.map((procedure) => (
              <option key={procedure.id} value={procedure.name}>
                {procedure.name}
              </option>
            ))}
          </Select>

          <Select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value as DateFilter)}
            aria-label="Filter by date range"
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400" aria-live="polite">
            {hasActiveFilters
              ? `${filteredPatients.length} of ${total} ${
                  total === 1 ? "patient" : "patients"
                } match the current filters.`
              : `Filters search the most recent inquiry for each patient.`}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => exportPatients(filteredPatients)}
              disabled={filteredPatients.length === 0}
            >
              <IconDownload className="h-4 w-4" />
              Export
            </Button>

            <Button
              type="button"
              variant="cta"
              onClick={() => {
                setEditingPatient(null);
                setFormOpen(true);
              }}
            >
              + Add Patient
            </Button>
          </div>
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="flex flex-wrap gap-2">
        {statusTabOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter(option.value)}
            aria-pressed={statusFilter === option.value}
            className={`rounded-control px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              statusFilter === option.value
                ? "bg-primary text-white"
                : "border border-border bg-surface text-slate-700 hover:bg-bg"
            }`}
          >
            {option.label}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-control px-3 py-2 text-sm font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      <DataTable
        ariaLabel="Patients and inquiries"
        loading={loading}
        loadingLabel="Loading patients..."
        error={error}
        emptyTitle={
          query.trim() || hasActiveFilters
            ? "No patients match your search."
            : "No patients found."
        }
        emptyDescription={
          query.trim() || hasActiveFilters
            ? "Try adjusting your search or filters."
            : "Patient records will appear here once inquiries are submitted."
        }
        emptyAction={
          <Button
            type="button"
            variant="cta"
            onClick={() => {
              setEditingPatient(null);
              setFormOpen(true);
            }}
          >
            + Add Patient
          </Button>
        }
        rows={filteredPatients}
        getRowId={(patient) => patient.id}
        columns={[
          {
            key: "patient",
            header: "Patient Information",
            render: (patient) => (
              <div className="flex items-center gap-3">
                <PatientAvatar name={patient.full_name} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {patient.full_name}
                  </p>
                  <p className="text-sm text-slate-500">{patient.phone}</p>
                  <p className="truncate text-sm text-slate-500">
                    {patient.email}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "inquiry",
            header: "Inquiry",
            render: (patient) => {
              const inquiry = patient.latest_inquiry;

              if (!inquiry) {
                return (
                  <span className="text-sm text-slate-400">
                    No inquiry yet
                  </span>
                );
              }

              const treatment = inquiry.items.find(
                (item) => item.procedure_id
              )?.item_name;
              const addOnCount = inquiry.items.filter(
                (item) => item.add_on_id
              ).length;

              return (
                <div className="space-y-0.5">
                  <p className="font-medium text-ink">
                    {treatment ?? "Inquiry"}
                  </p>
                  {addOnCount > 0 && (
                    <p className="text-xs text-slate-500">
                      +{addOnCount} add-on{addOnCount === 1 ? "" : "s"}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-primary">
                    {formatPrice(inquiry.calculated_total_price)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {inquiryRef(inquiry.id)} · {relativeTime(inquiry.created_at)}
                  </p>
                </div>
              );
            },
          },
          {
            key: "appointment",
            header: "Appointment",
            render: (patient) => {
              const appointment = patient.upcoming_appointment;

              if (!appointment) {
                return <span className="text-sm text-slate-400">—</span>;
              }

              return (
                <div>
                  <p className="text-sm font-medium text-ink">
                    {formatShortDate(appointment.appointment_date)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatTime12(appointment.appointment_start_time)}
                  </p>
                </div>
              );
            },
          },
          {
            key: "status",
            header: "Status",
            render: (patient) => {
              const status = derivePatientStatus(patient);

              return status ? (
                <PatientStatusBadge status={status} />
              ) : (
                <span className="text-sm text-slate-400">—</span>
              );
            },
          },
          {
            key: "actions",
            header: "Actions",
            render: (patient) => (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/admin/patients/${patient.id}`)}
                >
                  View Details
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPatient(patient);
                    setFormOpen(true);
                  }}
                  className="rounded-control px-3 py-2 text-sm font-medium text-slate-600 underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Update
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* PAGINATION */}
      {!loading && !error && total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500" aria-live="polite">
            {hasActiveFilters
              ? `Showing ${filteredPatients.length} of ${total} ${
                  total === 1 ? "patient" : "patients"
                }.`
              : `Showing ${rangeStart}–${rangeEnd} of ${total} ${
                  total === 1 ? "patient" : "patients"
                }`}
          </p>

          <nav
            aria-label="Patient list pagination"
            className="flex flex-wrap items-center gap-2"
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || filteredPatients.length === 0}
            >
              ← Prev
            </Button>

            {pageItems(page, totalPages).map((item, index) =>
              typeof item === "number" ? (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-current={item === page ? "page" : undefined}
                  className={`h-9 w-9 rounded-control text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    item === page
                      ? "bg-primary text-white"
                      : "border border-border bg-surface text-slate-700 hover:bg-bg"
                  }`}
                >
                  {item}
                </button>
              ) : (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-slate-400"
                  aria-hidden="true"
                >
                  …
                </span>
              )
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages || filteredPatients.length === 0}
            >
              Next →
            </Button>
          </nav>
        </div>
      )}

      <PatientFormModal
        open={formOpen}
        patient={editingPatient}
        onClose={() => {
          setFormOpen(false);
          setEditingPatient(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}

export default PatientsPage;