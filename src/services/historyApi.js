import { apiRequest } from "./apiClient";

/**
 * Normaliza uma entrada de histórico vinda do backend para o formato usado pelo app.
 * O backend retorna campos em português (tipo, descricao, data, morador, detalhes).
 */
function normalizeHistoryEntry(raw) {
  if (!raw) return raw;

  const tipo = (raw.tipo || "").toUpperCase();

  return {
    // Formato esperado pelo HistoryScreen: type = "task" | "expense"
    type:
      tipo === "TAREFA" || tipo === "TAREFAS"
        ? "task"
        : tipo === "DESPESA" || tipo === "DESPESAS"
          ? "expense"
          : tipo === "COMPRA" || tipo === "COMPRAS"
            ? "shopping"
            : "other",
    id: String(raw.id || raw._id),
    title: raw.descricao || "",
    description: raw.descricao || "",
    date: raw.data || raw.createdAt,
    // personId usado para filtro por morador
    personId: raw.morador?.id ? String(raw.morador.id) : null,
    personName: raw.morador?.nome || raw.morador?.name || null,
    // Detalhes extras dependendo do tipo
    value: raw.detalhes?.valor ?? null,
    detail: raw.detalhes
      ? [
          raw.detalhes.prioridade && `Prioridade: ${raw.detalhes.prioridade}`,
          raw.detalhes.recorrencia &&
            `Recorrência: ${raw.detalhes.recorrencia}`,
          raw.detalhes.quantidade && `Qtd: ${raw.detalhes.quantidade}`,
        ]
          .filter(Boolean)
          .join(" · ")
      : "",
  };
}

export const historyApi = {
  /**
   * Consulta o histórico unificado de tarefas, despesas e compras da residência.
   * Suporta filtros por tipo ('all' | 'task' | 'expense'), morador (residentId)
   * e intervalo de datas (dateFrom, dateTo).
   *
   * @param {string} residenceId
   * @param {{ type?: string, residentId?: string, dateFrom?: Date|string, dateTo?: Date|string }} filters
   */
  async list(residenceId, filters = {}) {
    const params = [`residenceId=${encodeURIComponent(residenceId)}`];

    if (filters.type && filters.type !== "all") {
      // Traduz para o formato esperado pelo backend
      const tipoMap = {
        task: "TAREFA",
        expense: "DESPESA",
        shopping: "COMPRA",
      };
      const tipo = tipoMap[filters.type] || filters.type;
      params.push(`tipo=${encodeURIComponent(tipo)}`);
    }

    if (filters.residentId) {
      params.push(`moradorId=${encodeURIComponent(filters.residentId)}`);
    }

    if (filters.dateFrom) {
      const d =
        filters.dateFrom instanceof Date
          ? filters.dateFrom.toISOString()
          : filters.dateFrom;
      params.push(`dataInicio=${encodeURIComponent(d)}`);
    }

    if (filters.dateTo) {
      const d =
        filters.dateTo instanceof Date
          ? filters.dateTo.toISOString()
          : filters.dateTo;
      params.push(`dataFim=${encodeURIComponent(d)}`);
    }

    const hasFilters =
      filters.type || filters.residentId || filters.dateFrom || filters.dateTo;
    const endpoint = hasFilters ? "/historico/filtrar" : "/historico";
    const queryStr = `?${params.join("&")}`;

    const data = await apiRequest(`${endpoint}${queryStr}`);

    // O backend retorna { dados: [...] }
    const items = Array.isArray(data) ? data : data?.dados || [];
    return items.map(normalizeHistoryEntry);
  },
};
