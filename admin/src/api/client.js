const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api/v1";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("adminToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await response.json();

  if (response.status === 401) {
    // Token expired or invalid: purge and redirect to login
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

export const adminApi = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  fetchOrganizations: () => request("/admin/organizations"),
  createOrganization: (payload) =>
    request("/admin/organizations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  toggleSubscription: (orgId, isActive) =>
    request(`/admin/organizations/${orgId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  fetchFAQs: (orgId) => request(`/admin/organizations/${orgId}/faqs`),
  createFAQ: (orgId, faq) =>
    request(`/admin/organizations/${orgId}/faqs`, {
      method: "POST",
      body: JSON.stringify(faq),
    }),
  // Add inside adminApi object in src/api/client.js:
  updateFAQ: (orgId, faqId, payload) =>
    request(`/admin/organizations/${orgId}/faqs/${faqId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateOrganization: (orgId, payload) =>
    request(`/admin/organizations/${orgId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
