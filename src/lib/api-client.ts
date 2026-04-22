const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const AUTH_STORAGE_KEY = "portaria-auth";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthState(): { token: string | null } {
  if (typeof window === "undefined") return { token: null };
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return { token: null };
    const state = JSON.parse(stored);
    return { token: state.token ?? null };
  } catch {
    return { token: null };
  }
}

function getToken(): string | null {
  return getAuthState().token;
}

export function stringifyIds<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = { ...obj } as any;
  for (const key of Object.keys(result)) {
    if ((key === "id" || key.endsWith("_id")) && typeof result[key] === "number") {
      result[key] = String(result[key]);
    }
  }
  return result as T;
}

let isRedirecting = false;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !isRedirecting && !path.includes("/auth/")) {
    isRedirecting = true;
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      document.cookie = "portaria-auth-status=; path=/; max-age=0; SameSite=Strict";
      window.location.href = "/login";
    }
    throw new ApiError(401, "Sessao expirada");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();

  if (!response.ok || body.success === false) {
    throw new ApiError(response.status, body.error ?? "Erro desconhecido");
  }

  return body.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T = void>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    }),
};
