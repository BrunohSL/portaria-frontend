import type { EmployeeShift } from "@/types/employee";

export const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function timeToMinutes(timeStr: string): number {
  const parts = String(timeStr).split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function isTimeInWindow(date: Date, start: string, end: string): boolean {
  const cur = date.getHours() * 60 + date.getMinutes();
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s === e) return false;
  if (s < e) return cur >= s && cur < e;
  // Janela vira o dia
  return cur >= s || cur < e;
}

function getEffectiveDate(date: Date, start: string, end: string): Date {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  const cur = date.getHours() * 60 + date.getMinutes();
  const effective = new Date(date);
  effective.setHours(0, 0, 0, 0);
  if (s > e && cur < e) {
    effective.setDate(effective.getDate() - 1);
  }
  return effective;
}

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = String(dateStr).split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function isShiftActive(shift: EmployeeShift, date: Date = new Date()): boolean {
  if (!isTimeInWindow(date, shift.start_time, shift.end_time)) return false;
  const effective = getEffectiveDate(date, shift.start_time, shift.end_time);

  if (shift.type === "WEEKLY") {
    const weekday = effective.getDay();
    return Array.isArray(shift.days_of_week) && shift.days_of_week.includes(weekday);
  }

  if (shift.type === "ROTATION") {
    if (!shift.rotation_start_date || !shift.rotation_period_days) return false;
    const start = parseDateOnly(shift.rotation_start_date);
    const diffDays = Math.floor((effective.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return false;
    return diffDays % shift.rotation_period_days === 0;
  }

  return false;
}

export function isEmployeeOnDuty(shifts: EmployeeShift[] | undefined, date: Date = new Date()): boolean {
  if (!shifts || shifts.length === 0) return false;
  return shifts.some((s) => isShiftActive(s, date));
}

export function formatTimeShort(timeStr: string): string {
  // 'HH:MM:SS' -> 'HH:MM'
  return String(timeStr).slice(0, 5);
}

export function shiftSummary(shift: EmployeeShift): string {
  const time = `${formatTimeShort(shift.start_time)}-${formatTimeShort(shift.end_time)}`;
  if (shift.type === "WEEKLY") {
    const days = (shift.days_of_week || []).map((d) => DAY_LABELS[d]).join(", ");
    return `${days} ${time}`;
  }
  if (shift.type === "ROTATION") {
    return `Rotacao ${shift.rotation_period_days}d ${time}`;
  }
  return time;
}
