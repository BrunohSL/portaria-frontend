"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { EmployeeShift, ShiftType } from "@/types/employee";

export interface CreateShiftInput {
  type: ShiftType;
  start_time: string;
  end_time: string;
  days_of_week?: number[];
  rotation_start_date?: string;
  rotation_period_days?: number;
}

export function useCreateShift(condominiumId: string, employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShiftInput) =>
      apiClient.post<EmployeeShift>(`/api/condominiums/${condominiumId}/employees/${employeeId}/shifts`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", condominiumId] }); },
  });
}

export function useDeleteShift(condominiumId: string, employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: string) =>
      apiClient.delete(`/api/condominiums/${condominiumId}/employees/${employeeId}/shifts/${shiftId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", condominiumId] }); },
  });
}
