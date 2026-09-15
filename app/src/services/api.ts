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

/** ─────────────────────────────────────────────
 * Core HTTP request wrapper used by all API calls.
 *
 * - Automatically attaches Bearer token if the user is logged in
 * - Parses JSON response body
 * - Throws a readable error if the response is not OK (4xx / 5xx)
 *
 * @param path    - API endpoint path e.g. '/api/auth/login'
 * @param options - Standard fetch options (method, body, headers etc.)
 * @returns       - Parsed JSON response typed as T
 * @throws        - Error with server message or fallback HTTP status
──────────────────────────────────────────── */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Retrieve stored auth token (null if not logged in)
  const token = await getToken();

  // Build headers — inject token if available
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

  // Attempt to parse body — fallback to empty object if not valid JSON
  const data = await response.json().catch(() => ({}));

  // Throw structured error for non-2xx responses
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
  device_name: string,
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

export async function forgotPassword(email: string, device_name: string) {
  const data = await request<any>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email,
      device_name,
    }),
  });

  return data;
}

/* ─────────────────────────────────────────────
   OPTIONAL: MODERN AUTH API (for future use)
   (you can switch to this later)
──────────────────────────────────────────── */

export const authApi = {
  login: (payload: { email: string; password: string; device_name?: string }) =>
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
   CUSTOMER / SERVICES
──────────────────────────────────────────── */

export const profileApi = {
  getProfile: () => request("/api/auth/me"),

  updateProfile: (data: any) =>
    request("/api/auth/me", {
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
  /**
   * Creates a new job/service request.
   * Sends multipart/form-data (NOT JSON) because photos are attached
   * directly to this endpoint — /api/jobs handles both the request
   * fields and the file uploads in one call.
   *
   * @param customerId  - kept for signature compatibility (also present in `data`)
   * @param data        - all non-file request fields
   * @param imageUris   - local file URIs from ImagePicker (already compressed, if applicable)
   */
  createRequest: async (
    customerId: number,
    data: ServiceRequestPayload,
    imageUris: string[] = [],
  ) => {
    const token = await getToken();
    const formData = new FormData();

    formData.append("customer_id", String(data.customer_id));
    formData.append("service_category_id", String(data.service_category_id));
    formData.append(
      "service_sub_category_id",
      String(data.service_sub_category_id),
    );
    formData.append("description", data.description);
    formData.append("site_address", data.site_address);
    formData.append("site_longitude", String(data.site_longitude));
    formData.append("site_latitude", String(data.site_latitude));
    formData.append("scheduled_for", data.scheduled_for);
    formData.append("scheduled_time_slot", data.scheduled_time_slot);
    formData.append("execution_mode", data.execution_mode);

    imageUris.forEach((uri, i) => {
      formData.append("files[]", {
        uri,
        type: "image/jpeg",
        name: `upload_${Date.now()}_${i}.jpg`,
      } as any);
    });

    const response = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // no Content-Type here — fetch sets multipart/form-data with the
        // correct boundary automatically when body is a FormData instance
      },
      body: formData,
    });

    const resData: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Preserve Laravel-style validation error shape ({ message, errors })
      // so existing error handling in request.tsx keeps working.
      const err: any = new Error(resData.message || `HTTP ${response.status}`);
      err.body = resData;
      throw err;
    }

    return resData?.data ?? resData;
  },

  getAvailableSlots: async (
    categoryId: number,
    subCategoryId: number,
    scheduledFor: string,
  ) =>
    request(
      `/api/jobs/available-slots?category_id=${categoryId}&sub_category_id=${subCategoryId}&scheduled_for=${scheduledFor}`,
      { method: "GET" },
    ),

  getRequest: async (id: number) => {
    const res: any = await request(`/api/jobs/${id}`);
    return res?.data ?? res;
  },

  getMyRequests: async () => {
    const res: any = await request("/api/jobs");
    return res?.data ?? res;
  },

  trackTechnician: async (serviceId: number, technicianId: number) => {
    const res: any = await request(
      `/api/${serviceId}/track-technician/${technicianId}`,
    );
    return res?.data ?? res;
  },

  getInvoice: async (id: number) => {
    const res: any = await request(`/api/jobs/${id}/invoice`);
    return res?.data ?? res;
  },

  submitPayment: async (
    serviceId: number,
    payload: { payment_method: "online" | "cash"; proof_url: string },
  ): Promise<void> => {
    return request(`/api/service-requests/${serviceId}/payment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  agreeToQuotation: (serviceId: number) =>
    request(`/api/${serviceId}/agree-quotation`, { method: "PUT" }),

  declineQuotation: (serviceId: number) =>
    request(`/api/${serviceId}/decline-quotation`, { method: "PUT" }),

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

/* ===========================================================
   NOTIFICATION
=========================================================== */
export interface NotificationItem {
  id: string;
  data: {
    event: string;
    title: string;
    message: string;
    data: {
      job_id: number;
      [key: string]: any;
    };
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
  unread_count: number;
}

export async function getNotifications(page: number = 1) {
  const data = await request<NotificationsResponse>(
    `/api/notifications?page=${page}`,
    { method: "GET" },
  );
  return data;
}

export async function deleteNotification(notificationId: string) {
  const data = await request<any>(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
  return data;
}

export async function markNotificationRead(notificationId: string) {
  const data = await request<any>(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  return data;
}
