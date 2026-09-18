import { apiRequest } from "./apiClient";

export const historyApi = {
  /**
   * Consulta o histórico unificado de tarefas concluídas e despesas da residência.
   * Suporta filtros por tipo ('all' | 'task' | 'expense'), morador (residentId),
   * e intervalo de datas (dateFrom, dateTo).
   */
  async list(residenceId, filters = {}) {
    const params = [];
    if (filters.type && filters.type !== "all") {
      params.push(`type=${encodeURIComponent(filters.type)}`);
    }
    if (filters.residentId) {
      params.push(`residentId=${encodeURIComponent(filters.residentId)}`);
    }
    if (filters.dateFrom) {
      const d = filters.dateFrom instanceof Date ? filters.dateFrom.toISOString() : filters.dateFrom;
      params.push(`dateFrom=${encodeURIComponent(d)}`);
    }
    if (filters.dateTo) {
      const d = filters.dateTo instanceof Date ? filters.dateTo.toISOString() : filters.dateTo;
      params.push(`dateTo=${encodeURIComponent(d)}`);
    }

    const queryStr = params.length > 0 ? `?${params.join("&")}` : "";
    const data = await apiRequest(`/residences/${residenceId}/history${queryStr}`);
    return Array.isArray(data) ? data : (data?.history || data?.items || []);
  },
};
