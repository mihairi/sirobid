/**
 * API client for self-hosted Express backend.
 * When VITE_API_URL is set, the app uses the Express backend instead of Supabase.
 */

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export const isSelfHosted = !!API_URL;

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

function setToken(token: string) {
  localStorage.setItem("auth_token", token);
}

function clearToken() {
  localStorage.removeItem("auth_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

// ── Auth ──

export type ApiUser = {
  id: string;
  email: string;
};

type AuthResponse = {
  user: ApiUser;
  roles?: string[];
  token: string;
};

type MeResponse = {
  user: ApiUser;
  roles: string[];
};

export const api = {
  auth: {
    async signUp(email: string, password: string) {
      const data = await request<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      return data;
    },

    async signIn(email: string, password: string) {
      const data = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      return data;
    },

    async getMe(): Promise<MeResponse | null> {
      if (!getToken()) return null;
      try {
        return await request<MeResponse>("/auth/me");
      } catch {
        clearToken();
        return null;
      }
    },

    async forgotPassword(email: string) {
      return request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    signOut() {
      clearToken();
    },

    getToken,
  },

  // ── Auctions ──
  auctions: {
    list: () => request<any[]>("/auctions"),
    get: (id: string) => request<any>(`/auctions/${id}`),
    create: (data: any) =>
      request<any>("/auctions", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/auctions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/auctions/${id}`, { method: "DELETE" }),
  },

  // ── Bids ──
  bids: {
    listForAuction: (auctionId: string) =>
      request<any[]>(`/bids/auction/${auctionId}`),
    listAll: () => request<any[]>("/bids/admin"),
    place: (auction_item_id: string, amount: number) =>
      request<any>("/bids", {
        method: "POST",
        body: JSON.stringify({ auction_item_id, amount }),
      }),
  },

  // ── Health ──
  health: {
    async check(): Promise<boolean> {
      if (!API_URL) return false;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_URL}/health`, {
          signal: controller.signal,
          mode: "cors",
        });
        clearTimeout(timeout);
        return res.ok;
      } catch (err) {
        console.warn("[HealthCheck] Backend unreachable:", err);
        return false;
      }
    },
  },
};
