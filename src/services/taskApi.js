import { apiRequest } from "./apiClient";

function normalizeTask(raw) {
  if (!raw) return raw;
  return {
    id: raw._id,
    title: raw.title,
    description: raw.description || "",
    assigneeId: raw.assigneeId || null,
    recurrence: raw.recurrence,
    priority: raw.priority,
    status: raw.status && !(raw.done && raw.status === "A fazer")
      ? raw.status
      : raw.done
      ? "Feito"
      : "A fazer",
    done: raw.done || raw.status === "Feito" || raw.status === "Cancelada",
    lastCompletedAt: raw.lastCompletedAt || null,
    nextDueDate: raw.nextDueDate || null,
    dueDate: raw.dueDate || null,
    dueTime: raw.dueTime || null,
    weekDay: raw.weekDay != null ? raw.weekDay : null,
    monthDay: raw.monthDay != null ? raw.monthDay : null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Chamadas HTTP do domínio de tarefas. Nomeado taskApi (não taskService) para não
 * colidir com a lógica local de recorrência em services/recurrenceService.js. */
export const taskApi = {
  async list(residenceId) {
    const data = await apiRequest(`/residences/${residenceId}/tasks`);
    return data.map(normalizeTask);
  },

  async create(residenceId, input) {
    const data = await apiRequest(`/residences/${residenceId}/tasks`, { method: "POST", body: input });
    return normalizeTask(data);
  },

  async update(residenceId, taskId, input) {
    const data = await apiRequest(`/residences/${residenceId}/tasks/${taskId}`, { method: "PATCH", body: input });
    return normalizeTask(data);
  },

  async updateStatus(residenceId, taskId, status) {
    const data = await apiRequest(`/residences/${residenceId}/tasks/${taskId}/status`, {
      method: "PATCH",
      body: { status },
    });
    return normalizeTask(data);
  },

  async remove(residenceId, taskId) {
    await apiRequest(`/residences/${residenceId}/tasks/${taskId}`, { method: "DELETE" });
  },

  async complete(residenceId, taskId) {
    const data = await apiRequest(`/residences/${residenceId}/tasks/${taskId}/complete`, { method: "POST" });
    return normalizeTask(data);
  },

  async reopen(residenceId, taskId) {
    const data = await apiRequest(`/residences/${residenceId}/tasks/${taskId}/reopen`, { method: "POST" });
    return normalizeTask(data);
  },

  /** Automação de lembretes (recurso premium, SCRUM-27): tarefas recorrentes atrasadas/próximas do vencimento. */
  async getReminders(residenceId, { windowHours } = {}) {
    const queryStr = windowHours ? `?windowHours=${encodeURIComponent(windowHours)}` : "";
    return apiRequest(`/residences/${residenceId}/tasks/reminders${queryStr}`);
  },
};
