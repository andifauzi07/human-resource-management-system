import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { departmentsApi, departmentsEmployeesApi } from "./api";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput
} from "./api";

export const departmentsKeys = {
  all: ["departments"] as const
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentsKeys.all,
    queryFn: departmentsApi.list
  });
}

export function useActiveEmployees(enabled = false) {
  return useQuery({
    queryKey: ["employees"],
    queryFn: departmentsEmployeesApi.list,
    enabled,
    select: (employees) =>
      employees.filter((employee) => employee.status === "ACTIVE")
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDepartmentInput) => departmentsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
    }
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input
    }: {
      id: string;
      input: UpdateDepartmentInput;
    }) => departmentsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
    }
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
    }
  });
}
