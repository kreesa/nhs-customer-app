// src/utils/serviceStatus.ts
//
// Single source of truth for translating a raw service `status` string
// (as returned by the API) into what the UI needs to show:
//   - a human-readable label
//   - a badge color
//   - which step of the timeline it belongs to
//
// Use this everywhere status is rendered (list cards, timeline/track screen,
// filters, etc.) instead of re-deriving label/color logic per screen.

export type ServiceStatus =
  | "created"
  | "assigned"
  | "en_route"
  | "arrived"
  | "started"
  | "awaiting_approval"
  | "awaiting_material"
  | "in_progress"
  | "approved_proxy"
  | "rejected_proxy"
  | "material_ready"
  | "invoiced"
  | "completed"
  | "paid"
  | "cancelled";

  export type ServiceStatusLabel =
  | "Request received"
  | "Technician Assigned"
  | "Work In Progress"
  | "On Hold"
  | "Completed";

// Raw color names from the spec. If your <Badge /> component expects a
// different prop vocabulary (e.g. "success" / "warning"), keep this as-is
// and translate at the very end via BADGE_COLOR_TO_VARIANT below —
// don't scatter color logic elsewhere.
export type BadgeColor = "amber" | "green" | "red" | "blue" | "gray";

export type TimelineStepKey =
  | "requestReceived"
  | "technicianAssigned"
  | "enRouteLocation"
  | "workInProgress"
  | "completed"
  | "paymentMade"
  | "cancelled";

interface StatusConfig {
  label: string;
  badgeColor: BadgeColor;
  timelineStep: TimelineStepKey;
}

const STATUS_CONFIG: Record<ServiceStatus, StatusConfig> = {
  created: { label: "Request Received", badgeColor: "amber", timelineStep: "requestReceived" },

  assigned: { label: "Technician Assigned", badgeColor: "green", timelineStep: "technicianAssigned" },

  en_route: { label: "En route to your Location", badgeColor: "red", timelineStep: "enRouteLocation" },
  arrived: { label: "En route to your Location", badgeColor: "red", timelineStep: "enRouteLocation" },

  started: { label: "Work in Progress", badgeColor: "blue", timelineStep: "workInProgress" },
  awaiting_approval: { label: "Work in Progress", badgeColor: "blue", timelineStep: "workInProgress" },
  awaiting_material: { label: "Work in Progress", badgeColor: "blue", timelineStep: "workInProgress" },
  in_progress: { label: "Work in Progress", badgeColor: "blue", timelineStep: "workInProgress" },
  approved_proxy: { label: "Work in Progress", badgeColor: "blue", timelineStep: "workInProgress" },
  rejected_proxy: { label: "Work in Progress", badgeColor: "blue", timelineStep: "workInProgress" },
  material_ready: { label: "Work in Progress", badgeColor: "blue", timelineStep: "workInProgress" },
  invoiced: { label: "Work in Progress", badgeColor: "blue", timelineStep: "workInProgress" },

  completed: { label: "Work Completed", badgeColor: "green", timelineStep: "completed" },

  paid: { label: "Payment Made", badgeColor: "amber", timelineStep: "paymentMade" },

  cancelled: { label: "Cancelled", badgeColor: "gray", timelineStep: "cancelled" },
};

const FALLBACK_CONFIG: StatusConfig = {
  label: "Unknown",
  badgeColor: "gray",
  timelineStep: "requestReceived",
};

// Derived label type — no separate hardcoded list to keep in sync
// export type ServiceStatusLabel = StatusConfig["label"];


/** Full config (label + badge color + timeline step) for a raw status. */
export function getStatusConfig(status?: string | null): StatusConfig {
  if (!status) return FALLBACK_CONFIG;
  const config = STATUS_CONFIG[status as ServiceStatus];
  if (config) return config;
  // Unknown/unmapped status from the API — don't crash, just surface it as-is
  return { ...FALLBACK_CONFIG, label: status };
}

export function getStatusLabel(status?: string | null): string {
  return getStatusConfig(status).label;
}

export function getStatusBadgeColor(status?: string | null): BadgeColor {
  return getStatusConfig(status).badgeColor;
}

export function getTimelineStepKey(status?: string | null): TimelineStepKey {
  return getStatusConfig(status).timelineStep;
}

// Note: ui.tsx's <Badge variant="..."> prop uses the exact same raw color
// names as BadgeColor above ('blue' | 'green' | 'amber' | 'red' | 'gray'),
// so no translation layer is needed — just pass getStatusBadgeColor()
// straight into <Badge variant={...} />.

// ---------------------------------------------------------------------------
// Timeline progress helpers — for a fixed-step progress bar like:
//
// const TIMELINE_STEPS = [
//   { key: 'requestReceived', icon: '✓' },
//   { key: 'technicianAssigned', icon: '✓' },
//   { key: 'enRouteLocation', icon: '→' },
//   { key: 'workInProgress', icon: '' },
//   { key: 'completed', icon: '' },
// ] as const;
//
// 'paid' and 'cancelled' are terminal states outside that 5-step visual flow,
// so they're handled as flags rather than a 6th/7th step.
// ---------------------------------------------------------------------------

const TIMELINE_STEP_ORDER: TimelineStepKey[] = [
  "requestReceived",
  "technicianAssigned",
  "enRouteLocation",
  "workInProgress",
  "completed",
];

// Display label per timeline step — used for the status filter dropdown so
// the same 7 groupings shown on the tracker page are what's selectable,
// instead of raw API values like "started" / "in_progress" / "invoiced".
const TIMELINE_STEP_LABELS: Record<TimelineStepKey, string> = {
  requestReceived: "Request Received",
  technicianAssigned: "Technician Assigned",
  enRouteLocation: "En Route to your Location",
  workInProgress: "Work in Progress",
  completed: "Work Completed",
  paymentMade: "Payment Made",
  cancelled: "Cancelled",
};

export interface StatusFilterOption {
  key: TimelineStepKey;
  label: string;
}

// All 7 timeline-step groupings, in the order they occur, for building a
// status filter <SelectField> — no "all" entry, add that in the UI layer.
export const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  ...TIMELINE_STEP_ORDER.map((key) => ({ key, label: TIMELINE_STEP_LABELS[key] })),
  { key: "paymentMade", label: TIMELINE_STEP_LABELS.paymentMade },
  { key: "cancelled", label: TIMELINE_STEP_LABELS.cancelled },
];

/**
 * True if a job's raw status belongs to the given timeline-step filter.
 * Use this instead of comparing job.status directly, since several raw
 * statuses (e.g. started/in_progress/invoiced) collapse into one step.
 */
export function matchesStatusFilter(status: string | null | undefined, filterKey: TimelineStepKey): boolean {
  return getTimelineStepKey(status) === filterKey;
}

export interface TimelineProgress {
  /** Index into TIMELINE_STEPS (0-based). Steps at index <= activeIndex render as done/active. */
  activeIndex: number;
  isCancelled: boolean;
  isPaid: boolean;
}

export function getTimelineProgress(status?: string | null): TimelineProgress {
  const { timelineStep } = getStatusConfig(status);

  if (timelineStep === "cancelled") {
    return { activeIndex: -1, isCancelled: true, isPaid: false };
  }

  if (timelineStep === "paymentMade") {
    // Payment happens after work is completed — treat as fully progressed + paid flag
    return { activeIndex: TIMELINE_STEP_ORDER.length - 1, isCancelled: false, isPaid: true };
  }

  const idx = TIMELINE_STEP_ORDER.indexOf(timelineStep);
  return { activeIndex: idx === -1 ? 0 : idx, isCancelled: false, isPaid: false };
}