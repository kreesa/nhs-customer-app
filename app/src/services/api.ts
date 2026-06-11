const BASE_URL = "https://nepalhomeservice.com";

import * as SecureStore from "expo-secure-store";

/* ─────────────────────────────────────────────
   TOKEN STORAGE (SecureStore - consistent)
──────────────────────────────────────────── */

export async function saveToken(token: string) {
  await SecureStore.setItemAsync("auth_token", token);
}

export async function getToken() {
  return SecureStore.getItemAsync("auth_token");
}

export async function removeToken() {
  return SecureStore.deleteItemAsync("auth_token");
}

/* ─────────────────────────────────────────────
   CORE REQUEST WRAPPER (clean + reusable)
──────────────────────────────────────────── */

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  return data;
}

/* ─────────────────────────────────────────────
   AUTH (MERGED LOGIN STYLE YOU ALREADY USE)
──────────────────────────────────────────── */

export async function login(
  email: string,
  password: string,
  device_name: string
) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      device_name,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

/* logout (kept simple + safe) */
export async function logout() {
  const token = await getToken();

  const response = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  await removeToken();

  return response.json();
}

/* ─────────────────────────────────────────────
   OPTIONAL: MODERN AUTH API (for future use)
   (you can switch to this later)
──────────────────────────────────────────── */

export const authApi = {
  login: (payload: {
    email: string;
    password: string;
    device_name?: string;
  }) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: any) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/* ─────────────────────────────────────────────
   CUSTOMER / SERVICES (from your second project)
──────────────────────────────────────────── */

export const customerApi = {
  getProfile: () => request("/api/customer/profile"),

  updateProfile: (data: any) =>
    request("/api/customer/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getLocation: () => request("/api/customer-location"),
};

export const categoryApi = {
  getCategories: () => request("/api/service-categories"),

  getSubCategories: (id: number) =>
    request(`/api/service-categories/${id}/sub-categories`),
};

export const serviceApi = {
  createRequest: (customerId: number, data: any) =>
    request(`/api/${customerId}/service-request`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRequest: (id: number) =>
    request(`/api/service-request/${id}`),

  getMyRequests: () =>
    request("/api/service-requests/my"),

  trackTechnician: (serviceId: number, technicianId: number) =>
    request(`/api/${serviceId}/track-technician/${technicianId}`),

  agreeToQuotation: (serviceId: number) =>
    request(`/api/${serviceId}/agree-quotation`, {
      method: "PUT",
    }),

  declineQuotation: (serviceId: number) =>
    request(`/api/${serviceId}/decline-quotation`, {
      method: "PUT",
    }),

  submitComplaint: (serviceId: number, complaint: string) =>
    request(`/api/${serviceId}/customer_complaints`, {
      method: "PUT",
      body: JSON.stringify({ customer_complaint: complaint }),
    }),
};

export const feedbackApi = {
  submit: (data: any) =>
    request("/api/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/* ─────────────────────────────────────────────
   FILE UPLOAD
──────────────────────────────────────────── */

export const uploadApi = {
  uploadImage: async (uri: string, type = "image/jpeg") => {
    const token = await getToken();

    const formData = new FormData();
    formData.append("file", {
      uri,
      type,
      name: `upload_${Date.now()}.jpg`,
    } as any);

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  },
};