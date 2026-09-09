const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? `?${qs}` : ""}`);
  },
  addTask: (data) =>
    request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id, data) =>
    request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id, data = {}) =>
    request(`/tasks/${id}`, { method: "DELETE", body: JSON.stringify(data) }),
  addComment: (taskId, data) =>
    request(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify(data) }),
  deleteComment: (taskId, commentId) =>
    request(`/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" }),
  getMilestones: () => request("/milestones"),
  addMilestone: (data) =>
    request("/milestones", { method: "POST", body: JSON.stringify(data) }),
  updateMilestone: (id, data) =>
    request(`/milestones/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteMilestone: (id) =>
    request(`/milestones/${id}`, { method: "DELETE" }),
  getActivity: (limit = 100) => request(`/activity?limit=${limit}`),
};