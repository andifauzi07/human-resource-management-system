import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { employeesApi } from "./api";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  UpdateMyProfileInput
} from "./api";

export const employeesKeys = {
  all: ["employees"] as const,
  mine: ["employee-mine"] as const,
  detail: (id: string) => ["employee-detail", id] as const
};

export function useEmployees() {
  return useQuery({
    queryKey: employeesKeys.all,
    queryFn: employeesApi.list
  });
}

export function useAllEmployees(enabled = false) {
  return useQuery({
    queryKey: employeesKeys.all,
    queryFn: employeesApi.listAll,
    enabled
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: employeesKeys.mine,
    queryFn: employeesApi.mine
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeesKeys.detail(id),
    queryFn: () => employeesApi.getById(id),
    enabled: Boolean(id)
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => employeesApi.updateMine(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.mine });
    }
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => employeesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      queryClient.invalidateQueries({ queryKey: employeesKeys.mine });
    }
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input
    }: {
      id: string;
      input: UpdateEmployeeInput;
    }) => employeesApi.update(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      queryClient.invalidateQueries({ queryKey: employeesKeys.mine });
      queryClient.invalidateQueries({ queryKey: employeesKeys.detail(id) });
    }
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      queryClient.invalidateQueries({ queryKey: employeesKeys.mine });
    }
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => employeesApi.resetPassword(id)
  });
}