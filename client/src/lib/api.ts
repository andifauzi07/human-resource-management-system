import { useAuthStore, type User } from "../store/auth.store";

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:9000/api/v1";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export class ApiClientError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
  }
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });
    if (!res.ok) return false;
    const json = (await res.json()) as ApiEnvelope<{
      user: User;
      accessToken: string;
    }>;
    useAuthStore.getState().setAuth(json.data.accessToken, json.data.user);
    return true;
  } catch {
    useAuthStore.getState().clear();
    return false;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  _retry?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, _retry, headers, ...rest } = options;
  const token = useAuthStore.getState().accessToken;

  const reqHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined)
  };
  if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
  if (body !== undefined && !(body instanceof FormData)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: reqHeaders,
    credentials: "include",
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)
  });

  if (response.status === 401 && !_retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retry: true });
    }
  }

  const json = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (!response.ok) {
    const message = json?.message ?? `Request gagal (${response.status})`;
    throw new ApiClientError(message, response.status);
  }

  return json!.data;
}

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    return apiFetch<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: { email, password }
    });
  },
  async register(email: string, password: string, role?: User["role"]) {
    return apiFetch<{ id: string; email: string; role: User["role"] }>(
      "/auth/register",
      {
        method: "POST",
        body: { email, password, role }
      }
    );
  },
  async me(): Promise<User> {
    return apiFetch<User>("/auth/me");
  },
  async logout(): Promise<void> {
    await apiFetch<null>("/auth/logout", { method: "POST" });
    useAuthStore.getState().clear();
  }
};
