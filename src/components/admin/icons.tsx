// ─────────────────────────────────────────────
// ADMIN LINE ICONS
// Simple stroke-based icons drawn on a 24px grid.
// Shared by the admin sidebar and dashboard.
// ─────────────────────────────────────────────

type IconProps = { className?: string };

function BaseIcon({
  className = "",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconDashboard({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </BaseIcon>
  );
}

export function IconInquiries({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7.5 9 6 9-6" />
    </BaseIcon>
  );
}

export function IconCalendar({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 9.5h18" />
    </BaseIcon>
  );
}

export function IconPatients({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.2 3.2-5.5 6.5-5.5s5.7 2.3 6.5 5.5" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" />
      <path d="M17.3 15a6.6 6.6 0 0 1 4.2 5" />
    </BaseIcon>
  );
}

export function IconTreatments({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3.5h6" />
      <path d="M12 8.5v6M9 11.5h6" />
    </BaseIcon>
  );
}

export function IconLogout({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </BaseIcon>
  );
}

export function IconMenu({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </BaseIcon>
  );
}

export function IconNotifications({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </BaseIcon>
  );
}

export function IconSearch({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </BaseIcon>
  );
}

export function IconChevronRight({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="m9 6 6 6-6 6" />
    </BaseIcon>
  );
}

export function IconDownload({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </BaseIcon>
  );
}

export function IconPhone({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M5 4h4l1.2 4-1.9 1.9a12.5 12.5 0 0 0 5.8 5.8L16 13.8l4 1.2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </BaseIcon>
  );
}

export function LogoIcon({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M12 5.6c-1.6-1.8-3.4-2.6-5.4-2-2.1.6-3.1 2.4-3.1 4.7 0 1.7.5 6.4 1.6 9.5.3.9.9 1.5 1.8 1.4.8-.1 1.3-.7 1.5-1.5.3-1.3.6-2.5 1.2-2.5s.9 1.2 1.2 2.5c.2.8.7 1.4 1.5 1.5.9.1 1.5-.5 1.8-1.4 1.1-3.1 1.6-7.8 1.6-9.5 0-2.3-1-4.1-3.1-4.7-2-.6-3.8.2-5.4 2Z" />
      <path d="M9 8.5c.4 1.2 1.2 1.8 2.2 1.8s1.8-.6 2.2-1.8" />
    </BaseIcon>
  );
}

// ─────────────────────────────────────────────
// SCHEDULING ICONS
// Same 24px stroke grid as the navigation icons.
// ─────────────────────────────────────────────

export function IconClock({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </BaseIcon>
  );
}

export function IconCheckCircle({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.3 2.3 4.7-4.8" />
    </BaseIcon>
  );
}

export function IconXCircle({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" />
    </BaseIcon>
  );
}

export function IconCalendarDay({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M8 2.5v4M16 2.5v4M3 10h18" />
      <path d="M11.5 14h1" />
    </BaseIcon>
  );
}

export function IconCalendarFuture({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M8 2.5v4M16 2.5v4M3 10h18" />
      <path d="M12 12.5v4l2.5 1.5" />
    </BaseIcon>
  );
}

export function IconBan({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6 6 12 12" />
    </BaseIcon>
  );
}

export function IconRefresh({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M20 11.5a8 8 0 1 0-2.3 6.3" />
      <path d="M20 5v6h-6" />
    </BaseIcon>
  );
}

export function IconList({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" />
      <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" />
    </BaseIcon>
  );
}

export function IconGrid({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </BaseIcon>
  );
}

export function IconPlus({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M12 5v14M5 12h14" />
    </BaseIcon>
  );
}

export function IconChevronLeft({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="m14.5 6-6 6 6 6" />
    </BaseIcon>
  );
}

export function IconChevronDown({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="m6 9.5 6 6 6-6" />
    </BaseIcon>
  );
}

export function IconAlert({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20.2h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 16.5h.01" />
    </BaseIcon>
  );
}

export function IconUserPlus({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.2 3.2-5.5 6.5-5.5 1.2 0 2.3.3 3.2.8" />
      <path d="M18 14v6M15 17h6" />
    </BaseIcon>
  );
}

export function IconNotes({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M6 3.5h9L19 7.5v13H6z" />
      <path d="M15 3.5v4h4" />
      <path d="M9 12h7M9 16h5" />
    </BaseIcon>
  );
}

export function IconStethoscope({ className = "" }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M6 3.5v5a4 4 0 0 0 8 0v-5" />
      <path d="M4.5 3.5h3M12.5 3.5h3" />
      <path d="M10 16.5a4.5 4.5 0 0 0 9 0V14" />
      <circle cx="19" cy="12" r="2" />
    </BaseIcon>
  );
}