"use client";

import type { SidebarUser } from "@/src/components/Sidebar";
import type { UnitSchema } from "@/src/lib/unitSchemas";

export type ReportStatus = "pending" | "reviewed";
export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "boolean"
  | "currency";

export interface GraphQLField {
  id: string;
  label: string;
  type: FieldType;
  value: string | number | boolean | string[] | null;
}

export interface GraphQLSection {
  title: string;
  fields: GraphQLField[];
}

export interface GraphQLComment {
  id: string;
  body: string;
  role: "ADMIN" | "CORE_LEADER";
  createdAt: string;
  authorUser?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
}

export interface GraphQLUnit {
  id: string;
  name: string;
  coreLeaderId?: string;
  formSchema?: UnitSchema | null;
  coreLeader?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  unitHead?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  reportCount: number;
  pendingCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphQLUser {
  id: string;
  name: string;
  email: string;
  role: SidebarUser["role"];
  unitId?: string | null;
  unitIds?: string[];
  unit?: GraphQLUnit | null;
  units?: GraphQLUnit[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphQLReport {
  id: string;
  title: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: string | null;
  unit?: GraphQLUnit | null;
  submittedByUser?: GraphQLUser | null;
  reviewedByUser?: GraphQLUser | null;
  comments?: GraphQLComment[];
  sections?: GraphQLSection[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  serviceType: string;
  male: number;
  female: number;
  children: number;
  firstTimers: number;
}

export interface OfferingRecord {
  id: string;
  date: string;
  serviceType: string;
  usheringCollected: number;
  usheringTithe: number;
  usheringSeed: number;
  usherHandoverTotal: number;
  financeOffering: number;
  offeringCollected: number;
  titheCollected: number;
  seedCollected: number;
  titheReceived: number;
  specialSeedReceived: number;
  financeHandoverTotal: number;
  otherIncomeReceived: number;
  directIncome: number;
  collected: number;
  banked: number;
  otherIncomeSource: string;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function toSidebarUser(user: GraphQLUser | null | undefined): SidebarUser {
  const unitNames =
    user?.units && user.units.length > 0
      ? user.units.map((unit) => unit.name)
      : user?.unit
        ? [user.unit.name]
        : [];

  return {
    name: user?.name ?? "User",
    role: user?.role ?? "UNIT_HEAD",
    unit: unitNames[0],
    units: unitNames,
  };
}

export function findField(report: GraphQLReport, fieldId: string): GraphQLField | null {
  for (const section of report.sections ?? []) {
    const field = section.fields.find((item) => item.id === fieldId);
    if (field) {
      return field;
    }
  }

  return null;
}

export function getFieldString(report: GraphQLReport, fieldId: string, fallback = "") {
  const field = findField(report, fieldId);
  if (!field || field.value == null) {
    return fallback;
  }

  if (Array.isArray(field.value)) {
    return field.value.join(", ");
  }

  return String(field.value);
}

export function getFieldNumber(report: GraphQLReport, fieldId: string) {
  const field = findField(report, fieldId);
  if (!field || field.value == null || field.value === "") {
    return 0;
  }

  return Number(field.value) || 0;
}

export function getServiceType(report: GraphQLReport) {
  return getFieldString(report, "serviceType", "Other");
}

export function sortReportsNewest(reports: GraphQLReport[]) {
  return [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function isWithinLastDays(iso: string, days: number) {
  const target = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  return target >= start && target <= now;
}

export function buildAttendanceRecords(reports: GraphQLReport[]): AttendanceRecord[] {
  return reports
    .map((report) => ({
      id: report.id,
      date: report.createdAt,
      serviceType: getServiceType(report),
      male: getFieldNumber(report, "maleCount"),
      female: getFieldNumber(report, "femaleCount"),
      children: getFieldNumber(report, "childrenCount"),
      firstTimers: getFieldNumber(report, "firstTimers"),
    }))
    .filter((record) => record.male || record.female || record.children || record.firstTimers);
}

export function buildOfferingRecords(reports: GraphQLReport[]): OfferingRecord[] {
  const keyed: Record<string, OfferingRecord> = {};

  for (const report of reports) {
    const serviceType = getServiceType(report);
    const serviceTitle = getFieldString(report, "serviceTitle").trim().toLowerCase();
    const key = serviceTitle
      ? `${serviceTitle}:${serviceType.toLowerCase()}`
      : `${report.createdAt.slice(0, 10)}:${serviceType.toLowerCase()}`;
    const current = keyed[key] ?? {
      id: key,
      date: report.createdAt,
      serviceType,
      usheringCollected: 0,
      usheringTithe: 0,
      usheringSeed: 0,
      usherHandoverTotal: 0,
      financeOffering: 0,
      offeringCollected: 0,
      titheCollected: 0,
      seedCollected: 0,
      titheReceived: 0,
      specialSeedReceived: 0,
      financeHandoverTotal: 0,
      otherIncomeReceived: 0,
      directIncome: 0,
      collected: 0,
      banked: 0,
      otherIncomeSource: "",
    };

    if (new Date(report.createdAt).getTime() < new Date(current.date).getTime()) {
      current.date = report.createdAt;
    }

    const usheringCollected = getFieldNumber(report, "offeringAmount");
    const usheringTithe = getFieldNumber(report, "titheAmount");
    const usheringSeed = getFieldNumber(report, "seedAmount");
    const financeCollected = getFieldNumber(report, "offeringReceived");
    const financeBanked = getFieldNumber(report, "offeringBanked");
    const totalIncomeBanked = getFieldNumber(report, "totalIncomeBanked");
    const titheReceived = getFieldNumber(report, "titheReceived");
    const specialSeedReceived = getFieldNumber(report, "specialSeedReceived");
    const otherIncomeReceived = getFieldNumber(report, "otherIncomeReceived");
    const otherIncomeSource = getFieldString(report, "otherIncomeSource").trim();

    if (usheringCollected > 0) {
      current.usheringCollected = Math.max(current.usheringCollected, usheringCollected);
    }

    if (usheringTithe > 0) {
      current.usheringTithe = Math.max(current.usheringTithe, usheringTithe);
    }

    if (usheringSeed > 0) {
      current.usheringSeed = Math.max(current.usheringSeed, usheringSeed);
    }

    if (financeCollected > 0) {
      current.financeOffering = Math.max(current.financeOffering, financeCollected);
    }

    if (titheReceived > 0) {
      current.titheReceived = Math.max(current.titheReceived, titheReceived);
    }

    if (specialSeedReceived > 0) {
      current.specialSeedReceived = Math.max(current.specialSeedReceived, specialSeedReceived);
    }

    if (otherIncomeReceived > 0) {
      current.otherIncomeReceived = Math.max(current.otherIncomeReceived, otherIncomeReceived);
    }

    if (otherIncomeSource && !current.otherIncomeSource.includes(otherIncomeSource)) {
      current.otherIncomeSource = current.otherIncomeSource
        ? `${current.otherIncomeSource}; ${otherIncomeSource}`
        : otherIncomeSource;
    }

    const bankedAmount = totalIncomeBanked > 0 ? totalIncomeBanked : financeBanked;
    if (bankedAmount > 0) {
      current.banked = Math.max(current.banked, bankedAmount);
    }

    current.offeringCollected = Math.max(
      current.offeringCollected,
      current.usheringCollected,
      current.financeOffering
    );
    current.titheCollected = Math.max(
      current.titheCollected,
      current.usheringTithe,
      current.titheReceived
    );
    current.seedCollected = Math.max(
      current.seedCollected,
      current.usheringSeed,
      current.specialSeedReceived
    );
    current.usherHandoverTotal =
      current.usheringCollected + current.usheringTithe + current.usheringSeed;
    current.financeHandoverTotal =
      current.financeOffering + current.titheReceived + current.specialSeedReceived;
    current.directIncome = current.otherIncomeReceived;
    current.collected =
      current.offeringCollected +
      current.titheCollected +
      current.seedCollected +
      current.directIncome;

    keyed[key] = current;
  }

  return Object.values(keyed).filter((record) => record.collected || record.banked);
}
